import { useState } from "react"
import axios from "axios"

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
  const [stats, setStats] = useState({
    hazards: 0,
    detections: 0,
    latency: 0,
    eta: "--"
  })

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

      setStats(prev => ({
        ...prev,
        latency,
        detections: prev.detections + 1
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

  const analyzeVision = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/vision/analyze`)
      setDetections(res.data.detections || [])

      const hazards = res.data.detections?.filter(d =>
        ["person", "dog"].includes(d.label)
      ).length || 0

      setStats(prev => ({ ...prev, hazards }))
    } catch {
      setDetections([])
    }
  }

  return {
    messages,
    loading,
    detections,
    stats,
    sendMessage,
    analyzeVision
  }
}