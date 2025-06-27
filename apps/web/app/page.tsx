// apps/web/app/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useQuery } from '@apollo/client';
import { GET_ALL_DASHBOARD_DATA } from '../lib/graphql/queries';
import { useRouter } from 'next/navigation';
import {
  Thermometer,
  Settings,
  BarChart3,
  FileText,
  Download,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Filter,
  MoreHorizontal,
  Globe,
  List,
  Maximize2,
  LogOut,
} from 'lucide-react';

import DashboardHeader from '../components/dashboard/Header';
import DashboardSidebar from '../components/dashboard/Sidebar';
import KPICard from '../components/dashboard/KPICard';
import SystemDetailsPanel from '../components/dashboard/SystemDetailsPanel';


const createCustomIcon = (status, L) => {
  let color;
  switch (status) {
    case 'optimal': color = '#10B981'; break;
    case 'warning': color = '#F59E0B'; break;
    case 'alert': color = '#EF4444'; break;
    default: color = '#6B7280';
  }

  return L && L.divIcon
    ? L.divIcon({
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: 'custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    : undefined;
};

export default function Dashboard() {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [L, setL] = useState(null);
  const router = useRouter();

  useEffect(() => {
    
  }, [router]);

  const { loading, error, data } = useQuery(GET_ALL_DASHBOARD_DATA, {
    variables: { limit: 10 }
  });

  const deriveStatus = (efficiency) => {
    if (efficiency >= 90) return 'optimal';
    if (efficiency >= 80) return 'warning';
    return 'alert';
  };

  const thermalSystems = (data?.allDashboardData || []).map(item => ({
    id: item.id,
    name: item.building_control || 'N/A',
    location: item.geo_group || 'Not defined',
    efficiency: item.efficiency,
    status: deriveStatus(item.efficiency),
    type: item.type_group || 'Not defined',
    lat: item.asset_latitude,
    lng: item.asset_longitude,
    temperature: item.supply_abs || 0,
    power: item.demand_max || 0,
  }));

  useEffect(() => {
    if (thermalSystems.length > 0 && !selectedSystem) {
      const initialSystem = thermalSystems.find(sys => sys.id !== null && sys.id !== undefined);
      if (initialSystem) {
        setSelectedSystem(initialSystem);
      }
    }
  }, [thermalSystems, selectedSystem]);


  useEffect(() => {
    import('leaflet').then((leaflet) => {
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

  const getPerformanceDataForSystem = (systemId) => {
      const system = thermalSystems.find(s => s.id === systemId);
      if (!system) return [];

      const baseHours = [0, 4, 8, 12, 16, 20];
      const mockTrendFactor = (hour) => Math.sin(hour / 8 * Math.PI) * 0.1 + 1;

      const data = baseHours.map(hour => {
          const trend = mockTrendFactor(hour);

          let efficiency = system.efficiency * trend;
          let temperature = system.temperature * trend;
          let power = system.power * trend;

          efficiency = Math.min(100, Math.max(50, efficiency + (Math.random() - 0.5) * 5));
          temperature = Math.min(100, Math.max(0, temperature + (Math.random() - 0.5) * 2));
          power = Math.min(500, Math.max(0, power + (Math.random() - 0.5) * 10));


          if (system.status === 'warning') {
              efficiency = Math.max(60, efficiency * 0.95 - (Math.random() * 3));
              temperature = temperature * 1.05 + (Math.random() * 1);
              power = power * 1.05 + (Math.random() * 5);
          } else if (system.status === 'alert') {
              efficiency = Math.max(40, efficiency * 0.90 - (Math.random() * 5));
              temperature = temperature * 1.1 + (Math.random() * 2);
              power = power * 1.1 + (Math.random() * 10);
          }

          return {
              time: `${String(hour).padStart(2, '0')}:00`,
              efficiency: parseFloat(efficiency.toFixed(2)),
              temperature: parseFloat(temperature.toFixed(2)),
              power: parseFloat(power.toFixed(2))
          };
      });

      return data;
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'text-[#F2F2F2]';
      case 'warning': return 'text-[#8A0A0A]';
      case 'alert': return 'text-[#6B0000]';
      default: return 'text-[#D9D9D9]';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />; // Default to AlertTriangle for unknown status
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-[#F2F2F2]';
    if (efficiency >= 80) return 'text-[#8A0A0A]';
    return 'text-[#6B0000]';
  };

  const Map = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
  );

  const Tile = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
  );

  const LeafletMarker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
  );

  const LeafletPopup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
  );

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
      } else {
        alert('Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('An error occurred during logout.');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thermal_systems_export_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      alert('Data exported successfully!');

    } catch (error) {
      console.error('Error exporting data:', error);
      alert(`Failed to export data: ${error.message}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-[#F2F2F2] flex items-center justify-center text-xl">Loading thermal systems...</div>;
  if (error) return <div className="min-h-screen bg-black text-[#F2F2F2] flex items-center justify-center text-xl text-red-400">Error loading thermal systems: {error.message}</div>;

  return (
    <div className="min-h-screen bg-black text-[#F2F2F2]">
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
                    iconColorClass="text-[#8A0A0A]"
                  />
                  <KPICard
                    title="Optimal Status"
                    value={thermalSystems.filter(s => s.status === 'optimal').length}
                    icon={CheckCircle}
                    iconColorClass="text-[#F2F2F2]"
                  />
                  <KPICard
                    title="Alerts/Warnings"
                    value={thermalSystems.filter(s => s.status === 'warning' || s.status === 'alert').length}
                    icon={AlertTriangle}
                    iconColorClass="text-[#8A0A0A]"
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
                <div className="bg-gray-900 rounded-lg shadow p-6 h-full flex items-center justify-center">
                  <p className="text-[#D9D9D9] text-lg text-center">Select a system from the list on the left to view its details and data.</p>
                </div>
              )}
              <div className="bg-gray-900 rounded-lg shadow p-6 h-96 w-full">
                <h2 className="text-lg font-semibold text-[#F2F2F2] mb-4">Systems Map Overview</h2>
                {L && selectedSystem ? (
                  <Map center={[selectedSystem.lat, selectedSystem.lng]}
                       zoom={12}
                       scrollWheelZoom={false}
                       className="h-[calc(100%-2.5rem)] w-full rounded-md overflow-hidden"
                       key={selectedSystem.id}
                       whenCreated={map => {
                         console.log("Leaflet map created/recreated.");
                       }}
                  >
                    <Tile
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {thermalSystems.map((system) => (
                          <LeafletMarker
                            key={system.id}
                            position={[system.lat, system.lng]}
                            icon={createCustomIcon(system.status, L)}
                          >
                            <LeafletPopup>
                              <div className="font-semibold text-gray-900">{system.name}</div>
                              <div className="text-gray-800">{system.location}</div>
                              <div style={{ color: getStatusColor(system.status).replace('text-', '#') }}>Status: {system.status}</div>
                              <div className="text-gray-800">Efficiency: {system.efficiency}%</div>
                              <button
                                onClick={() => setSelectedSystem(system)}
                                className="mt-2 text-red-600 hover:text-red-900 text-sm"
                              >
                                View Details
                              </button>
                            </LeafletPopup>
                          </LeafletMarker>
                        ))}
                      </Map>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[#D9D9D9]">Loading Map or Select a System...</div>
                    )}
                  </div>
                  <div className="bg-gray-900 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-[#F2F2F2] mb-4">Performance Trends (24h)</h2>
                    <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={getPerformanceDataForSystem(selectedSystem.id)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="time" axisLine={false} tickLine={false} stroke="#D9D9D9" />
                            <YAxis yAxisId="left" stroke="#8A0A0A" orientation="left" axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" stroke="#D9D9D9" orientation="right" axisLine={false} tickLine={false} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4B5563" />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#E5E7EB' }} />
                            <Area type="monotone" dataKey="efficiency" stroke="#8A0A0A" fillOpacity={0.3} fill="#8A0A0A" yAxisId="left" name="Efficiency (%)" />
                            <Area type="monotone" dataKey="power" stroke="#D9D9D9" fillOpacity={0.3} fill="#D9D9D9" yAxisId="right" name="Power (MW)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-gray-900 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-[#F2F2F2] mb-4">Recent Alerts for {selectedSystem.name}</h2>
                        <ul className="space-y-3">
                          {thermalSystems
                            .filter(s => s.id === selectedSystem.id && s.status !== 'optimal')
                            .map((system) => (
                              <li key={system.id} className="flex items-start space-x-3">
                                <AlertTriangle className="w-5 h-5 text-[#6B0000] mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-[#F2F2F2]">{system.name}: <span className={getStatusColor(system.status)}>{system.status.toUpperCase()}</span></p>
                                  <p className="text-xs text-[#D9D9D9]">Detected anomaly in efficiency ({system.efficiency}%).</p>
                                </div>
                              </li>
                            ))}
                          { (selectedSystem.status === 'optimal') && (
                            <p className="text-[#D9D9D9] text-sm">No recent alerts for this system. Status is optimal.</p>
                          )}
                        </ul>
                        <button onClick={handleExportData} className="mt-4 w-full text-[#8A0A0A] border border-[#8A0A0A] py-2 px-4 rounded-md hover:bg-[#6B0000]/20 transition-colors flex items-center justify-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Download Alert Log</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-900 rounded-lg shadow p-6 h-full flex items-center justify-center">
                      <p className="text-[#D9D9D9] text-lg text-center">Select a system from the list on the left to view its details and data.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Analytics' && (
              <div className="max-w-7xl mx-auto py-8 text-center text-[#D9D9D9]">
                <h2 className="text-2xl font-semibold text-[#F2F2F2]">Analytics Dashboard</h2>
                <p>Detailed performance metrics and historical data will be displayed here.</p>
                <BarChart3 className="w-20 h-20 mx-auto mt-8 text-[#D9D9D9]" />
              </div>
            )}

            {activeTab === 'Reports' && (
              <div className="max-w-7xl mx-auto py-8 text-center text-[#D9D9D9]">
                <h2 className="text-2xl font-semibold text-[#F2F2F2]">Reports Generation</h2>
                <p>Generate and view comprehensive reports on system performance and energy usage.</p>
                <FileText className="w-20 h-20 mx-auto mt-8 text-[#D9D9D9]" />
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="max-w-7xl mx-auto py-8 text-center text-[#D9D9D9]">
                <h2 className="text-2xl font-semibold text-[#F2F2F2]">System Settings</h2>
                <p>Configure system parameters, user permissions and notification preferences.</p>
                <Settings className="w-20 h-20 mx-auto mt-8 text-[#D9D9D9]" />
              </div>
            )}
          </main>
        </div>
      );
    }