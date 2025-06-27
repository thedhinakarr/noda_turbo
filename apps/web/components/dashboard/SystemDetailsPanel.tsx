// apps/web/components/dashboard/SystemDetailsPanel.tsx
"use client"; // This is a client component

import React from 'react';
import { Maximize2, CheckCircle, Clock, AlertTriangle, Thermometer, Zap } from 'lucide-react'; // Import necessary icons

// Define the shape of a thermal system item (minimal required for this panel)
interface ThermalSystem {
  id: string;
  name: string;
  location: string;
  type: string;
  efficiency: number;
  status: 'optimal' | 'warning' | 'alert';
  temperature: number;
  power: number;
}

// Define props for the SystemDetailsPanel component
interface SystemDetailsPanelProps {
  selectedSystem: ThermalSystem; // The currently selected system (guaranteed to be non-null when this renders)
  getStatusColor: (status: string) => string; // Helper for status text color
  getStatusIcon: (status: string) => React.ReactElement; // Helper for status icon
  getEfficiencyColor: (efficiency: number) => string; // Helper for efficiency text color
}

const SystemDetailsPanel: React.FC<SystemDetailsPanelProps> = ({
  selectedSystem,
  getStatusColor,
  getStatusIcon,
  getEfficiencyColor,
}) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-[#F2F2F2] mb-4">System Details: {selectedSystem.name}</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[#D9D9D9]">Name</p>
          <p className="text-base text-[#F2F2F2]">{selectedSystem.name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[#D9D9D9]">Location</p>
          {/* This will display "Not defined" if backend sends it. Fix database for real data. */}
          <p className="text-base text-[#F2F2F2]">{selectedSystem.location}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[#D9D9D9]">Type</p>
          {/* This will display "Not defined" if backend sends it. Fix database for real data. */}
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
  );
};

export default SystemDetailsPanel;