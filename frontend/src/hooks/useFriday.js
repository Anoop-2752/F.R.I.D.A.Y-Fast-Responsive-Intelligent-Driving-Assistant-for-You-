import { useState, useCallback, useRef } from "react"
import axios from "axios"
import { useSpeech } from "./useSpeech"

// Alert config: label → { message, severity: "critical" | "warning" | "info", cooldown ms }
const ALERT_RULES = {
  person:        { message: "Pedestrian detected ahead — reduce speed",     severity: "critical", cooldown: 12000 },
  dog:           { message: "Animal on road ahead — caution",               severity: "critical", cooldown: 12000 },
  motorcycle:    { message: "Motorcyclist nearby — maintain safe distance",  severity: "warning",  cooldown: 15000 },
  bicycle:       { message: "Cyclist ahead — slow down",                    severity: "warning",  cooldown: 15000 },
  truck:         { message: "Large vehicle ahead — keep safe distance",     severity: "warning",  cooldown: 20000 },
  "traffic light": { message: "Traffic signal ahead",                       severity: "info",     cooldown: 20000 },
  "stop sign":   { message: "Stop sign ahead",                              severity: "warning",  cooldown: 20000 },
}

const BASE_URL = "http://localhost:8000"

export function useFriday() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "F.R.I.D.A.Y online. All systems operational. How can I assist?",
      tools: []
    }
  ])
  const [loading, setLoading] = useState(false)
  const [detections, setDetections] = useState([])
  const [routeMap, setRouteMap] = useState(null)
  const [stats, setStats] = useState({
    hazards: 0,
    detections: 0,
    latency: "--",
    eta: "--"
  })

  const { speak, stop, speaking, enabled: voiceEnabled, toggle: toggleVoice } = useSpeech()

  const [activeAlert, setActiveAlert] = useState(null)
  const alertCooldowns = useRef({})   // label → timestamp of last alert
  const alertTimerRef = useRef(null)

  const triggerAlert = useCallback((label, rule) => {
    const now = Date.now()
    const last = alertCooldowns.current[label] || 0
    if (now - last < rule.cooldown) return   // still cooling down

    alertCooldowns.current[label] = now
    setActiveAlert({ message: rule.message, severity: rule.severity })
    speak(rule.message)

    // Auto-dismiss banner after 5 seconds
    clearTimeout(alertTimerRef.current)
    alertTimerRef.current = setTimeout(() => setActiveAlert(null), 5000)
  }, [speak])

  const sendMessage = async (text) => {
    if (!text.trim()) return

    setMessages(prev => [...prev, { role: "user", text, tools: [] }])
    setLoading(true)

    const start = Date.now()

    try {
      const res = await axios.post(`${BASE_URL}/chat`, { message: text })
      const latency = ((Date.now() - start) / 1000).toFixed(1)

      setMessages(prev => [...prev, {
        role: "ai",
        text: res.data.response,
        tools: res.data.tools_used || []
      }])

      speak(res.data.response)

      if (res.data.route_map?.coords?.length > 0) {
        setRouteMap(res.data.route_map)
      }

      const etaMatch = res.data.route_data?.match(/(\d+)\s*minute/)
      setStats(prev => ({
        ...prev,
        latency: `${latency}`,
        eta: etaMatch ? `${etaMatch[1]}m` : prev.eta
      }))

    } catch {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Connection error. Check backend.",
        tools: []
      }])
    }

    setLoading(false)
  }

  const handleVoiceResult = ({ transcription, response, tools, latency, route_map }) => {
    setMessages(prev => [
      ...prev,
      { role: "user", text: `🎤 ${transcription}`, tools: [] },
      { role: "ai", text: response, tools }
    ])
    speak(response)
    if (latency) setStats(prev => ({ ...prev, latency }))
    if (route_map?.coords?.length > 0) setRouteMap(route_map)
  }

  const analyzeVision = useCallback(async () => {
    try {
      const res = await axios.post(`${BASE_URL}/vision/analyze`)
      const detected = res.data.detections || []
      setDetections(detected)

      const hazards = detected.filter(d =>
        ["person", "dog"].includes(d.label)
      ).length

      setStats(prev => ({
        ...prev,
        hazards,
        detections: prev.detections + detected.length
      }))

      // Fire proactive alert for the highest-priority new detection
      const priority = ["person", "dog", "motorcycle", "bicycle", "stop sign", "traffic light", "truck"]
      for (const label of priority) {
        const rule = ALERT_RULES[label]
        if (rule && detected.some(d => d.label === label)) {
          triggerAlert(label, rule)
          break  // only one alert at a time
        }
      }
    } catch {
      setDetections([])
    }
  }, [triggerAlert])

  return {
    messages,
    loading,
    detections,
    routeMap,
    setRouteMap,
    stats,
    activeAlert,
    sendMessage,
    analyzeVision,
    handleVoiceResult,
    speaking,
    voiceEnabled,
    toggleVoice,
    stopSpeaking: stop
  }
}
