import { useState } from "react"


export default function StatsRow({ stats }) {
  const [speed, setSpeed] = useState(0)

  const items = [
    { label: "HAZARDS",    value: stats.hazards,                                             color: "text-amber-400" },
    { label: "SPEED",      value: null,                                                      color: "text-sky-400"   },
    { label: "ETA",        value: stats.eta,                                                 color: "text-sky-400"   },
    { label: "AI LATENCY", value: stats.latency === "--" ? "--" : `${stats.latency}s`,       color: "text-green-400" },
  ]

  return (
    <div className="flex border border-white/5 rounded-sm overflow-hidden" style={{ background: "#0c0c14" }}>
      {items.map(({ label, value, color }, i) => (
        <div key={label} className={`flex-1 flex flex-col justify-center px-4 py-2 ${i < 3 ? "border-r border-white/5" : ""}`}>
          <p className="text-[9px] text-white/30 tracking-[0.2em] font-hud mb-0.5">{label}</p>

          {label === "SPEED" ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setSpeed(s => Math.max(0, s - 10))}
                className="text-white/20 hover:text-sky-400 font-data text-sm leading-none transition-colors">−</button>
              <span className={`font-data text-xl font-medium ${color}`}>{speed}<span className="text-xs text-white/25 ml-0.5">km/h</span></span>
              <button onClick={() => setSpeed(s => Math.min(220, s + 10))}
                className="text-white/20 hover:text-sky-400 font-data text-sm leading-none transition-colors">+</button>
            </div>
          ) : (
            <p className={`font-data text-xl font-medium ${color}`}>{value}</p>
          )}
        </div>
      ))}
    </div>
  )
}
