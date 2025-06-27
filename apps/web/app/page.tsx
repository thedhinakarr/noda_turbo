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
  LogOut
} from 'lucide-react';

const createCustomIcon = (status, L) => {
  let color;
  switch (status) {
    case 'optimal': color = '#F2F2F2'; break;
    case 'warning': color = '#8A0A0A'; break;
    case 'alert': color = '#6B0000'; break;
    default: color = '#D9D9D9';
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      router.push('/login');
    }
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
    location: item.geo_group || 'Not defined', // Use 'Not defined' string as per backend
    efficiency: item.efficiency,
    status: deriveStatus(item.efficiency),
    type: item.type_group || 'Not defined', // Use 'Not defined' string as per backend
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

      // Base points for a trend
      const baseHours = [0, 4, 8, 12, 16, 20];
      const mockTrendFactor = (hour) => Math.sin(hour / 8 * Math.PI) * 0.1 + 1; // Creates a wave-like trend around 1

      const data = baseHours.map(hour => {
          const trend = mockTrendFactor(hour);

          // Scale mock data relative to the current system's values
          let efficiency = system.efficiency * trend;
          let temperature = system.temperature * trend;
          let power = system.power * trend;

          // Introduce some randomness and ensure reasonable bounds
          efficiency = Math.min(100, Math.max(50, efficiency + (Math.random() - 0.5) * 5));
          temperature = Math.min(100, Math.max(0, temperature + (Math.random() - 0.5) * 2));
          power = Math.min(500, Math.max(0, power + (Math.random() - 0.5) * 10));


          // Apply status-based degradation (more pronounced)
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
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-[#F2F2F2]';
    if (efficiency >= 80) return 'text-[#8A0A0A]';
    return 'text-[#6B0000]';
  };

  const tabs = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings }
  ];

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

  // Only show dashboard content if data is loaded and no error
  if (loading) return <div className="min-h-screen bg-black text-[#F2F2F2] flex items-center justify-center text-xl">Loading thermal systems...</div>;
  if (error) return <div className="min-h-screen bg-black text-[#F2F2F2] flex items-center justify-center text-xl text-red-400">Error loading thermal systems: {error.message}</div>;

  return (
    <div className="min-h-screen bg-black text-[#F2F2F2]">
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[#F2F2F2]">NODA CoPilot</h1>
          <div className="flex items-center space-x-3">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.name
                      ? 'text-[#8A0A0A] bg-[#6B0000]/20'
                      : 'text-[#D9D9D9] hover:text-[#F2F2F2] hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors text-[#D9D9D9] hover:text-[#F2F2F2] hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-gray-900 rounded-lg shadow p-6 flex-grow overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-[#F2F2F2]">Thermal Systems</h2>
                </div>

                <div className="overflow-y-auto h-[calc(100%-4rem)]">
                    <table className="min-w-full divide-y divide-gray-800">
                      <thead className="bg-gray-800 sticky top-0 z-10"><tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                            System Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                      </tr></thead>
                      <tbody className="bg-gray-900 divide-y divide-gray-800">
                        {thermalSystems.map((system) => (
                          <tr
                            key={system.id}
                            onClick={() => setSelectedSystem(system)}
                            className={`cursor-pointer hover:bg-gray-800 ${selectedSystem?.id === system.id ? 'bg-gray-800' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#F2F2F2]">
                              {system.name}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusColor(system.status)} flex items-center`}>
                              {getStatusIcon(system.status)}
                              <span className="ml-2 capitalize">{system.status}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedSystem(system); }}
                                className="text-[#8A0A0A] hover:text-[#6B0000]"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-900 rounded-lg shadow p-5 flex items-center space-x-4">
                      <div className="p-3 bg-[#6B0000]/20 rounded-full text-[#8A0A0A]">
                          <Thermometer className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-[#D9D9D9]">Total Systems</p>
                          <p className="text-2xl font-semibold text-[#F2F2F2]">{thermalSystems.length}</p>
                      </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg shadow p-5 flex items-center space-x-4">
                      <div className="p-3 bg-[#6B0000]/20 rounded-full text-[#8A0A0A]">
                          <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-[#D9D9D9]">Optimal Status</p>
                          <p className="text-2xl font-semibold text-[#F2F2F2]">
                          {thermalSystems.filter(s => s.status === 'optimal').length}
                          </p>
                      </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg shadow p-5 flex items-center space-x-4">
                      <div className="p-3 bg-[#6B0000]/20 rounded-full text-[#8A0A0A]">
                          <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-[#D9D9D9]">Alerts/Warnings</p>
                          <p className="text-2xl font-semibold text-[#F2F2F2]">
                          {thermalSystems.filter(s => s.status === 'warning' || s.status === 'alert').length}
                          </p>
                      </div>
                  </div>
              </div>

              <div className="bg-gray-900 rounded-lg shadow p-6 h-96 w-full">
                <h2 className="text-lg font-semibold text-[#F2F2F2] mb-4">Systems Map Overview</h2>
                {L && selectedSystem ? (
                  <Map center={[selectedSystem.lat, selectedSystem.lng]} // Center on selected system
                       zoom={12} // A reasonable zoom for individual buildings
                       scrollWheelZoom={false}
                       className="h-[calc(100%-2.5rem)] w-full rounded-md overflow-hidden"
                       key={selectedSystem.id}
                       whenCreated={map => {
                         console.log("Leaflet map created/recreated.");
                       }}
                  >
                    <Tile
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Standard OSM tiles
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

                  {selectedSystem ? (
                    <>
                      <div className="bg-gray-900 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-[#F2F2F2] mb-4">System Details: {selectedSystem.name}</h2>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-[#D9D9D9]">Name</p>
                            <p className="text-base text-[#F2F2F2]">{selectedSystem.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#D9D9D9]">Location</p>
                            {/* Will display "Not defined" if backend sends it */}
                            <p className="text-base text-[#F2F2F2]">{selectedSystem.location}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#D9D9D9]">Type</p>
                            {/* Will display "Not defined" if backend sends it */}
                            <p className="text-base text-[#F2F2F2] capitalize">{selectedSystem.type}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#D9D9D9]">Current Efficiency</p>
                            <p className={`text-base font-semibold ${getEfficiencyColor(selectedSystem.efficiency)}`}>
                              {selectedSystem.efficiency}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#D9D9D9]">Status</p>
                            <p className={`text-base font-semibold ${getStatusColor(selectedSystem.status)} flex items-center`}>
                              {getStatusIcon(selectedSystem.status)}
                              <span className="ml-2 capitalize">{selectedSystem.status}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#D9D9D9]">Temperature</p>
                            <p className="text-base text-[#F2F2F2]">{selectedSystem.temperature} °C</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#D9D9D9]">Power Output</p>
                            <p className="text-base text-[#F2F2F2]">{selectedSystem.power} MW</p>
                          </div>
                          <button className="w-full mt-4 bg-[#8A0A0A] text-[#F2F2F2] py-2 px-4 rounded-md hover:bg-[#6B0000] transition-colors flex items-center justify-center space-x-2">
                            <Maximize2 className="w-4 h-4" />
                            <span>View Full Analytics</span>
                          </button>
                        </div>
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