import { useState, useCallback } from "react"

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [enabled, setEnabled] = useState(true)

  const speak = useCallback((text) => {
    if (!enabled || !window.speechSynthesis) return

    // Cancel anything currently playing
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Pick a good English voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.name.includes("Google US English") ||
      v.name.includes("Microsoft Zira") ||
      v.name.includes("Samantha") ||
      (v.lang === "en-US" && v.localService)
    )
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [enabled])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const toggle = useCallback(() => {
    if (speaking) window.speechSynthesis.cancel()
    setEnabled(prev => !prev)
  }, [speaking])

  return { speak, stop, speaking, enabled, toggle }
}
