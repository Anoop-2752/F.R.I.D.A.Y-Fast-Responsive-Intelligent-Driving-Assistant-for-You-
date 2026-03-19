import CameraFeed from "../components/CameraFeed"
import ChatPanel from "../components/ChatPanel"
import StatsRow from "../components/StatsRow"
import StatusBar from "../components/StatusBar"
import MapView from "../components/MapView"
import { useFriday } from "../hooks/useFriday"

export default function Dashboard() {
  const {
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
    toggleVoice
  } = useFriday()

  return (
    <div className="bg-gray-950 h-screen p-3 flex flex-col gap-3 overflow-hidden">

      <StatusBar />

      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">

        <div className="col-span-2 flex flex-col gap-3 min-h-0">
          <CameraFeed
            detections={detections}
            onAnalyze={analyzeVision}
            activeAlert={activeAlert}
          />
          <StatsRow stats={stats} />
        </div>

        <div className="col-span-1 flex flex-col gap-3 min-h-0">
          <ChatPanel
            messages={messages}
            loading={loading}
            onSend={sendMessage}
            onVoiceResult={handleVoiceResult}
            speaking={speaking}
            voiceEnabled={voiceEnabled}
            onToggleVoice={toggleVoice}
          />
          <MapView
            routeMap={routeMap}
            onClose={() => setRouteMap(null)}
          />
        </div>

      </div>

    </div>
  )
}
