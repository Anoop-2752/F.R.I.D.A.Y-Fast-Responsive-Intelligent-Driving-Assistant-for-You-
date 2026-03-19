from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from groq import Groq
from vision.detector import detect_frame, frame_to_base64, build_context_string
import cv2
import os

load_dotenv()

app = FastAPI(title="F.R.I.D.A.Y - AI Car Co-pilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are F.R.I.D.A.Y, an intelligent in-car AI co-pilot assistant.
You are helpful, concise, and safety-aware.
Always keep responses short and clear since the driver is on the road.
Never give long responses — max 2-3 sentences."""


@app.get("/")
def root():
    return {"status": "F.R.I.D.A.Y is online"}


@app.post("/chat")
async def chat(payload: dict):
    user_message = payload.get("message", "")

    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()

    vision_context = ""
    if ret:
        _, detections = detect_frame(frame)
        vision_context = build_context_string(detections)

    full_message = f"{vision_context}\n\nDriver says: {user_message}"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": full_message}
        ]
    )

    return {
        "response": response.choices[0].message.content,
        "vision_context": vision_context
    }


@app.post("/voice")
async def voice(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    transcription = client.audio.transcriptions.create(
        file=(file.filename, audio_bytes),
        model="whisper-large-v3-turbo",
    )

    user_text = transcription.text

    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()

    vision_context = ""
    if ret:
        _, detections = detect_frame(frame)
        vision_context = build_context_string(detections)

    full_message = f"{vision_context}\n\nDriver says: {user_text}"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": full_message}
        ]
    )

    return {
        "transcription": user_text,
        "response": response.choices[0].message.content,
        "vision_context": vision_context
    }


@app.get("/vision/stream")
async def vision_stream():
    def generate():
        cap = cv2.VideoCapture(0)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame, _ = detect_frame(frame)
            jpg = frame_to_base64(frame)
            yield f"data: {jpg}\n\n"

        cap.release()

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/vision/analyze")
async def vision_analyze():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        return {"context": "Camera not available", "detections": []}

    _, detections = detect_frame(frame)
    context = build_context_string(detections)

    return {
        "detections": detections,
        "context": context
    }