import CameraFeed from "../components/CameraFeed"
import ChatPanel from "../components/ChatPanel"
import StatsRow from "../components/StatsRow"
import StatusBar from "../components/StatusBar"
import { useFriday } from "../hooks/useFriday"

export default function Dashboard() {
  const { messages, loading, detections, stats, sendMessage, analyzeVision } = useFriday()

  return (
    <div className="bg-gray-950 min-h-screen p-4 flex flex-col gap-4">
      <StatusBar />

      <div className="grid grid-cols-3 gap-4 flex-1">
        <div className="col-span-2 flex flex-col gap-4">
          <CameraFeed detections={detections} onAnalyze={analyzeVision} />
          <StatsRow stats={stats} />
        </div>

        <div className="col-span-1">
          <ChatPanel
            messages={messages}
            loading={loading}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  )
}