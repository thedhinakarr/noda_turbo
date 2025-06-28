"use client";

import React from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the shape of a thermal system item
interface ThermalSystem {
  id: string;
  name: string;
  location: string;
  type: string;
  efficiency: number;
  status: 'optimal' | 'warning' | 'alert';
  temperature: number | null;
  power: number | null;
}

// REFACTORED: The component's props are simplified. It no longer needs color helper functions.
interface SystemDetailsPanelProps {
  selectedSystem: ThermalSystem;
  getStatusIcon: (status: string) => React.ReactElement;
}

const SystemDetailsPanel: React.FC<SystemDetailsPanelProps> = ({
  selectedSystem,
  getStatusIcon,
}) => {
  // Helper to format efficiency as a percentage string
  const formatEfficiency = (efficiency: number | null): string => {
    if (efficiency === null || efficiency === undefined) return 'N/A';
    const percentage = efficiency < 1 ? efficiency * 100 : efficiency;
    return percentage.toFixed(1);
  };

  // Helper to get the correct status color class from our theme
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-status-optimal';
      case 'warning': return 'text-status-warning';
      case 'alert': return 'text-status-alert';
      default: return 'text-text-medium';
    }
  };

  return (
    // Use theme colors and add a subtle animation
    <div className="bg-background-light rounded-lg shadow-lg p-6 animate-fade-in">
      {/* Use the 'heading' font for the title */}
      <h2 className="text-xl font-heading font-bold text-text-light mb-4">
        System Details: {selectedSystem.name}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Column 1 */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text-medium">Name</p>
            <p className="text-base text-text-light">{selectedSystem.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-text-medium">Location</p>
            <p className="text-base text-text-light">{selectedSystem.location || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-text-medium">Type</p>
            <p className="text-base text-text-light capitalize">{selectedSystem.type || 'N/A'}</p>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text-medium">Current Efficiency</p>
            {/* REFACTORED: Apply status color directly based on system status */}
            <p className={cn("text-base font-semibold", getStatusClass(selectedSystem.status))}>
              {formatEfficiency(selectedSystem.efficiency)}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text-medium">Status</p>
            {/* REFACTORED: Apply status color directly */}
            <p className={cn("text-base font-semibold flex items-center", getStatusClass(selectedSystem.status))}>
              {getStatusIcon(selectedSystem.status)}
              <span className="ml-2 capitalize">{selectedSystem.status}</span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text-medium">Temperature</p>
            <p className="text-base text-text-light">
              {selectedSystem.temperature != null ? `${selectedSystem.temperature.toFixed(1)} °C` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text-medium">Power Output</p>
            <p className="text-base text-text-light">
              {selectedSystem.power != null ? `${selectedSystem.power.toFixed(2)} MW` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Use brand colors from the theme for the primary action button */}
      <button className="w-full mt-6 bg-brand-primary text-text-light py-2 px-4 rounded-md font-semibold hover:bg-brand-accent transition-all flex items-center justify-center space-x-2">
        <Maximize2 className="w-4 h-4" />
        <span>View Full Analytics</span>
      </button>
    </div>
  );
};

export default SystemDetailsPanel;
