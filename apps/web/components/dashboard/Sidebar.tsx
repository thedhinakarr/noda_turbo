// apps/web/components/dashboard/Sidebar.tsx
"use client"; // This is a client component

import React, { useState } from 'react';
import { MapPin, Search, Filter, List, Globe, CheckCircle, Clock, AlertTriangle, MoreHorizontal } from 'lucide-react';

// Define the shape of a thermal system item
interface ThermalSystem {
  id: string; // Assuming ID is string from GraphQL
  name: string;
  location: string;
  efficiency: number;
  status: 'optimal' | 'warning' | 'alert';
  type: string;
  lat: number;
  lng: number;
  temperature: number;
  power: number;
}

// Define props for the Sidebar component
interface SidebarProps {
  thermalSystems: ThermalSystem[]; // Array of all thermal systems
  selectedSystem: ThermalSystem | null; // The currently selected system
  setSelectedSystem: (system: ThermalSystem) => void; // Function to set the selected system
  getStatusColor: (status: string) => string; // Helper function for status color (passed as prop)
  getStatusIcon: (status: string) => React.ReactElement; // Helper function for status icon (passed as prop)
  getEfficiencyColor: (efficiency: number) => string; // Helper function for efficiency color (passed as prop)
}

const DashboardSidebar: React.FC<SidebarProps> = ({
  thermalSystems,
  selectedSystem,
  setSelectedSystem,
  getStatusColor,
  getStatusIcon,
  getEfficiencyColor,
}) => {
  const [viewMode, setViewMode] = useState('list'); // State for list vs map view (Sidebar owns this state)
  const [showAllStatusDropdown, setShowAllStatusDropdown] = useState(false); // State for status dropdown

  // Note: The map view is NOT part of this sidebar anymore as per discussion.
  // The viewMode toggle is conceptually part of the sidebar's filtering/display options,
  // but the map itself is on the right. Keeping the toggle here for potential future use or re-integration.

  return (
    <div className="lg:col-span-1 flex flex-col">
      <div className="bg-gray-900 rounded-lg shadow p-6 flex-grow overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#F2F2F2]">Thermal Systems</h2>
          <div className="relative">
            {/* All Status Filter Dropdown */}
            <button
              onClick={() => setShowAllStatusDropdown(!showAllStatusDropdown)}
              className="flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-md transition-colors text-[#D9D9D9] hover:text-[#F2F2F2] hover:bg-gray-800"
            >
              <span>All Status</span>
              <Filter className="w-4 h-4" />
            </button>
            {showAllStatusDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                <a href="#" className="block px-4 py-2 text-sm text-[#D9D9D9] hover:bg-gray-700">Optimal</a>
                <a href="#" className="block px-4 py-2 text-sm text-[#D9D9D9] hover:bg-gray-700">Warning</a>
                <a href="#" className="block px-4 py-2 text-sm text-[#D9D9D9] hover:bg-gray-700">Alert</a>
                <a href="#" className="block px-4 py-2 text-sm text-[#D9D9D9] hover:bg-gray-700">All</a>
              </div>
            )}
          </div>
        </div>

        {/* Search Input (kept simple for now) */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D9D9D9] w-4 h-4" />
            <input
              type="text"
              placeholder="Search systems..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-[#8A0A0A] focus:border-[#8A0A0A] outline-none text-[#F2F2F2]"
            />
          </div>
        </div>

        {/* Systems List */}
        <div className="overflow-y-auto h-[calc(100%-8rem)]"> {/* Adjusted height to account for search/filter */}
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                  System Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
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
  );
};

export default DashboardSidebar;