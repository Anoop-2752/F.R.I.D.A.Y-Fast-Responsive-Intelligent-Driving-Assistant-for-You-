import { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"

const BASE_URL = "http://localhost:8000"

const LABEL_COLORS = {
  person: "#f87171",
  car: "#fb923c",
  truck: "#fb923c",
  bus: "#fb923c",
  default: "#4ade80"
}

const ALERT_STYLES = {
  critical: { bar: "bg-red-500/95 border-red-400",   text: "text-white", dot: "bg-red-300" },
  warning:  { bar: "bg-amber-500/95 border-amber-400", text: "text-white", dot: "bg-amber-300" },
  info:     { bar: "bg-sky-500/95 border-sky-400",    text: "text-white", dot: "bg-sky-300" },
}

export default function CameraFeed({ detections, onAnalyze, activeAlert }) {
  const intervalRef = useRef(null)
  const [source, setSource] = useState("webcam")
  const [videos, setVideos] = useState([])
  const [activeVideo, setActiveVideo] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [locationInput, setLocationInput] = useState("")
  const [activeLocation, setActiveLocation] = useState("")

  const streamUrl = source === "video"
    ? `${BASE_URL}/video/stream`
    : `${BASE_URL}/vision/stream`

  const loadVideos = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/video/list`)
      setVideos(res.data.videos || [])
    } catch { setVideos([]) }
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
    } catch { alert("Could not select video.") }
  }

  const setLocation = async () => {
    const loc = locationInput.trim()
    if (!loc) return
    try {
      await axios.post(`${BASE_URL}/video/location`, { location: loc })
      setActiveLocation(loc)
      setLocationInput("")
    } catch { alert("Could not set location.") }
  }

  const switchToWebcam = async () => {
    await axios.delete(`${BASE_URL}/video/select`).catch(() => {})
    setSource("webcam")
    setActiveVideo("")
    setActiveLocation("")
    setLocationInput("")
  }

  const alertStyle = activeAlert ? ALERT_STYLES[activeAlert.severity] : null

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-white/5 rounded-sm overflow-hidden" style={{ background: "#0c0c14" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="font-hud text-xs tracking-[0.15em] text-white/50 uppercase">Vision / YOLOv8</span>
          <span className="font-hud text-[10px] tracking-widest border border-white/10 rounded-sm px-2 py-0.5 text-white/30">
            {source === "video" ? "DASHCAM" : "WEBCAM"}
          </span>
          {activeLocation && (
            <span className="font-hud text-[10px] tracking-widest border border-amber-400/30 rounded-sm px-2 py-0.5 text-amber-400/70">
              {activeLocation.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-data text-[10px] text-white/20">{detections.length} obj</span>
          {source === "video" ? (
            <button onClick={switchToWebcam} className="font-hud text-[10px] tracking-wider px-2 py-0.5 border border-sky-400/20 text-sky-400/60 hover:text-sky-400 hover:border-sky-400/40 transition-colors rounded-sm">
              WEBCAM
            </button>
          ) : (
            <button onClick={() => { loadVideos(); setShowPicker(true) }} className="font-hud text-[10px] tracking-wider px-2 py-0.5 border border-green-400/20 text-green-400/60 hover:text-green-400 hover:border-green-400/40 transition-colors rounded-sm">
              DASHCAM
            </button>
          )}
        </div>
      </div>

      {/* Video picker */}
      {showPicker && (
        <div className="border-b border-white/5 px-4 py-3" style={{ background: "#080810" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-hud text-[10px] tracking-widest text-white/30 uppercase">
              Videos — <span className="text-green-400/60">backend/videos/</span>
            </p>
            <button onClick={() => setShowPicker(false)} className="text-white/20 hover:text-white/50 text-xs">✕</button>
          </div>
          {videos.length === 0 ? (
            <p className="text-xs text-white/20">No videos found. Drop .mp4 / .avi / .mov into <span className="text-amber-400/60">backend/videos/</span>.</p>
          ) : (
            <div className="flex flex-col gap-0.5 max-h-28 overflow-y-auto">
              {videos.map(v => (
                <button key={v} onClick={() => selectVideo(v)}
                  className="text-left text-xs text-white/40 hover:text-green-400 px-2 py-1.5 hover:bg-white/3 transition-colors truncate font-data">
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Location bar */}
      {source === "video" && (
        <div className="border-b border-white/5 px-4 py-2 flex items-center gap-2" style={{ background: "#080810" }}>
          <span className="font-hud text-[10px] tracking-widest text-white/25 shrink-0 uppercase">City</span>
          <input
            type="text"
            value={locationInput}
            onChange={e => setLocationInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setLocation()}
            placeholder={activeLocation || "New York, Mumbai, Kochi..."}
            className="flex-1 bg-transparent border-none outline-none text-xs text-white/50 placeholder-white/15 font-data"
          />
          <button onClick={setLocation}
            className="font-hud text-[10px] tracking-wider px-2 py-0.5 border border-amber-400/20 text-amber-400/60 hover:text-amber-400 hover:border-amber-400/40 transition-colors rounded-sm shrink-0">
            SET
          </button>
        </div>
      )}

      {/* Feed */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center crosshair" style={{ background: "#050508" }}>
        <img
          key={streamUrl}
          src={streamUrl}
          alt="camera feed"
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display = "none" }}
        />

        {/* Scanline overlay */}
        <div className="scanlines" />

        {/* HUD corner brackets */}
        <div className="hud-corners" />

        {/* Extra corners */}
        <div className="absolute inset-3 pointer-events-none" style={{ zIndex: 2 }}>
          <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-sky-400/60" />
          <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-sky-400/60" />
        </div>

        {/* Bottom-left: REC indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 pointer-events-none" style={{ zIndex: 3 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-hud text-[9px] tracking-widest text-white/30 uppercase">Live</span>
        </div>

        {/* Bottom-right: detection count */}
        <div className="absolute bottom-4 right-4 pointer-events-none" style={{ zIndex: 3 }}>
          <span className="font-data text-[9px] text-sky-400/40 tracking-widest">{detections.length} OBJ</span>
        </div>

        {detections.length === 0 && (
          <p className="absolute font-hud text-xs tracking-widest text-white/15 uppercase pointer-events-none" style={{ zIndex: 3 }}>
            {source === "video" ? "Initialising feed..." : "Awaiting camera..."}
          </p>
        )}

        {activeVideo && (
          <div className="absolute top-4 left-4 font-data text-[10px] text-green-400/60 bg-black/60 px-2 py-1 max-w-[55%] truncate" style={{ zIndex: 3 }}>
            {activeVideo}
          </div>
        )}

        {/* Proactive alert banner */}
        {activeAlert && alertStyle && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 border ${alertStyle.bar} ${alertStyle.text} px-5 py-2.5 flex items-center gap-3 pointer-events-none shadow-2xl`} style={{ zIndex: 4 }}>
            <span className={`w-2 h-2 rounded-full ${alertStyle.dot} animate-ping`} />
            <span className="font-hud text-sm font-bold tracking-[0.15em] uppercase">{activeAlert.message}</span>
          </div>
        )}
      </div>

      {/* Detection tags */}
      <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5">
        {detections.map((d, i) => {
          const color = LABEL_COLORS[d.label] || LABEL_COLORS.default
          return (
            <span key={i} className="font-hud text-[10px] tracking-wider px-2 py-0.5 border rounded-sm flex items-center gap-1.5"
              style={{ color, borderColor: color + "30", background: color + "08" }}>
              {d.label.toUpperCase()}
              <span className="font-data text-[9px] opacity-50">{Math.round(d.confidence * 100)}%</span>
            </span>
          )
        })}
        {detections.length === 0 && (
          <span className="font-hud text-[10px] tracking-widest text-white/15 uppercase">No detections</span>
        )}
      </div>

    </div>
  )
}
