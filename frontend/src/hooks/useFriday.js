import { useState, useCallback, useRef, useEffect } from "react"
import axios from "axios"
import { useSpeech } from "./useSpeech"

// Alert config: label → { message, severity: "critical" | "warning" | "info", cooldown ms }
const ALERT_RULES = {
  person:      { message: "Pedestrian in path — reduce speed",          severity: "critical", cooldown: 30000 },
  dog:         { message: "Animal on road — caution",                   severity: "critical", cooldown: 30000 },
  motorcycle:  { message: "Motorcyclist ahead — maintain safe distance", severity: "warning",  cooldown: 35000 },
  bicycle:     { message: "Cyclist ahead — slow down",                  severity: "warning",  cooldown: 35000 },
  truck:       { message: "Large vehicle ahead — keep safe distance",   severity: "warning",  cooldown: 40000 },
  "stop sign": { message: "Stop sign ahead",                            severity: "warning",  cooldown: 40000 },
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
    eta: "--",
    driveTime: 0
  })

  // Drive time tracker
  const driveStartRef = useRef(Date.now())
  useEffect(() => {
    const t = setInterval(() => {
      const secs = Math.floor((Date.now() - driveStartRef.current) / 1000)
      setStats(prev => ({ ...prev, driveTime: secs }))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const { speak, stop, speaking, enabled: voiceEnabled, toggle: toggleVoice } = useSpeech()

  const [activeAlert, setActiveAlert] = useState(null)
  const alertCooldowns = useRef({})     // label → timestamp of last alert
  const alertTimerRef = useRef(null)
  const prevDetections = useRef([])     // last frame detections for motion check
  const fatigueAlertedRef = useRef(false) // fatigue alert fired once per session

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
        detections: detected.length   // current frame only, not cumulative
      }))

      // Fatigue alert after 90 minutes of driving
      const driveMinutes = (Date.now() - driveStartRef.current) / 60000
      if (driveMinutes >= 90 && !fatigueAlertedRef.current) {
        fatigueAlertedRef.current = true
        setActiveAlert({ message: "Driver fatigue detected — take a break", severity: "critical" })
        speak("Driver fatigue detected. Please take a break.")
        clearTimeout(alertTimerRef.current)
        alertTimerRef.current = setTimeout(() => setActiveAlert(null), 8000)
      }

      // Check 1: object must be in center horizontal zone (not on pavement/sides)
      const isCentral = (box) => {
        const frameW = 640
        const cx = (box.x1 + box.x2) / 2
        return cx / frameW > 0.25 && cx / frameW < 0.75
      }

      // Check 2: object must be in lower 65% of frame (on the road surface, not distant)
      const isOnRoad = (box) => {
        const frameH = 480
        const cy = (box.y1 + box.y2) / 2
        return cy / frameH > 0.35
      }

      // Check 3: car is moving — bounding box center must have shifted since last frame
      const isMoving = (box, label) => {
        const prev = prevDetections.current.find(p => p.label === label)
        if (!prev) return true  // new detection = approaching, treat as moving
        const prevCx = (prev.box.x1 + prev.box.x2) / 2
        const prevCy = (prev.box.y1 + prev.box.y2) / 2
        const currCx = (box.x1 + box.x2) / 2
        const currCy = (box.y1 + box.y2) / 2
        const delta = Math.abs(currCx - prevCx) + Math.abs(currCy - prevCy)
        return delta > 10  // pixels moved — if < 10px, car is effectively stopped
      }

      // Only alert for persons/dogs on road while moving
      const match = detected.find(d =>
        ["person", "dog"].includes(d.label) &&
        isCentral(d.box) &&
        isOnRoad(d.box) &&
        isMoving(d.box, d.label)
      )
      if (match) triggerAlert(match.label, ALERT_RULES[match.label])

      // Save current frame for next comparison
      prevDetections.current = detected
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
