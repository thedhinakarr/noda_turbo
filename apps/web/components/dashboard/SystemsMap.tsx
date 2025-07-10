// apps/web/components/dashboard/SystemsMap.tsx
"use client";

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet'; // Import Leaflet for type L.LeafletEvent
import { System } from '@/lib/graphql/types';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

import 'leaflet/dist/leaflet.css';

interface SystemsMapProps {
  systems: System[];
}

const calculateTotalFaults = (system: System): number => {
  if (!system.faults) return 0;
  return (
    (system.faults.primaryLoss || 0) +
    (system.faults.smirch || 0) +
    (system.faults.heatSystem || 0) +
    (system.faults.valve || 0) +
    (system.faults.transfer || 0)
  );
};

const DEFAULT_CENTER: [number, number] = [57.6593, 12.0152]; // Mölndal, Sweden
const DEFAULT_ZOOM = 10;

const SystemsMap: React.FC<SystemsMapProps> = ({ systems }) => {

  const createCustomClusterIcon = (colorClass: string) => {
    const iconHtml = `
      <div class="${cn('relative flex items-center justify-center rounded-full p-1.5 shadow-md', colorClass)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin text-white h-6 w-6">
          <path d="M12 18.35a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"/>
          <path d="M12 22v-3.5"/>
          <path d="M12 11h.01"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-map-marker',
      iconSize: L.point(36, 36),
      iconAnchor: L.point(18, 36),
      popupAnchor: L.point(0, -36),
    });
  };

  const getMarkerIcon = (system: System) => {
    const totalFaults = calculateTotalFaults(system);
    const efficiency = system.kpis?.efficiency ?? 100;

    let colorClass = 'bg-accent-green';
    if (totalFaults > 0) {
      colorClass = 'bg-accent-red';
    } else if (efficiency < 70) {
      colorClass = 'bg-accent-yellow';
    }

    return createCustomClusterIcon(colorClass);
  };

  function MapBoundsHandler({ systems }: { systems: System[] }) {
    const map = useMap();

    useEffect(() => {
      const validPoints = systems
        .map(s => s.location)
        .filter(loc => loc && loc.latitude !== null && loc.longitude !== null && loc.latitude !== undefined && loc.longitude !== undefined)
        .map(loc => [loc!.latitude!, loc!.longitude!]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [map, systems]);

    return null;
  }

  const mapCenter = useMemo(() => {
    if (systems.length > 0) {
      const avgLat = systems.reduce((sum, s) => sum + (s.location?.latitude || DEFAULT_CENTER[0]), 0) / systems.length;
      const avgLng = systems.reduce((sum, s) => sum + (s.location?.longitude || DEFAULT_CENTER[1]), 0) / systems.length;
      return [avgLat, avgLng] as [number, number];
    }
    return DEFAULT_CENTER;
  }, [systems]);

  const MemoizedMarkers = useMemo(() => {
    return systems.map((system) => {
      const { latitude, longitude } = system.location || {};
      if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
        console.warn(`System ${system.name || system.id} has invalid coordinates:`, system.location);
        return null;
      }

      // --- REMOVED: useRef for each marker (Hook violation) ---
      // const markerRef = useRef(null);

      // --- UPDATED: Event handlers access marker via event.target ---
      const eventHandlers = {
        mouseover: (event: L.LeafletEvent) => {
          (event.target as L.Marker).openPopup(); // Cast to L.Marker to access openPopup
        },
        mouseout: (event: L.LeafletEvent) => {
          (event.target as L.Marker).closePopup(); // Cast to L.Marker to access closePopup
        },
      };

      const totalFaults = calculateTotalFaults(system);
      const efficiency = system.kpis?.efficiency ?? 0;
      const overallRank = system.ranking?.overall ?? 0;

      return (
        <Marker
          key={system.id}
          position={[latitude, longitude]}
          icon={getMarkerIcon(system)}
          // --- REMOVED: ref={markerRef} ---
          eventHandlers={eventHandlers} // Assign event handlers
        >
          <Popup>
            <div className="font-sans text-text-primary">
              <h4 className="font-bold text-lg mb-1">{system.name || 'Unknown System'}</h4>
              <p className="text-sm text-text-secondary">UUID: {system.uuid}</p>
              {system.location && <p className="text-xs text-text-secondary">Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}</p>}
              <div className="mt-2 space-y-1">
                <p className="text-sm"><span className="font-medium">Efficiency:</span> {efficiency.toFixed(1)}%</p>
                <p className="text-sm"><span className="font-medium">Overall Rank:</span> {overallRank.toFixed(0)}%</p>
                <p className="text-sm"><span className="font-medium">Technical Issues:</span> {totalFaults}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [systems]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-[500px] w-full rounded-lg shadow-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {MemoizedMarkers}
      <MapBoundsHandler systems={systems} />
    </MapContainer>
  );
};

export default SystemsMap;