// FILE: apps/web/app/(dashboard)/layout.tsx
'use client';

import React from 'react';
import { useCopilotStore } from '@/lib/store/copilotStore';
import { NavigationSidebar } from '@/components/layout/NavigationSidebar';
import { Header } from '@/components/layout/Header';
import { CopilotSidebar } from '@/components/copilot/CopilotSidebar';
import { useHighlightEffect } from '@/lib/hooks/useHighlightEffect'; // <<< 1. IMPORT THE HOOK

const COPILOT_SIDEBAR_WIDTH_PX = 450;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCopilotOpen } = useCopilotStore();

  useHighlightEffect(); // <<< 2. ACTIVATE THE HOOK

  return (
    <div className="flex h-screen w-full bg-muted/40 overflow-hidden">
      <NavigationSidebar />
      <div className="flex flex-1 min-w-0">
        <div
          className="flex flex-col h-full transition-all duration-300 ease-in-out"
          style={{
            width: `calc(100% - ${isCopilotOpen ? COPILOT_SIDEBAR_WIDTH_PX : 0}px)`,
          }}
        >
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:gap-8">
            {children}
          </main>
        </div>
        <aside
          className="h-full transition-all duration-300 ease-in-out"
          style={{ width: isCopilotOpen ? COPILOT_SIDEBAR_WIDTH_PX : 0 }}
        >
          {isCopilotOpen && <CopilotSidebar />}
        </aside>
      </div>
    </div>
  );
}