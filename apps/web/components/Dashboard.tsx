// =================================================================
// FILE: apps/web/components/Dashboard.tsx
// (This is a NEW component file containing all the dashboard UI)
// =================================================================
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Settings, BarChart3, FileText, Download, Zap, AlertTriangle, CheckCircle, Clock, MapPin, Search, Filter, MoreHorizontal, Globe, List, Maximize2 } from 'lucide-react';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    allDashboardData(limit: 50) {
      uuid
      building_control
      property_meter
      asset_latitude
      asset_longitude
      time_period
      efficiency
      rank_overall
      fault_valve
      fault_transfer
      temperature: dt_abs
      power: energy_abs
    }
  }
`;

const createCustomIcon = (status, L) => {
  const color = status === 'optimal' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';
  if (!L || !L.divIcon) return null;
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const DashboardComponent = () => {
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [viewMode, setViewMode] = useState('list');
  const [L, setL] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
        delete leaflet.default.Icon.Default.prototype._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);
  
  const thermalSystems = useMemo(() => {
    if (!data || !data.allDashboardData) return [];
    return data.allDashboardData.map((item) => {
      let status = 'optimal';
      if (item.fault_valve > 0.5 || item.fault_transfer > 0.5) status = 'alert';
      else if (item.fault_valve > 0.2 || item.fault_transfer > 0.2) status = 'warning';
      return { id: item.uuid, name: item.building_control, location: item.property_meter, efficiency: item.efficiency, status, lat: item.asset_latitude, lng: item.asset_longitude, temperature: item.temperature, power: item.power };
    });
  }, [data]);

  useEffect(() => {
    if (thermalSystems.length > 0 && !selectedSystem) {
      setSelectedSystem(thermalSystems[0]);
    }
  }, [thermalSystems, selectedSystem]);

  const performanceData = [
     { time: '00:00', efficiency: 92, temperature: 20, power: 8.2 },
     { time: '04:00', efficiency: 94, temperature: 19.5, power: 7.8 },
     { time: '08:00', efficiency: 89, temperature: 21, power: 12.4 },
     { time: '12:00', efficiency: 87, temperature: 22.5, power: 15.2 },
     { time: '16:00', efficiency: 91, temperature: 23, power: 13.8 },
     { time: '20:00', efficiency: 95, temperature: 21.5, power: 9.6 },
  ];

  const getStatusColor = (status) => (status === 'optimal' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600');
  const getStatusIcon = (status) => (status === 'optimal' ? <CheckCircle className="w-5 h-5 text-green-500" /> : status === 'warning' ? <Clock className="w-5 h-5 text-yellow-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />);
  const getEfficiencyColor = (efficiency) => (efficiency >= 90 ? 'text-green-600' : efficiency >= 80 ? 'text-yellow-600' : 'text-red-600');
  const tabs = [{ name: 'Dashboard', icon: BarChart3 }, { name: 'Analytics', icon: BarChart3 }, { name: 'Reports', icon: FileText }, { name: 'Settings', icon: Settings }];

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen">Error loading data: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-4"><h1 className="text-xl font-semibold text-gray-900">NODA CoPilot</h1><div className="flex space-x-6">{tabs.map((tab) => { const Icon = tab.icon; return (<button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.name ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}><Icon className="w-4 h-4" /><span>{tab.name}</span></button>);})}</div></div><div className="flex items-center space-x-3"><button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" /><span>Export</span></button><button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"><Zap className="w-4 h-4" /><span>Optimize All</span></button></div></div></div>
      </header>
      <div className="flex">
        <div className="w-80 bg-white shadow-sm border-r border-gray-200 min-h-screen"><div className="p-6"><div className="mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search thermal systems..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" /></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center space-x-2"><Filter className="w-4 h-4 text-gray-500" /><select className="text-sm text-gray-600 bg-transparent border-none outline-none focus:ring-0"><option>All Status</option><option>Optimal</option><option>Warning</option><option>Alert</option></select></div><div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1"><button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}><List className="w-4 h-4 text-gray-600" /></button><button onClick={() => setViewMode('map')} className={`p-1 rounded ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}><Globe className="w-4 h-4 text-gray-600" /></button></div></div></div>{viewMode === 'list' ? (<div className="space-y-4">{thermalSystems.map((system) => (<div key={system.id} onClick={() => setSelectedSystem(system)} className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedSystem?.id === system.id ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300' }`}><div className="flex items-start justify-between mb-2"><div className="flex items-center space-x-2"><div className={`w-3 h-3 rounded-full ${system.status === 'optimal' ? 'bg-green-500' : system.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500' }`} /><span className="text-sm font-medium text-gray-900">{system.name}</span></div><button className="p-1 text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button></div><div className="flex items-center space-x-1 text-xs text-gray-500 mb-2"><MapPin className="w-3 h-3" /><span>{system.location}</span></div><div className="flex items-center justify-between"><span className={`text-sm font-medium ${getEfficiencyColor(system.efficiency)}`}>{system.efficiency.toFixed(1)}% efficiency</span><div className={`flex items-center space-x-1 text-xs ${getStatusColor(system.status)}`}>{getStatusIcon(system.status)}</div></div></div>))}</div>) : (<div className="h-96 rounded-lg overflow-hidden border border-gray-200">{L && (<MapContainer center={[56.1612, 15.0322]} zoom={9} className="w-full h-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />{thermalSystems.map((system) => (<Marker key={system.id} position={[system.lat, system.lng]} icon={createCustomIcon(system.status, L)} eventHandlers={{ click: () => setSelectedSystem(system) }}><Popup><div className="text-sm"><div className="font-medium">{system.name}</div></div></Popup></Marker>))}</MapContainer>)}</div>)}</div></div>
        <div className="flex-1 p-8">{selectedSystem ? (<div><div className="mb-6"><h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSystem.name}</h2><p className="text-gray-600">Detailed analytics and optimization controls - {selectedSystem.location}</p></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-sm font-medium text-gray-500">Current Efficiency</h3><p className={`text-2xl font-bold ${getEfficiencyColor(selectedSystem.efficiency)}`}>{selectedSystem.efficiency.toFixed(1)}%</p></div><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-sm font-medium text-gray-500">Temperature</h3><p className="text-2xl font-bold text-gray-900">{selectedSystem.temperature.toFixed(1)}°C</p></div><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-sm font-medium text-gray-500">Power Output</h3><p className="text-2xl font-bold text-gray-900">{selectedSystem.power.toFixed(1)} MW</p></div><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-sm font-medium text-gray-500">Status</h3><div className={`flex items-center text-2xl font-bold ${getStatusColor(selectedSystem.status)}`}>{getStatusIcon(selectedSystem.status)}<span className="ml-2 capitalize">{selectedSystem.status}</span></div></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Trends (24h)</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Area type="monotone" dataKey="efficiency" stroke="#ef4444" fill="#fef2f2" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></div><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-lg font-semibold text-gray-900 mb-4">System Location</h3><div className="h-64 rounded-lg overflow-hidden">{L && (<MapContainer center={[selectedSystem.lat, selectedSystem.lng]} zoom={13} className="w-full h-full" scrollWheelZoom={false}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' /><Marker position={[selectedSystem.lat, selectedSystem.lng]} icon={createCustomIcon(selectedSystem.status, L)} /></MapContainer>)}</div></div></div></div>) : (<div className="flex flex-col items-center justify-center h-full"><div className="text-center"><Thermometer className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Thermal System</h3><p className="text-gray-500">Choose a system from the sidebar to view detailed analytics.</p></div></div>)}</div>
      </div>
    </div>
  );
};

export default DashboardComponent;