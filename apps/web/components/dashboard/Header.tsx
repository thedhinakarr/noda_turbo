// apps/web/components/dashboard/Header.tsx
"use client"; // This component will be used in a client component parent

import React from 'react';
import { LogOut, BarChart3, FileText, Settings } from 'lucide-react'; // Import icons needed for header

// Define the shape of a tab item
interface Tab {
  name: string;
  icon: React.ElementType; // Icon component type
}

// Define props for the Header component
interface HeaderProps {
  activeTab: string;
  setActiveTab: (tabName: string) => void;
  handleLogout: () => void;
}

const DashboardHeader: React.FC<HeaderProps> = ({ activeTab, setActiveTab, handleLogout }) => {
  const tabs: Tab[] = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings }
  ];

  return (
    <header className="bg-gray-900 shadow-sm border-b border-gray-800">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#F2F2F2]">NODA CoPilot</h1>
        <div className="flex items-center space-x-3">
          {tabs.map((tab) => {
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
  );
};

export default DashboardHeader;