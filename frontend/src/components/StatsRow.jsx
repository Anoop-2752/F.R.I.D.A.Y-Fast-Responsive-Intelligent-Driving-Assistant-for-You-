export default function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-3">

      <div className="bg-gray-900 rounded-xl border border-white/5 p-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Hazards</p>
        <p className="text-xl font-medium text-amber-400">{stats.hazards}</p>
        <p className="text-xs text-gray-600 mt-1">active alerts</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-white/5 p-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">ETA</p>
        <p className="text-xl font-medium text-blue-400">{stats.eta}</p>
        <p className="text-xs text-gray-600 mt-1">estimated</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-white/5 p-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Detections</p>
        <p className="text-xl font-medium text-green-400">{stats.detections}</p>
        <p className="text-xs text-gray-600 mt-1">this session</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-white/5 p-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">AI latency</p>
        <p className="text-xl font-medium text-green-400">
          {stats.latency === "--" ? "--" : `${stats.latency}s`}
        </p>
        <p className="text-xs text-gray-600 mt-1">avg response</p>
      </div>

    </div>
  )
}