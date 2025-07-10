"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { AICopilot } from '@/components/copilot/AICopilot';
import { useCopilotUiStore } from '@/lib/store/copilotStore';

export default function CopilotSidebar() {
  const { isSidebarOpen, closeSidebar } = useCopilotUiStore();

  return (
    <aside
      className={cn(
        // The vertical border on the main aside element remains.
        "fixed top-0 right-0 h-full w-[400px] bg-background-darker shadow-2xl z-50 transition-transform duration-300 ease-in-out border-l border-border",
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* FIX: The header now has a fixed height (h-16) to match the main dashboard header.
        Padding is adjusted to px-4 to maintain horizontal space, while items-center handles vertical alignment.
        This ensures the border-b aligns perfectly.
      */}
      <div className="h-16 px-4 flex justify-between items-center border-b border-border">
        <h2 className="text-lg font-semibold text-text-light">Noda Copilot</h2>
        <button
          onClick={closeSidebar}
          className="p-2 rounded-md hover:bg-background-light"
        >
          <X className="w-5 h-5 text-text-medium" />
        </button>
      </div>
      {/* The height calculation for the content area is adjusted for the new fixed header height */}
      <div className="p-4 h-[calc(100%-64px)]">
        <AICopilot />
      </div>
    </aside>
  );
}
