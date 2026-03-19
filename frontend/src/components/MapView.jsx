import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet"
import { useEffect } from "react"
import L from "leaflet"

// Fix default marker icons broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const originIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const destIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Auto-fit map bounds to the route
function FitBounds({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords?.length > 0) {
      map.fitBounds(coords, { padding: [20, 20] })
    }
  }, [coords, map])
  return null
}

const DEFAULT_CENTER = [20.5937, 78.9629] // India center
const DEFAULT_ZOOM = 4

export default function MapView({ routeMap, onClose }) {
  const hasRoute = routeMap?.coords?.length > 0
  const center = hasRoute ? (routeMap.origin || routeMap.coords[0]) : DEFAULT_CENTER

  return (
    <div className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden flex flex-col flex-1 min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${hasRoute ? "bg-blue-400 animate-pulse" : "bg-gray-600"}`}></span>
          <span className="text-xs text-gray-400 font-medium">Navigation</span>
          {hasRoute && (
            <span className="text-xs text-blue-400 border border-blue-400/30 rounded px-1.5 py-0.5">
              {routeMap.distance_km} km · {routeMap.duration_min} min
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasRoute ? (
            <>
              <span className="text-xs text-gray-500 truncate max-w-40">
                {routeMap.origin_name} → {routeMap.destination_name}
              </span>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
              >
                ✕
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-600">Ask me to navigate somewhere</span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%", background: "#111" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />

          {hasRoute && (
            <>
              <Polyline
                positions={routeMap.coords}
                pathOptions={{ color: "#1a73e8", weight: 5, opacity: 0.95 }}
              />
              {routeMap.origin && (
                <Marker position={routeMap.origin} icon={originIcon}>
                  <Popup>{routeMap.origin_name || "Origin"}</Popup>
                </Marker>
              )}
              {routeMap.destination && (
                <Marker position={routeMap.destination} icon={destIcon}>
                  <Popup>{routeMap.destination_name || "Destination"}</Popup>
                </Marker>
              )}
              <FitBounds coords={routeMap.coords} />
            </>
          )}
        </MapContainer>
      </div>

    </div>
  )
}
