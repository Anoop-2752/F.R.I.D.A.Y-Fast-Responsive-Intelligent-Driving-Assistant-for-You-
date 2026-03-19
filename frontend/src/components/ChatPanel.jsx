import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Send, Loader, Volume2, VolumeX } from "lucide-react"
import { useVoice } from "../hooks/useVoice"

const TOOL_COLORS = {
  weather: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  navigation: "text-green-400 border-green-400/30 bg-green-400/10",
  vision: "text-amber-400 border-amber-400/30 bg-amber-400/10",
}

export default function ChatPanel({ messages, loading, onSend, onVoiceResult, speaking, voiceEnabled, onToggleVoice }) {
  const [input, setInput] = useState("")
  const bottomRef = useRef(null)

  const { recording, transcribing, toggle } = useVoice({ onResult: onVoiceResult })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input)
    setInput("")
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-white/5 flex flex-col flex-1 min-h-0">

      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-widest">F.R.I.D.A.Y — AI Co-pilot</p>

        {/* Speaker toggle */}
        <button
          onClick={onToggleVoice}
          title={voiceEnabled ? "Mute F.R.I.D.A.Y voice" : "Unmute F.R.I.D.A.Y voice"}
          className={`p-1 rounded transition-colors ${
            voiceEnabled
              ? speaking
                ? "text-green-400 animate-pulse"
                : "text-green-400 hover:text-green-300"
              : "text-gray-600 hover:text-gray-400"
          }`}
        >
          {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
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

        {(loading || transcribing) && (
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

      {recording && (
        <div className="mx-3 mb-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
          <span className="text-xs text-red-400">Recording — tap mic to stop</span>
        </div>
      )}

      {transcribing && (
        <div className="mx-3 mb-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <Loader size={12} className="text-amber-400 animate-spin" />
          <span className="text-xs text-amber-400">Transcribing audio...</span>
        </div>
      )}

      {speaking && voiceEnabled && (
        <div className="mx-3 mb-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <Volume2 size={12} className="text-green-400" />
          <span className="text-xs text-green-400">F.R.I.D.A.Y speaking...</span>
        </div>
      )}

      <div className="p-3 border-t border-white/5 flex items-center gap-2">
        <button
          onClick={toggle}
          className={`shrink-0 p-2 rounded-lg border transition-all ${
            recording
              ? "bg-red-500/20 border-red-500/40 text-red-400"
              : "bg-white/5 border-white/10 text-green-400 hover:border-green-400/40"
          }`}
        >
          {recording ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

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
          className="text-green-400 hover:text-green-300 transition-colors p-1"
        >
          <Send size={15} />
        </button>
      </div>

    </div>
  )
}
