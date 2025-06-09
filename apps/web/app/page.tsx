"use client";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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
  Maximize2
} from 'lucide-react';

// Custom Leaflet icon configuration
const createCustomIcon = (status) => {
  const color = status === 'optimal' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';
  
  return L && L.divIcon ? L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }) : null;
};

const Dashboard = () => {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [viewMode, setViewMode] = useState('list');
  const [L, setL] = useState(null);

  // Load Leaflet dynamically to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
        // Fix default markers
        delete leaflet.default.Icon.Default.prototype._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Blekinge County thermal systems with accurate coordinates
  const thermalSystems = [
    {
      id: 1,
      name: 'District Heating Plant Alpha',
      location: 'Karlshamn Central',
      efficiency: 94.2,
      status: 'optimal',
      type: 'district-heating',
      lat: 56.1706,
      lng: 14.8615,
      temperature: 21.5,
      power: 8.4
    },
    {
      id: 2,
      name: 'Building Complex Beta',
      location: 'Karlskrona Industrial',
      efficiency: 87.8,
      status: 'warning',
      type: 'building',
      lat: 56.1612,
      lng: 15.5869,
      temperature: 22.1,
      power: 12.7
    },
    {
      id: 3,
      name: 'Residential Gamma',
      location: 'Ronneby North',
      efficiency: 91.5,
      status: 'optimal',
      type: 'residential',
      lat: 56.2101,
      lng: 15.2752,
      temperature: 20.8,
      power: 6.2
    },
    {
      id: 4,
      name: 'Industrial Delta',
      location: 'Sölvesborg Port',
      efficiency: 78.2,
      status: 'alert',
      type: 'industrial',
      lat: 56.0514,
      lng: 14.5896,
      temperature: 24.3,
      power: 15.1
    },
    {
      id: 5,
      name: 'Campus Epsilon',
      location: 'BTH Karlskrona',
      efficiency: 96.1,
      status: 'optimal',
      type: 'campus',
      lat: 56.1817,
      lng: 15.5904,
      temperature: 21.2,
      power: 4.8
    }
  ];

  // Sample performance data for charts
  const performanceData = [
    { time: '00:00', efficiency: 92, temperature: 20, power: 8.2 },
    { time: '04:00', efficiency: 94, temperature: 19.5, power: 7.8 },
    { time: '08:00', efficiency: 89, temperature: 21, power: 12.4 },
    { time: '12:00', efficiency: 87, temperature: 22.5, power: 15.2 },
    { time: '16:00', efficiency: 91, temperature: 23, power: 13.8 },
    { time: '20:00', efficiency: 95, temperature: 21.5, power: 9.6 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'alert': return 'text-red-600';
      default: return 'text-gray-600';
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
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">NODA CoPilot</h1>
              <div className="flex space-x-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.name)}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.name
                          ? 'text-red-600 bg-red-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                <Zap className="w-4 h-4" />
                <span>Optimize All</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            {/* Search and Filter */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search thermal systems..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select className="text-sm text-gray-600 bg-transparent border-none outline-none">
                    <option>All Status</option>
                    <option>Optimal</option>
                    <option>Warning</option>
                    <option>Alert</option>
                  </select>
                </div>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <List className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-1 rounded ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Globe className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* View Toggle Content */}
            {viewMode === 'list' ? (
              /* Systems List */
              <div className="space-y-4">
                {thermalSystems.map((system) => (
                  <div
                    key={system.id}
                    onClick={() => setSelectedSystem(system)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedSystem?.id === system.id
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          system.status === 'optimal' ? 'bg-green-500' :
                          system.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{system.name}</span>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{system.location}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getEfficiencyColor(system.efficiency)}`}>
                        {system.efficiency}% efficiency
                      </span>
                      <div className={`flex items-center space-x-1 ${getStatusColor(system.status)}`}>
                        {getStatusIcon(system.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Map View - Blekinge County */
              <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer 
                  center={[56.1612, 15.0322]} 
                  zoom={10} 
                  className="w-full h-full"
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {thermalSystems.map((system) => (
                    <Marker 
                      key={system.id} 
                      position={[system.lat, system.lng]}
                      icon={L ? createCustomIcon(system.status) : undefined}
                      eventHandlers={{
                        click: () => setSelectedSystem(system)
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-medium">{system.name}</div>
                          <div className="text-gray-600">{system.location}</div>
                          <div className={`font-medium ${getEfficiencyColor(system.efficiency)}`}>
                            {system.efficiency}% efficiency
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {selectedSystem ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSystem.name}</h2>
                <p className="text-gray-600">Detailed analytics and optimization controls - {selectedSystem.location}</p>
              </div>

              {/* System Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Current Efficiency</h3>
                    <Thermometer className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedSystem.efficiency}%</div>
                  <p className="text-sm text-green-600 mt-1">↑ 2.3% from last week</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Temperature</h3>
                    <Thermometer className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedSystem.temperature}°C</div>
                  <p className="text-sm text-blue-600 mt-1">Target: 21°C</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Power Output</h3>
                    <Zap className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedSystem.power} MW</div>
                  <p className="text-sm text-green-600 mt-1">Optimal range</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    {getStatusIcon(selectedSystem.status)}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 capitalize">{selectedSystem.status}</div>
                  <p className="text-sm text-gray-500 mt-1">Last updated: 2 min ago</p>
                </div>
              </div>

              {/* Performance Charts and Map */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Trends (24h)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="efficiency" 
                          stroke="#ef4444" 
                          fill="#fef2f2" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">System Location</h3>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-64 rounded-lg overflow-hidden">
                    <MapContainer 
                      center={[selectedSystem.lat, selectedSystem.lng]} 
                      zoom={13} 
                      className="w-full h-full"
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      <Marker 
                        position={[selectedSystem.lat, selectedSystem.lng]}
                        icon={L ? createCustomIcon(selectedSystem.status) : undefined}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-medium">{selectedSystem.name}</div>
                            <div className="text-gray-600">{selectedSystem.location}</div>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>

              {/* Additional Charts */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature & Power Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Temperature (°C)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="power" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Power (MW)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Control Panel */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Temperature (°C)
                    </label>
                    <input
                      type="number"
                      defaultValue="21"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Efficiency Target (%)
                    </label>
                    <input
                      type="number"
                      defaultValue="95"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Power (MW)
                    </label>
                    <input
                      type="number"
                      defaultValue="20"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                    Apply Optimization
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    Reset to Default
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="text-center">
                <Thermometer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Thermal System</h3>
                <p className="text-gray-500 mb-6">Choose a system from the sidebar to view detailed analytics</p>
                <button 
                  onClick={() => setSelectedSystem(thermalSystems[0])}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Optimize All Systems
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;