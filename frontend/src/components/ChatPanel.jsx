import { useState, useRef, useEffect } from "react"
import { Mic, Send } from "lucide-react"

const TOOL_COLORS = {
  weather: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  navigation: "text-green-400 border-green-400/30 bg-green-400/10",
  vision: "text-amber-400 border-amber-400/30 bg-amber-400/10",
}

export default function ChatPanel({ messages, loading, onSend }) {
  const [input, setInput] = useState("")
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input)
    setInput("")
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-white/5 flex flex-col h-full">

      <div className="px-4 py-2 border-b border-white/5">
        <p className="text-xs text-gray-500 uppercase tracking-widest">F.R.I.D.A.Y — AI Co-pilot</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 max-h-96">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 max-w-[90%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}
          >
            <p className={`text-xs font-medium tracking-wider ${msg.role === "ai" ? "text-green-400" : "text-blue-400"}`}>
              {msg.role === "ai" ? "F.R.I.D.A.Y" : "You"}
            </p>

            <div className={`text-sm rounded-lg px-3 py-2 leading-relaxed ${
              msg.role === "ai"
                ? "bg-white/5 text-gray-200 border border-white/5"
                : "bg-blue-500/15 text-blue-200 border border-blue-500/20"
            }`}>
              {msg.text}
            </div>

            {msg.tools?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {msg.tools.map((tool, j) => (
                  <span
                    key={j}
                    className={`text-xs px-2 py-0.5 rounded-full border ${TOOL_COLORS[tool] || "text-gray-400 border-gray-400/30"}`}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="self-start bg-white/5 border border-white/5 rounded-lg px-3 py-2">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/5 flex items-center gap-2">
        <Mic size={16} className="text-green-400 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask F.R.I.D.A.Y anything..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-green-400/40"
        />
        <button
          onClick={handleSend}
          className="text-green-400 hover:text-green-300 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>

    </div>
  )
}