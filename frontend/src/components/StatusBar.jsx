import { useState, useEffect } from "react"

export default function StatusBar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = time.getHours().toString().padStart(2, "0")
  const mm = time.getMinutes().toString().padStart(2, "0")
  const ss = time.getSeconds().toString().padStart(2, "0")
  const date = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

  return (
    <div className="flex items-center justify-between px-1 py-0.5">

      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="font-hud text-lg font-bold tracking-[0.2em] text-white">F.R.I.D.A.Y</span>
        </div>
        <span className="text-[10px] text-sky-400/60 tracking-widest uppercase font-hud border border-sky-400/20 px-2 py-0.5 rounded-sm">
          System Online
        </span>
      </div>

      {/* Center — Clock */}
      <div className="flex items-center gap-2">
        <span className="font-data text-white text-base tracking-widest">
          {hh}:{mm}<span className="text-white/30">:{ss}</span>
        </span>
        <span className="text-[10px] text-white/30 font-data">{date}</span>
      </div>

      {/* Right — Tech stack status */}
      <div className="flex items-center gap-2">
        {[
          { label: "YOLOv8", color: "bg-green-400" },
          { label: "Groq LLM", color: "bg-sky-400" },
          { label: "LangGraph", color: "bg-violet-400" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 border border-white/5 rounded-sm px-2 py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${color}`}></span>
            <span className="text-[10px] text-white/40 font-hud tracking-wider">{label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
