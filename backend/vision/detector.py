import cv2
from ultralytics import YOLO
import base64
import numpy as np

model = YOLO("yolov8n.pt")

RELEVANT_CLASSES = [
    "person", "car", "truck", "bus", "motorcycle",
    "bicycle", "traffic light", "stop sign", "dog"
]

def detect_frame(frame):
    results = model(frame, verbose=False)[0]
    detections = []

    for box in results.boxes:
        class_id = int(box.cls[0])
        class_name = model.names[class_id]
        confidence = float(box.conf[0])

        if class_name in RELEVANT_CLASSES and confidence > 0.5:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            detections.append({
                "label": class_name,
                "confidence": round(confidence, 2),
                "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
            })

            color = (0, 255, 0)
            if class_name == "person":
                color = (0, 0, 255)
            elif class_name in ["car", "truck", "bus"]:
                color = (0, 165, 255)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                frame,
                f"{class_name} {confidence:.2f}",
                (x1, y1 - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, color, 1
            )

    return frame, detections


def frame_to_base64(frame):
    _, buffer = cv2.imencode(".jpg", frame)
    return base64.b64encode(buffer).decode("utf-8")


def build_context_string(detections):
    if not detections:
        return "No objects detected ahead."

    counts = {}
    for d in detections:
        counts[d['label']] = counts.get(d['label'], 0) + 1

    summary = []
    for label, count in counts.items():
        summary.append(f"{count} {label}{'s' if count > 1 else ''}")

    return "Currently detected on road: " + ", ".join(summary)