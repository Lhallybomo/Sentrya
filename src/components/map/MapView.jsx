import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import { useEffect } from "react";
import { NIGERIA_CENTER, SEVERITY_COLORS } from "@/lib/nigeriaData";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function createIcon(color, size = 24) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function LocationFinder({ onLocationFound }) {
  const map = useMap();
  
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 12 });
    map.on("locationfound", (e) => {
      if (onLocationFound) onLocationFound(e.latlng);
    });
  }, [map, onLocationFound]);

  return null;
}

export default function MapView({ incidents = [], userLocation, onLocationFound, className = "" }) {
  return (
    <MapContainer
      center={userLocation || NIGERIA_CENTER}
      zoom={6}
      className={className}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <LocationFinder onLocationFound={onLocationFound} />

      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat || userLocation[0], userLocation.lng || userLocation[1]]}
            radius={500}
            pathOptions={{ color: "#4361ee", fillColor: "#4361ee", fillOpacity: 0.15, weight: 1 }}
          />
          <Marker
            position={[userLocation.lat || userLocation[0], userLocation.lng || userLocation[1]]}
            icon={createIcon("#4361ee", 16)}
          />
        </>
      )}

      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.latitude, incident.longitude]}
          icon={createIcon(SEVERITY_COLORS[incident.severity]?.hex || "#eab308", 20)}
        >
          <Popup>
            <div className="p-1">
              <p className="font-semibold text-sm">{incident.type}</p>
              <p className="text-xs text-gray-600">{incident.location_name || incident.state}</p>
              <p className="text-xs mt-1">{incident.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}