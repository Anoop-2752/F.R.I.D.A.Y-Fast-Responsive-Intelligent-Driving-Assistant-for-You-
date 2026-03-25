from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from groq import Groq
from vision.detector import detect_frame, build_context_string
from agents.orchestrator import run_agent
import cv2
import os
import time
import threading
import queue
from pathlib import Path

load_dotenv()

app = FastAPI(title="F.R.I.D.A.Y - Fast Responsive Intelligent Driving Assistant for You")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

VIDEOS_DIR = Path(__file__).parent / "videos"
VIDEOS_DIR.mkdir(exist_ok=True)


# ── Background YOLO detector ─────────────────────────────────────────────────
# Runs inference in its own thread. The stream submits frames non-blocking
# and always reads the latest result — video/webcam never waits for YOLO.

class BackgroundDetector:
    def __init__(self):
        self._queue = queue.Queue(maxsize=1)   # drop old frames, keep newest
        self._lock = threading.Lock()
        self._detections = []
        t = threading.Thread(target=self._worker, daemon=True)
        t.start()

    def submit(self, frame):
        try:
            self._queue.put_nowait(frame)
        except queue.Full:
            pass  # busy — skip this frame, next one will be submitted

    def get(self):
        with self._lock:
            return list(self._detections)

    def _worker(self):
        while True:
            frame = self._queue.get()
            _, detections = detect_frame(frame)
            with self._lock:
                self._detections = detections
            time.sleep(0.35)  # max ~3 YOLO inferences/sec — frees CPU for video stream


# ── Shared webcam buffer ─────────────────────────────────────────────────────

_webcam_lock = threading.Lock()
_latest_webcam_frame = None


def _webcam_reader():
    global _latest_webcam_frame
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        if ret:
            with _webcam_lock:
                _latest_webcam_frame = frame.copy()
        else:
            time.sleep(0.05)


threading.Thread(target=_webcam_reader, daemon=True).start()

# One shared YOLO worker for webcam
_webcam_detector = BackgroundDetector()


def get_webcam_frame():
    with _webcam_lock:
        return _latest_webcam_frame.copy() if _latest_webcam_frame is not None else None


# ── Video source state ───────────────────────────────────────────────────────

active_video: str | None = None
active_location: str | None = None   # city the video was recorded in


# ── Draw helpers ─────────────────────────────────────────────────────────────

def _draw_boxes(frame, detections):
    """Draw saved detections onto a frame without running YOLO."""
    LABEL_COLORS = {
        "person": (0, 0, 255),
        "car": (0, 165, 255), "truck": (0, 165, 255), "bus": (0, 165, 255),
    }
    for d in detections:
        b = d["box"]
        color = LABEL_COLORS.get(d["label"], (0, 255, 0))
        cv2.rectangle(frame, (b["x1"], b["y1"]), (b["x2"], b["y2"]), color, 2)
        cv2.putText(frame, f"{d['label']} {d['confidence']}",
                    (b["x1"], b["y1"] - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    return frame


def _encode(frame):
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return buffer.tobytes()


def _mjpeg_frame(jpg_bytes):
    return b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg_bytes + b"\r\n"


# ── MJPEG streams ────────────────────────────────────────────────────────────

def _mjpeg_webcam():
    """Webcam at ~30fps. YOLO runs in BackgroundDetector, never blocks the stream."""
    while True:
        frame = get_webcam_frame()
        if frame is None:
            time.sleep(0.033)
            continue

        _webcam_detector.submit(frame.copy())
        annotated = _draw_boxes(frame, _webcam_detector.get())

        yield _mjpeg_frame(_encode(annotated))
        time.sleep(0.033)


def _mjpeg_video(path: str):
    """Video at native fps. YOLO runs in its own BackgroundDetector thread."""
    detector = BackgroundDetector()
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    delay = 1 / fps

    try:
        while True:
            t0 = time.time()

            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = cap.read()
                if not ret:
                    break

            # Non-blocking submit to YOLO — stream never waits for it
            detector.submit(frame.copy())

            # Draw latest available detections on current frame
            annotated = _draw_boxes(frame, detector.get())

            yield _mjpeg_frame(_encode(annotated))

            # Sleep only the leftover time to hit native fps
            elapsed = time.time() - t0
            remaining = delay - elapsed
            if remaining > 0:
                time.sleep(remaining)
    finally:
        cap.release()


# ── Helper: single frame for analyze/chat/voice ──────────────────────────────

def grab_frame():
    if active_video:
        cap = cv2.VideoCapture(active_video)
        ret, frame = cap.read()
        cap.release()
        return ret, frame
    frame = get_webcam_frame()
    return (frame is not None, frame)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "F.R.I.D.A.Y is online"}


# -- Video folder ------------------------------------------------------------

@app.get("/video/list")
def video_list():
    exts = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
    files = sorted(f.name for f in VIDEOS_DIR.iterdir() if f.suffix.lower() in exts)
    return {"videos": files}


@app.post("/video/select/{filename}")
def video_select(filename: str):
    global active_video
    path = VIDEOS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found in videos folder")
    active_video = str(path)
    return {"status": "selected", "filename": filename}


@app.delete("/video/select")
def video_clear():
    global active_video, active_location
    active_video = None
    active_location = None
    return {"status": "cleared"}


@app.post("/video/location")
async def set_location(payload: dict):
    global active_location
    active_location = payload.get("location", "").strip() or None
    return {"status": "ok", "location": active_location}


# -- Streams -----------------------------------------------------------------

@app.get("/vision/stream")
async def vision_stream():
    return StreamingResponse(
        _mjpeg_webcam(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/video/stream")
async def video_stream():
    if not active_video:
        raise HTTPException(status_code=400, detail="No video selected")
    return StreamingResponse(
        _mjpeg_video(active_video),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


# -- Vision analyze ----------------------------------------------------------

@app.post("/vision/analyze")
async def vision_analyze():
    ret, frame = grab_frame()
    if not ret or frame is None:
        return {"context": "Camera not available", "detections": []}

    _, detections = detect_frame(frame)
    context = build_context_string(detections)
    return {"detections": detections, "context": context}


# -- Chat / Voice ------------------------------------------------------------

@app.post("/chat")
async def chat(payload: dict):
    user_message = payload.get("message", "")

    ret, frame = grab_frame()
    vision_context = ""
    if ret and frame is not None:
        _, detections = detect_frame(frame)
        vision_context = build_context_string(detections)

    result = run_agent(message=user_message, vision_context=vision_context, location_context=active_location)
    return result


@app.post("/voice")
async def voice(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    filename = file.filename or "recording.webm"
    content_type = file.content_type or "audio/webm"

    transcription = client.audio.transcriptions.create(
        file=(filename, audio_bytes, content_type),
        model="whisper-large-v3-turbo",
        response_format="text"
    )

    user_text = transcription if isinstance(transcription, str) else transcription.text

    ret, frame = grab_frame()
    vision_context = ""
    if ret and frame is not None:
        _, detections = detect_frame(frame)
        vision_context = build_context_string(detections)

    result = run_agent(message=user_text, vision_context=vision_context, location_context=active_location)
    return {"transcription": user_text, **result}
