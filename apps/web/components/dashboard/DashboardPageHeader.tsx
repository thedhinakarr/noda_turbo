"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { useCopilotUiStore } from '@/lib/store/copilotStore';
import { cn } from '@/lib/utils';
// Import our new, clean ThemeToggle component
import { ThemeToggle } from './ThemeToggle';

const DashboardPageHeader = () => {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useCopilotUiStore();

  const formatTitle = (path: string) => {
    const title = path.split('/').pop() || 'overview';
    if (title === 'dashboard' || title === '') return 'Overview';
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  return (
    <header className="flex h-16 items-center justify-between p-4 border-b border-border flex-shrink-0">
      <h1 className="text-2xl font-bold text-text-light">{formatTitle(pathname)}</h1>
      <div className="flex items-center gap-x-2">
        {/* Add the ThemeToggle component here */}
        <ThemeToggle />
        
        {/* Copilot Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-2 rounded-full transition-colors",
            isSidebarOpen ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-background-light'
          )}
          title="Toggle Noda Copilot"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default DashboardPageHeader;