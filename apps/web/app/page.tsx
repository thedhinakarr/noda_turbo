"use client";
import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useQuery } from '@apollo/client';
import { GET_ALL_DASHBOARD_DATA } from '@/lib/graphql/queries';
import { useRouter } from 'next/navigation';
import {
  Thermometer,
  Settings,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { signOut } from "next-auth/react";

import DashboardHeader from '@/components/dashboard/Header';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import KPICard from '@/components/dashboard/KPICard';
import SystemDetailsPanel from '@/components/dashboard/SystemDetailsPanel';
import Pagination from '@/components/dashboard/Pagination';
import { AICopilot } from '@/components/copilot/AICopilot';

// --- Custom Hook for debouncing search input ---
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const Map = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const Tile = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const LeafletMarker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const LeafletPopup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const createCustomIcon = (status: 'optimal' | 'warning' | 'alert', L: any, isSelected = false) => {
  const colorVar = `var(--color-status-${status}, #6B7280)`;
  const borderStyle = isSelected ? '4px solid #3b82f6' : '3px solid white';
  
  return L?.divIcon({
    html: `<div style="background-color: ${colorVar}; width: 20px; height: 20px; border-radius: 50%; border: ${borderStyle}; box-shadow: 0 2px 4px rgba(0,0,0,0.5); transition: all 0.2s ease-in-out;"></div>`,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const ITEMS_PER_PAGE = 15;

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [L, setL] = useState<any>(null);
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    import('leaflet').then(leaflet => {
      const Leaflet = leaflet.default;
      delete Leaflet.Icon.Default.prototype._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setL(Leaflet);
    });
  }, []);
  
  const { loading, error, data } = useQuery(GET_ALL_DASHBOARD_DATA, {
    variables: {
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
      status: statusFilter === 'all' ? undefined : statusFilter,
      searchTerm: debouncedSearchTerm || undefined,
    },
    notifyOnNetworkStatusChange: true,
  });

  const deriveStatus = (efficiency: number): 'optimal' | 'warning' | 'alert' => {
    if (efficiency >= 90) return 'optimal';
    if (efficiency >= 80) return 'warning';
    return 'alert';
  };
  
  const thermalSystems = useMemo(() => 
    (data?.allDashboardData?.systems || []).map((item: any) => ({
      ...item,
      name: item.building_control || 'Unnamed System', 
      location: item.geo_group || 'N/A',
      status: deriveStatus(item.efficiency),
      lat: item.asset_latitude,
      lng: item.asset_longitude,
    })),
  [data]);

  const totalCount = data?.allDashboardData?.totalCount || 0;

  useEffect(() => {
    if (thermalSystems.length > 0 && !thermalSystems.find(s => s.id === selectedSystem?.id)) {
      setSelectedSystem(thermalSystems[0]);
    } else if (thermalSystems.length === 0) {
      setSelectedSystem(null);
    }
  }, [thermalSystems, selectedSystem]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  const getPerformanceDataForSystem = (systemId: string) => {
    const system = thermalSystems.find(s => s.id === systemId);
    if (!system) return [];
    const baseHours = [0, 4, 8, 12, 16, 20];
    const mockTrendFactor = (hour: number) => Math.sin(hour / 8 * Math.PI) * 0.1 + 1;
    return baseHours.map(hour => ({
      time: `${String(hour).padStart(2, '0')}:00`,
      efficiency: parseFloat((system.efficiency * mockTrendFactor(hour)).toFixed(2)),
      power: parseFloat((system.demand_max * mockTrendFactor(hour)).toFixed(2)),
    }));
  };
  
  const getStatusIcon = (status: 'optimal' | 'warning' | 'alert') => {
    switch (status) {
      case 'optimal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

const handleLogout = async () => {
  try {
    // This will now correctly trigger the federated logout
    await signOut({ redirect: true, callbackUrl: "/login" });
  } catch (error) {
    console.error("An error occurred during sign out:", error);
  }
};
  
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <p className="text-white text-xl">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-xl text-status-alert">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-background-dark text-text-default flex flex-col">
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />
      <main className="flex-1 p-6 overflow-hidden">
        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
            
            <div className="xl:col-span-3 h-[calc(100vh-8rem)]">
               <DashboardSidebar
                thermalSystems={thermalSystems}
                selectedSystem={selectedSystem}
                setSelectedSystem={setSelectedSystem}
                getStatusIcon={getStatusIcon}
                isLoading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
              <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
            
            <div className="xl:col-span-6 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <KPICard title="Total Systems" value={totalCount} icon={Thermometer} variant="primary" />
                 <KPICard title="Optimal Status" value={thermalSystems.filter(s => s.status === 'optimal').length} icon={CheckCircle} variant="optimal"/>
                 <KPICard title="Alerts/Warnings" value={thermalSystems.filter(s => s.status === 'warning' || s.status === 'alert').length} icon={AlertTriangle} variant="alert" />
              </div>
              
              {loading && !data?.allDashboardData ? (
                 <div className="text-center p-10 text-text-medium">Loading Systems Data...</div>
              ) : selectedSystem ? (
                <>
                  <SystemDetailsPanel selectedSystem={selectedSystem} getStatusIcon={getStatusIcon} />

                  <div className="bg-background-light rounded-lg shadow p-6 h-96 w-full">
                    <h2 className="text-text-light mb-4 font-heading">Systems Map Overview</h2>
                    {L && selectedSystem.lat ? (
                      <Map 
                        center={[selectedSystem.lat, selectedSystem.lng]} 
                        zoom={12} 
                        scrollWheelZoom={false} 
                        className="h-[calc(100%-2.5rem)] w-full rounded-md" 
                        key={selectedSystem.id}
                      >
                        <Tile
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {/* FIX: Removed conditional rendering wrapper for markers */}
                        {thermalSystems.map((system: any) => (
                          system.lat && system.lng &&
                          <LeafletMarker key={system.id} position={[system.lat, system.lng]} icon={createCustomIcon(system.status, L, system.id === selectedSystem.id)}>
                            <LeafletPopup>
                              <div className="font-semibold">{system.name}</div>
                              <button onClick={() => setSelectedSystem(system)} className="mt-2 text-brand-accent font-bold text-sm">View Details</button>
                            </LeafletPopup>
                          </LeafletMarker>
                        ))}
                      </Map>
                    ) : <div className="text-text-medium">Loading Map...</div>}
                  </div>
                   <div className="bg-background-light rounded-lg shadow p-6">
                     <h2 className="text-lg font-heading text-text-light mb-4">Performance Trends (24h)</h2>
                     <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={getPerformanceDataForSystem(selectedSystem.id)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-brand-accent)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-brand-accent)" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="time" stroke="var(--color-text-medium)" tick={{ fill: 'var(--color-text-medium)' }} fontSize={12} />
                           <YAxis stroke="var(--color-text-medium)" tick={{ fill: 'var(--color-text-medium)' }} fontSize={12}/>
                           <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text-medium)" strokeOpacity={0.2} />
                           <Tooltip
                             contentStyle={{
                               backgroundColor: 'var(--color-background-dark)',
                               border: '1px solid var(--color-text-medium)',
                               color: 'var(--color-text-light)'
                             }}
                           />
                           <Area type="monotone" dataKey="efficiency" stroke="var(--color-brand-accent)" fillOpacity={1} fill="url(#colorEfficiency)" name="Efficiency" unit="%" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center p-10 text-text-medium">
                  {thermalSystems.length > 0 ? "Select a system to view details." : "No systems match the current filters."}
                </div>
              )}
            </div>

            <div className="xl:col-span-3 h-[calc(100vh-8rem)]">
              <AICopilot />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
