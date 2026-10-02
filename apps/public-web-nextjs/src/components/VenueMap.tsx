"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// SECURITY: Ikon Leaflet di-self-host agar peta tidak bergantung pada CDN pihak ketiga.
const customIcon = new L.Icon({
  iconUrl: "/assets/leaflet/marker-icon.png",
  iconRetinaUrl: "/assets/leaflet/marker-icon-2x.png",
  shadowUrl: "/assets/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map zooming to a specific venue when clicked
function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export interface VenueMapProps {
  venues: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  }>;
  activeVenue: { latitude: number; longitude: number } | null;
}

export default function VenueMap({ venues, activeVenue }: VenueMapProps) {
  const defaultCenter: [number, number] = [-6.4025, 106.7942]; // Default to Depok

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={activeVenue ? [activeVenue.latitude, activeVenue.longitude] : defaultCenter}
        zoom={activeVenue ? 15 : 11}
        scrollWheelZoom={true}
        className="h-full w-full rounded-2xl shadow-inner z-0"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          crossOrigin="anonymous"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          center={activeVenue ? [activeVenue.latitude, activeVenue.longitude] : null} 
          zoom={activeVenue ? 16 : 11} 
        />

        {venues.map((venue) => {
          if (!venue.latitude || !venue.longitude) return null;
          
          return (
            <Marker
              key={venue.id}
              position={[venue.latitude, venue.longitude]}
              icon={customIcon}
            >
              <Popup className="venue-map-popup">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{venue.name}</div>
                <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{venue.address}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
