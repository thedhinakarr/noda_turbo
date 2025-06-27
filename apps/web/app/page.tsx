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
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

import DashboardHeader from '@/components/dashboard/Header';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import KPICard from '@/components/dashboard/KPICard';
import SystemDetailsPanel from '@/components/dashboard/SystemDetailsPanel';
import Pagination from '@/components/dashboard/Pagination';

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

const createCustomIcon = (status, L, isSelected = false) => {
  let color;
  switch (status) {
    case 'optimal': color = '#10B981'; break;
    case 'warning': color = '#F59E0B'; break;
    case 'alert': color = '#EF4444'; break;
    default: color = '#6B7280';
  }
  const borderStyle = isSelected ? '4px solid #181b1f' : '3px solid white';
  return L?.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: ${borderStyle}; box-shadow: 0 2px 4px rgba(0,0,0,0.5); transition: all 0.2s ease-in-out;"></div>`,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const ITEMS_PER_PAGE = 15;

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [L, setL] = useState(null);
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
      status: statusFilter === 'all' ? null : statusFilter,
      searchTerm: debouncedSearchTerm,
    },
    notifyOnNetworkStatusChange: true,
  });

  const deriveStatus = (efficiency: number) => {
    if (efficiency >= 90) return 'optimal';
    if (efficiency >= 80) return 'warning';
    return 'alert';
  };
  
  const thermalSystems = useMemo(() => 
    (data?.allDashboardData?.systems || []).map(item => ({
      ...item,
      // --- FIX: Correctly map building_control to the 'name' property ---
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

  const getPerformanceDataForSystem = (systemId) => {
    const system = thermalSystems.find(s => s.id === systemId);
    if (!system) return [];
    const baseHours = [0, 4, 8, 12, 16, 20];
    const mockTrendFactor = (hour) => Math.sin(hour / 8 * Math.PI) * 0.1 + 1;
    return baseHours.map(hour => ({
      time: `${String(hour).padStart(2, '0')}:00`,
      efficiency: parseFloat((system.efficiency * mockTrendFactor(hour)).toFixed(2)),
      power: parseFloat((system.demand_max * mockTrendFactor(hour)).toFixed(2)),
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'text-[#10B981]';
      case 'warning': return 'text-[#F59E0B]';
      case 'alert': return 'text-[#EF4444]';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-400';
    if (efficiency >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Failed to log out.');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const handleExportData = async () => {
    // This function can be implemented later
  };
  
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) return <div className="min-h-screen bg-black text-[#F2F2F2] flex items-center justify-center text-xl text-red-400">Error: {error.message}</div>;

return (
    <div className="min-h-screen bg-background-dark text-text-default">
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />
      <main className="flex-1 p-6">
        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            <DashboardSidebar
              thermalSystems={thermalSystems}
              selectedSystem={selectedSystem}
              setSelectedSystem={setSelectedSystem}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getEfficiencyColor={getEfficiencyColor}
            />
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard
                  title="Total Systems"
                  value={thermalSystems.length}
                  icon={Thermometer}
                  iconColorClass="text-brand-accent"
                  bgColorClass="bg-background-light"
                  iconBgColorClass="bg-brand-primary/20"
                />
                <KPICard
                  title="Optimal Status"
                  value={thermalSystems.filter(s => s.status === 'optimal').length}
                  icon={CheckCircle}
                  iconColorClass="text-status-optimal"
                  bgColorClass="bg-background-light"
                  iconBgColorClass="bg-status-optimal/20"
                />
                <KPICard
                  title="Alerts/Warnings"
                  value={thermalSystems.filter(s => s.status === 'warning' || s.status === 'alert').length}
                  icon={AlertTriangle}
                  iconColorClass="text-status-alert"
                  bgColorClass="bg-background-light"
                  iconBgColorClass="bg-status-alert/20"
                />
              </div>
              {selectedSystem ? (
                <SystemDetailsPanel
                  selectedSystem={selectedSystem}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getEfficiencyColor={getEfficiencyColor}
                />
              ) : (
                <div className="bg-background-light rounded-lg shadow p-6 h-full flex items-center justify-center">
                  <p className="text-text-light text-lg text-center">Select a system from the list on the left to view its details and data.</p>
                </div>
              )}
              <div className="bg-background-light rounded-lg shadow p-6 h-96 w-full">
                <h2 className="text-text-default mb-4">Systems Map Overview</h2>
                {L && selectedSystem ? (
                  <Map
                    center={[selectedSystem.lat, selectedSystem.lng]}
                    zoom={12}
                    scrollWheelZoom={false}
                    className="h-[calc(100%-2.5rem)] w-full rounded-md overflow-hidden"
                    key={selectedSystem.id}
                  >
                    <Tile
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {thermalSystems.map((system) => (
                      <LeafletMarker
                        key={system.id}
                        position={[system.lat, system.lng]}
                        icon={createCustomIcon(system.status, L, system.id === selectedSystem.id)}
                      >
                        <LeafletPopup>
                          <div className="font-semibold text-gray-900">{system.name}</div>
                          <div className="text-gray-800">{system.location}</div>
                          <div style={{ color: `var(${getStatusColor(system.status).replace('text-', '--')})` }}>
                            Status: {system.status}
                          </div>
                          <div className="text-gray-800">Efficiency: {system.efficiency}%</div>
                          <button
                            onClick={() => setSelectedSystem(system)}
                            className="mt-2 text-brand-accent hover:text-brand-primary text-sm"
                          >
                            View Details
                          </button>
                        </LeafletPopup>
                      </LeafletMarker>
                    ))}
                  </Map>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-light">
                    Loading Map or Select a System...
                  </div>
                )}
              </div>
              <div className="bg-background-light rounded-lg shadow p-6">
                <h2 className="text-text-default mb-4">Performance Trends (24h)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={getPerformanceDataForSystem(selectedSystem?.id)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      stroke="var(--color-text-light)"
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="var(--color-brand-accent)"
                      orientation="left"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      stroke="var(--color-text-light)"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                    />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--color-text-medium)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-background-light)",
                        border: "none",
                        color: "var(--color-text-default)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="var(--color-brand-accent)"
                      fillOpacity={0.3}
                      fill="var(--color-brand-accent)"
                      yAxisId="left"
                      name="Efficiency (%)"
                    />
                    <Area
                      type="monotone"
                      dataKey="power"
                      stroke="var(--color-text-light)"
                      fillOpacity={0.3}
                      fill="var(--color-text-light)"
                      yAxisId="right"
                      name="Power (MW)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-background-light rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-text-default mb-4">
                  Recent Alerts for {selectedSystem?.name || "Selected System"}
                </h2>
                <ul className="space-y-3">
                  {selectedSystem && selectedSystem.status !== "optimal" ? (
                    <li className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-text-default">
                          {selectedSystem.name}:{" "}
                          <span className={getStatusColor(selectedSystem.status)}>
                            {selectedSystem.status.toUpperCase()}
                          </span>
                        </p>
                        <p className="text-xs text-text-light">
                          Detected anomaly in efficiency ({selectedSystem.efficiency}%).
                        </p>
                      </div>
                    </li>
                  ) : (
                    <p className="text-text-light text-sm">
                      No recent alerts for this system. Status is optimal.
                    </p>
                  )}
                </ul>
                <button
                  onClick={handleExportData}
                  className="mt-4 w-full text-brand-accent border border-brand-accent py-2 px-4 rounded-md hover:bg-brand-primary/20 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Alert Log</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Analytics" && (
          <div className="max-w-7xl mx-auto py-8 text-center text-text-light">
            <h2 className="text-2xl font-semibold text-text-default">Analytics Dashboard</h2>
            <p>Detailed performance metrics and historical data will be displayed here.</p>
            <BarChart3 className="w-20 h-20 mx-auto mt-8 text-text-light" />
          </div>
        )}

        {activeTab === "Reports" && (
          <div className="max-w-7xl mx-auto py-8 text-center text-text-light">
            <h2 className="text-2xl font-semibold text-text-default">Reports Generation</h2>
            <p>
              Generate and view comprehensive reports on system performance and energy usage.
            </p>
            <FileText className="w-20 h-20 mx-auto mt-8 text-text-light" />
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="max-w-7xl mx-auto py-8 text-center text-text-light">
            <h2 className="text-2xl font-semibold text-text-default">System Settings</h2>
            <p>
              Configure system parameters, user permissions and notification preferences.
            </p>
            <Settings className="w-20 h-20 mx-auto mt-8 text-text-light" />
          </div>
        )}
      </main>
    </div>
  );
}
