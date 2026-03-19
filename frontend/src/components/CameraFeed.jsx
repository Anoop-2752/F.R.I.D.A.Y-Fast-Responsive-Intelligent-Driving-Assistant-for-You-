import { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"

const BASE_URL = "http://localhost:8000"

const COLORS = {
  person: "#E24B4A",
  car: "#EF9F27",
  truck: "#EF9F27",
  bus: "#EF9F27",
  default: "#5DCAA5"
}

const ALERT_STYLES = {
  critical: "bg-red-500/90 border-red-400 text-white",
  warning:  "bg-amber-500/90 border-amber-400 text-white",
  info:     "bg-blue-500/90 border-blue-400 text-white",
}

export default function CameraFeed({ detections, onAnalyze, activeAlert }) {
  const intervalRef = useRef(null)
  const [source, setSource] = useState("webcam")
  const [videos, setVideos] = useState([])
  const [activeVideo, setActiveVideo] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [locationInput, setLocationInput] = useState("")
  const [activeLocation, setActiveLocation] = useState("")

  const streamUrl =
    source === "video"
      ? `${BASE_URL}/video/stream`
      : `${BASE_URL}/vision/stream`

  const loadVideos = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/video/list`)
      setVideos(res.data.videos || [])
    } catch {
      setVideos([])
    }
  }, [])

  useEffect(() => {
    onAnalyze()
    intervalRef.current = setInterval(onAnalyze, 3000)
    return () => clearInterval(intervalRef.current)
  }, [onAnalyze])

  const selectVideo = async (filename) => {
    try {
      await axios.post(`${BASE_URL}/video/select/${encodeURIComponent(filename)}`)
      setActiveVideo(filename)
      setSource("video")
      setShowPicker(false)
    } catch {
      alert("Could not select video. Check backend.")
    }
  }

  const setLocation = async () => {
    const loc = locationInput.trim()
    if (!loc) return
    try {
      await axios.post(`${BASE_URL}/video/location`, { location: loc })
      setActiveLocation(loc)
      setLocationInput("")
    } catch {
      alert("Could not set location.")
    }
  }

  const switchToWebcam = async () => {
    await axios.delete(`${BASE_URL}/video/select`).catch(() => {})
    setSource("webcam")
    setActiveVideo("")
    setActiveLocation("")
    setLocationInput("")
  }

  const openPicker = () => {
    loadVideos()
    setShowPicker(true)
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden flex flex-col flex-1 min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs text-gray-400 font-medium">YOLOv8 live</span>
          <span className="text-xs text-green-400 border border-green-400/30 rounded px-1.5 py-0.5">
            {source === "video" ? "dashcam" : "webcam"}
          </span>
          {activeLocation && (
            <span className="text-xs text-amber-400 border border-amber-400/30 rounded px-1.5 py-0.5">
              {activeLocation}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{detections.length} objects detected</span>
          {source === "video" ? (
            <button
              onClick={switchToWebcam}
              className="text-xs px-2 py-0.5 rounded border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 transition-colors"
            >
              Use Webcam
            </button>
          ) : (
            <button
              onClick={openPicker}
              className="text-xs px-2 py-0.5 rounded border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-colors"
            >
              Load Dashcam
            </button>
          )}
        </div>
      </div>

      {/* Video picker */}
      {showPicker && (
        <div className="border-b border-white/5 bg-gray-950 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">
              Videos in <span className="text-green-400">backend/videos/</span>
            </p>
            <button onClick={() => setShowPicker(false)} className="text-xs text-gray-600 hover:text-gray-400">✕</button>
          </div>
          {videos.length === 0 ? (
            <p className="text-xs text-gray-600">
              No videos found. Drop .mp4 / .avi / .mov files into <span className="text-amber-400">backend/videos/</span>.
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {videos.map((v) => (
                <button
                  key={v}
                  onClick={() => selectVideo(v)}
                  className="text-left text-xs text-gray-300 hover:text-green-400 px-2 py-1.5 rounded hover:bg-white/5 transition-colors truncate"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Location bar — shown when video is active */}
      {source === "video" && (
        <div className="border-b border-white/5 bg-gray-950 px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Video city:</span>
          <input
            type="text"
            value={locationInput}
            onChange={e => setLocationInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setLocation()}
            placeholder={activeLocation || "e.g. New York, Mumbai, Kochi..."}
            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-amber-400/40"
          />
          <button
            onClick={setLocation}
            className="text-xs px-2 py-1 rounded border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition-colors shrink-0"
          >
            Set
          </button>
        </div>
      )}

      {/* Feed */}
      <div className="relative bg-gray-950 flex-1 min-h-0 flex items-center justify-center">
        <img
          key={streamUrl}
          src={streamUrl}
          alt="camera feed"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none" }}
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {detections.length === 0 && (
            <p className="text-gray-600 text-sm">
              {source === "video" ? "Processing dashcam..." : "Waiting for camera feed..."}
            </p>
          )}
        </div>

        {activeVideo && (
          <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-1 max-w-[60%]">
            <span className="text-green-400 text-xs truncate block">{activeVideo}</span>
          </div>
        )}

        {activeAlert && (
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 border rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg animate-pulse pointer-events-none ${ALERT_STYLES[activeAlert.severity]}`}>
            <span className="text-sm font-semibold tracking-wide">{activeAlert.message}</span>
          </div>
        )}

        <div className="absolute bottom-3 right-3 bg-black/60 rounded-lg px-3 py-1">
          <span className="text-white text-sm font-medium">62 km/h</span>
        </div>
      </div>

      {/* Detections */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {detections.map((d, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-full border font-medium"
            style={{
              color: COLORS[d.label] || COLORS.default,
              borderColor: (COLORS[d.label] || COLORS.default) + "40"
            }}
          >
            {d.label} {d.confidence}
          </span>
        ))}
        {detections.length === 0 && (
          <span className="text-xs text-gray-600">No detections yet</span>
        )}
      </div>

    </div>
  )
}
