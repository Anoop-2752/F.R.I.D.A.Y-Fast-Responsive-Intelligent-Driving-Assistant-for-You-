export default function StatsRow({ stats }) {
  const items = [
    { label: "HAZARDS",    value: stats.hazards,  unit: "",  color: "text-amber-400" },
    { label: "ETA",        value: stats.eta,       unit: "",  color: "text-sky-400"   },
    { label: "DETECTIONS", value: stats.detections,unit: "",  color: "text-green-400" },
    { label: "AI LATENCY", value: stats.latency === "--" ? "--" : `${stats.latency}s`, unit: "", color: "text-green-400" },
  ]

  return (
    <div className="flex border border-white/5 rounded-sm overflow-hidden" style={{ background: "#0c0c14" }}>
      {items.map(({ label, value, color }, i) => (
        <div
          key={label}
          className={`flex-1 flex flex-col justify-center px-4 py-2 ${i < 3 ? "border-r border-white/5" : ""}`}
        >
          <p className="text-[9px] text-white/30 tracking-[0.2em] font-hud mb-0.5">{label}</p>
          <p className={`font-data text-xl font-medium ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}
