export default function StatusBar() {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        <span className="text-green-400 text-sm font-medium tracking-widest">F.R.I.D.A.Y</span>
        <span className="text-gray-600 text-xs">Fast Responsive Intelligent Driving Assistant for You</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600">LangGraph</span>
        <span className="text-gray-700">·</span>
        <span className="text-xs text-gray-600">Groq LLM</span>
        <span className="text-gray-700">·</span>
        <span className="text-xs text-gray-600">YOLOv8</span>
      </div>
    </div>
  )
}