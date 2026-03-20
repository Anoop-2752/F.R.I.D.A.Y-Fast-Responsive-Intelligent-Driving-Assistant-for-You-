# F.R.I.D.A.Y
### Fast Responsive Intelligent Driving Assistant for You

An AI-powered in-car co-pilot that combines real-time computer vision, voice interaction, navigation, and weather intelligence into a single automotive dashboard.

---

## Features

- **Real-time Object Detection** — YOLOv8s detects pedestrians, vehicles, cyclists, traffic signs and more from live webcam or dashcam footage
- **Proactive Safety Alerts** — Automatically warns the driver when a pedestrian or hazard is detected in the driving path — no prompt needed
- **Voice Interaction** — Speak to F.R.I.D.A.Y using your microphone. Whisper (via Groq) transcribes speech, LLaMA 3.3-70B responds, Web Speech API reads the response aloud
- **AI Chat** — Ask anything: road conditions, weather, navigation — F.R.I.D.A.Y responds in 1–2 sentences optimised for driving context
- **Live Navigation** — Ask to navigate somewhere and a real-time route map appears with distance and ETA (powered by OSRM + OpenStreetMap, no API key needed)
- **Weather Intelligence** — Real-time weather for your current city or the city in your dashcam footage
- **Dashcam Mode** — Load a local dashcam video and set the recording city so weather and navigation context align correctly
- **HUD Interface** — Automotive-grade dark UI with instrument cluster stats and HUD corner overlays

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│                                                             │
│  CameraFeed   ChatPanel   MapView   StatsRow   StatusBar   │
│                    │                                        │
│            useFriday hook (state, alerts, speech)          │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                      │
│                                                             │
│  /vision/stream     /vision/analyze    /chat    /voice     │
│       │                   │               └────────┘       │
│  MJPEG stream         YOLOv8s            LangGraph Agent   │
│  (30fps, non-         detector           router → responder│
│   blocking)           (background                          │
│                        thread)                             │
└──────────────────────────────────────┬──────────────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │     External Services   │
                          │  Groq — LLaMA 3.3-70B  │
                          │  Groq — Whisper STT     │
                          │  OpenWeatherMap API     │
                          │  Nominatim (geocoding)  │
                          │  OSRM (routing)         │
                          └─────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Maps | React Leaflet, Esri tiles, OSRM, Nominatim |
| Backend | FastAPI, Uvicorn |
| AI Orchestration | LangGraph, LangChain, LLaMA 3.3-70B via Groq |
| Speech | Whisper (Groq), Web Speech API (TTS) |
| Vision | YOLOv8s (Ultralytics), OpenCV |
| Weather | OpenWeatherMap API |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Webcam (or dashcam video files)

### 1. Clone the repo
```bash
git clone https://github.com/Anoop-2752/F.R.I.D.A.Y-Fast-Responsive-Intelligent-Driving-Assistant-for-You-.git
cd F.R.I.D.A.Y-Fast-Responsive-Intelligent-Driving-Assistant-for-You-
```

### 2. Backend setup
```bash
cd backend

# Create and activate virtual environment
python -m venv friday
friday\Scripts\activate        # Windows
# source friday/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Add your API keys to .env
```

### 3. Environment variables
```env
GROQ_API_KEY=your_groq_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

- **Groq API key** — Free at [console.groq.com](https://console.groq.com)
- **OpenWeatherMap key** — Free at [openweathermap.org/api](https://openweathermap.org/api) (1000 calls/day free)

### 4. Frontend setup
```bash
cd frontend
npm install
```

### 5. Run

**Terminal 1 — Backend:**
```bash
cd backend
friday\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Usage

### Voice commands (examples)
| Say | What happens |
|---|---|
| *"What's in front of me?"* | Vision analysis of current frame |
| *"What's the weather like?"* | Real-time weather for current city |
| *"Navigate to Bangalore"* | Route map with distance and ETA |
| *"Is it safe to drive?"* | Context-aware safety assessment |
| *"Any hazards ahead?"* | YOLO detection summary |

### Dashcam mode
1. Drop `.mp4 / .avi / .mov` files into `backend/videos/`
2. Click **DASHCAM** in the feed header and select the file
3. Set the **City** field to match where the video was recorded
4. F.R.I.D.A.Y uses that city for weather and navigation context

### Proactive alerts
No interaction needed — F.R.I.D.A.Y automatically detects and announces hazards in the driving path while the vehicle is in motion.

---

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app, MJPEG streams, endpoints
│   ├── agents/
│   │   └── orchestrator.py      # LangGraph agent (router + responder)
│   ├── tools/
│   │   ├── weather.py           # OpenWeatherMap integration
│   │   └── maps.py              # Nominatim geocoding + OSRM routing
│   ├── vision/
│   │   └── detector.py          # YOLOv8s inference + context builder
│   └── videos/                  # Place dashcam videos here (gitignored)
└── frontend/
    └── src/
        ├── components/          # CameraFeed, ChatPanel, MapView, StatsRow, StatusBar
        ├── hooks/               # useFriday, useVoice, useSpeech
        └── pages/               # Dashboard
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/vision/stream` | MJPEG webcam stream with YOLO overlays |
| GET | `/video/stream` | MJPEG dashcam stream with YOLO overlays |
| POST | `/vision/analyze` | Single frame detection |
| POST | `/chat` | Text → AI response |
| POST | `/voice` | Audio → transcription + AI response |
| GET | `/video/list` | List available dashcam videos |
| POST | `/video/select/{filename}` | Set active dashcam video |
| POST | `/video/location` | Set city context for active video |
| DELETE | `/video/select` | Switch back to webcam |

---

## License

MIT
