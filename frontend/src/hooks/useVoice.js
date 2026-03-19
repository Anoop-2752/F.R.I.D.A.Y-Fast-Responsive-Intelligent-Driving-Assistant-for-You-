import { useState, useRef } from "react"
import axios from "axios"

const BASE_URL = "http://localhost:8000"

export function useVoice({ onResult }) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return ""
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const mimeUsed = mediaRecorder.mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: mimeUsed })
        await sendAudio(blob, mimeUsed)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
      setRecording(true)

    } catch {
      alert("Microphone access denied. Please allow mic permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setTranscribing(true)
    }
  }

  const getExtension = (mimeType) => {
    if (mimeType.includes("ogg")) return "ogg"
    if (mimeType.includes("mp4")) return "mp4"
    return "webm"
  }

  const sendAudio = async (blob, mimeType) => {
    const start = Date.now()
    try {
      const ext = getExtension(mimeType)
      const formData = new FormData()
      formData.append("file", blob, `recording.${ext}`)

      const res = await axios.post(`${BASE_URL}/voice`, formData)
      const latency = ((Date.now() - start) / 1000).toFixed(1)

      onResult({
        transcription: res.data.transcription,
        response: res.data.response,
        tools: res.data.tools_used || [],
        latency,
        route_map: res.data.route_map || null
      })

    } catch (err) {
      console.error("Voice error:", err)
      onResult({
        transcription: "Could not transcribe audio.",
        response: "Voice processing failed. Try again.",
        tools: [],
        latency: null
      })
    }

    setTranscribing(false)
  }

  const toggle = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  return { recording, transcribing, toggle }
}