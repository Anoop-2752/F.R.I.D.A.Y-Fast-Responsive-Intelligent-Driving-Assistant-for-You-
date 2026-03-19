import { useEffect, useRef } from "react"

const COLORS = {
  person: "#E24B4A",
  car: "#EF9F27",
  truck: "#EF9F27",
  bus: "#EF9F27",
  default: "#5DCAA5"
}

export default function CameraFeed({ detections, onAnalyze }) {
  const intervalRef = useRef(null)

  useEffect(() => {
    onAnalyze()
    intervalRef.current = setInterval(onAnalyze, 3000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden">

      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs text-gray-400 font-medium">YOLOv8 live</span>
          <span className="text-xs text-green-400 border border-green-400/30 rounded px-1.5 py-0.5">28 fps</span>
        </div>
        <span className="text-xs text-gray-500">{detections.length} objects detected</span>
      </div>

      <div className="relative bg-gray-950 h-56 flex items-center justify-center">
        <img
          src="http://localhost:8000/vision/stream"
          alt="camera feed"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none" }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          {detections.length === 0 && (
            <p className="text-gray-600 text-sm">Waiting for camera feed...</p>
          )}
        </div>

        <div className="absolute bottom-3 right-3 bg-black/60 rounded-lg px-3 py-1">
          <span className="text-white text-sm font-medium">62 km/h</span>
        </div>
      </div>

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