"use client";
import React from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon path issue in Next
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface Point {
  lat: number;
  lng: number;
  building: string;
  efficiency: number;
}

export default function LeafletMap({ points }: { points: Point[] }) {
  const center = { lat: 59.33, lng: 18.06 }; // Sweden default
  return (
    <MapContainer center={center} zoom={5} className="h-full w-full z-0">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points
        .filter((p) => p.lat && p.lng)
        .map((p) => (
          <CircleMarker
            key={p.building + p.lat}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{ color: p.efficiency > 0.9 ? "green" : p.efficiency > 0.7 ? "orange" : "red" }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{p.building}</div>
                <div>Efficiency: {p.efficiency.toFixed(2)}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
