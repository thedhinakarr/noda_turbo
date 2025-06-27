// apps/web/components/dashboard/Header.tsx
"use client"; // This component will be used in a client component parent

import React from 'react';
import { LogOut, BarChart3, FileText, Settings, LayoutDashboard, Bot } from 'lucide-react'; // Added Bot icon for Copilot
import { cn } from '@/lib/utils'; // Assuming this utility exists for class merging

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
    { name: 'Dashboard', icon: LayoutDashboard }, // Use a more fitting icon
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings }
  ];

  const handleCopilotClick = () => {
    // Placeholder for LLM/Copilot functionality
    console.log("CoPilot LLM button clicked!");
    // You might open a chat modal, redirect, or trigger an LLM API call here.
  };

  return (
    // Use theme colors for the header background and border
    <header className="bg-background-light shadow-sm border-b border-background-dark">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left section: Logo/Heading + Navigation Tabs */}
        <div className="flex items-center space-x-6"> {/* Increased space for tabs next to logo */}
          {/* Use the heading font for the main title */}
          <h1 className="text-xl font-heading font-bold text-brand-accent">NODA</h1> {/* Using text-text-default */}
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-3"> {/* Space between tabs */}
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  // Use theme colors and dynamic classes for active/inactive states
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    activeTab === tab.name
                      ? 'text-brand-highlight bg-brand-primary/10' // Active tab uses brand color
                      : 'text-text-medium hover:text-text-default hover:bg-background-dark/50' // Inactive tab styles
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right section: Copilot Button + Logout Button */}
        <div className="flex items-center space-x-3"> {/* Space between right-side buttons */}
          {/* Copilot Button */}
          <button
            onClick={handleCopilotClick}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
                       bg-brand-accent text-text-default hover:bg-brand-highlight" // Use theme colors
          >
            <Bot className="w-4 h-4" />
            <span>CoPilot LLM</span>
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                       text-text-medium hover:text-text-default hover:bg-background-dark/50" // Use theme colors
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