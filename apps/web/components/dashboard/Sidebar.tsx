"use client"; // This is a client component

import React from 'react';
import { Search, Filter, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@headlessui/react'; // Assuming headlessui is installed

// Define the shape of a thermal system item
interface ThermalSystem {
  id: string;
  name: string;
  location: string;
  status: 'optimal' | 'warning' | 'alert';
}

// Define props for the Sidebar component
interface SidebarProps {
  thermalSystems: ThermalSystem[];
  selectedSystem: ThermalSystem | null;
  setSelectedSystem: (system: ThermalSystem) => void;
  getStatusIcon: (status: string) => React.ReactElement;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  isLoading: boolean;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'optimal', label: 'Optimal' },
  { value: 'warning', label: 'Warning' },
  { value: 'alert', label: 'Alert' },
];

const DashboardSidebar: React.FC<SidebarProps> = ({
  thermalSystems,
  selectedSystem,
  setSelectedSystem,
  getStatusIcon,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  isLoading,
}) => {
  return (
    // Use theme colors for the container
    <div className="bg-background-light rounded-lg shadow-lg p-4 flex flex-col h-full">
      {/* Use heading font for the title */}
      <h2 className="font-heading text-xl font-bold text-text-light mb-4">
        Thermal Systems
      </h2>

      <div className="mb-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-medium" />
          <input
            type="text"
            placeholder="Search systems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background-dark border border-gray-700 rounded-md pl-10 pr-4 py-2 text-text-light focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition"
          />
        </div>

        {/* Status Filter Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-background-dark border border-gray-700 rounded-md px-3 py-2 text-text-light focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none appearance-none"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Systems List */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {isLoading ? (
          <div className="text-center py-10 text-text-medium">Loading...</div>
        ) : (
          <ul className="space-y-2">
            {thermalSystems.map((system) => (
              <li key={system.id}>
                <button
                  onClick={() => setSelectedSystem(system)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors flex items-center justify-between",
                    selectedSystem?.id === system.id
                      ? 'bg-brand-primary/20' // Highlight selected item with a brand color tint
                      : 'hover:bg-white/5'
                  )}
                >
                  <div>
                    <p className="font-semibold text-text-light">{system.name}</p>
                    <p className="text-sm text-text-medium">{system.location}</p>
                  </div>
                  <div className={cn(
                      'ml-2',
                       system.status === 'optimal' && 'text-status-optimal',
                       system.status === 'warning' && 'text-status-warning',
                       system.status === 'alert' && 'text-status-alert'
                  )}>
                    {getStatusIcon(system.status)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isLoading && thermalSystems.length === 0 && (
          <div className="text-center py-10">
              <p className="text-text-medium">No systems match your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSidebar;