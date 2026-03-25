import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react"
import { useVoice } from "../hooks/useVoice"

const TOOL_COLORS = {
  weather:    "text-sky-400 border-sky-400/30",
  navigation: "text-green-400 border-green-400/30",
  vision:     "text-amber-400 border-amber-400/30",
}

function Timestamp() {
  const now = new Date()
  const hh = now.getHours().toString().padStart(2, "0")
  const mm = now.getMinutes().toString().padStart(2, "0")
  return <span className="font-data text-[9px] text-white/15 ml-1">{hh}:{mm}</span>
}

function Waveform() {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[0.4, 0.9, 0.6, 1, 0.7, 0.5, 0.8].map((delay, i) => (
        <div key={i} className="waveform-bar h-full" style={{ animationDelay: `${delay * 0.3}s` }} />
      ))}
    </div>
  )
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
    <div className="flex flex-col flex-1 min-h-0 border border-white/5 rounded-sm overflow-hidden" style={{ background: "#0c0c14" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="font-hud text-xs tracking-[0.2em] text-white/50 uppercase">Comms Interface</span>
          {speaking && voiceEnabled && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-400 font-hud tracking-wider">SPEAKING</span>
            </div>
          )}
          {recording && (
            <div className="flex items-center gap-1.5">
              <Waveform />
              <span className="text-[9px] text-red-400 font-hud tracking-wider">REC</span>
            </div>
          )}
          {transcribing && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[9px] text-amber-400 font-hud tracking-wider">PROCESSING</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleVoice}
          className={`p-1 transition-colors ${voiceEnabled ? "text-sky-400 hover:text-sky-300" : "text-white/20 hover:text-white/40"}`}
        >
          {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 px-3 py-2 rounded-sm ${
            msg.role === "ai"
              ? "border-l-2 border-sky-400/40 bg-sky-400/3"
              : "border-l-2 border-white/10 bg-white/2"
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] tracking-[0.2em] font-hud ${msg.role === "ai" ? "text-sky-400/80" : "text-white/30"}`}>
                {msg.role === "ai" ? "F.R.I.D.A.Y" : "DRIVER"}
              </span>
              <Timestamp />
            </div>
            <p className={`text-xs leading-relaxed ${msg.role === "ai" ? "text-white/75" : "text-white/45"}`}>
              {msg.text}
            </p>
            {msg.tools?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {msg.tools.map((tool, j) => (
                  <span key={j} className={`text-[9px] px-1.5 py-0.5 border rounded-sm font-hud tracking-wider ${TOOL_COLORS[tool] || "text-white/30 border-white/10"}`}>
                    {tool.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {(loading || transcribing) && (
          <div className="flex items-center gap-2 px-3 py-2 border-l-2 border-sky-400/40 bg-sky-400/3 rounded-sm">
            <span className="text-[9px] tracking-[0.2em] font-hud text-sky-400/70">F.R.I.D.A.Y</span>
            <div className="flex gap-0.5 items-end h-3">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className="w-0.5 bg-sky-400/60 rounded-full animate-bounce"
                  style={{ height: `${[8, 12, 6, 10][i]}px`, animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 px-3 py-2 flex items-center gap-2">
        <button
          onClick={toggle}
          className={`shrink-0 p-1.5 rounded-sm border transition-all ${
            recording
              ? "border-red-500/50 text-red-400 bg-red-500/10"
              : "border-white/10 text-white/40 hover:text-sky-400 hover:border-sky-400/30"
          }`}
        >
          {recording ? <MicOff size={13} /> : <Mic size={13} />}
        </button>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask F.R.I.D.A.Y..."
          className="flex-1 bg-transparent border-none outline-none text-xs text-white/70 placeholder-white/20 font-light tracking-wide"
        />

        <button onClick={handleSend}
          className="shrink-0 text-white/20 hover:text-sky-400 transition-colors p-1">
          <Send size={13} />
        </button>
      </div>

    </div>
  )
}
