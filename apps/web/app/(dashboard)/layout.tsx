// FILE: apps/web/app/(dashboard)/layout.tsx
// PURPOSE: A definitive layout using explicit width calculations to prevent all overlap.
'use client';

import React from 'react';
import { useCopilotStore } from '@/lib/store/copilotStore';
import { NavigationSidebar } from '@/components/layout/NavigationSidebar';
import { Header } from '@/components/layout/Header';
import { CopilotSidebar } from '@/components/copilot/CopilotSidebar';

// Define the sidebar width as a number for use in calculations.
const COPILOT_SIDEBAR_WIDTH_PX = 450;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCopilotOpen } = useCopilotStore();

  return (
    // Use `overflow-hidden` on the root to prevent the entire page from scrolling.
    <div className="flex h-screen w-full bg-muted/40 overflow-hidden">
      {/* 1. The fixed navigation sidebar on the far left. It does not change. */}
      <NavigationSidebar />

      {/*
        2. This is the main content and sidebar wrapper.
           - `flex-1` makes it take up all available space next to the nav bar.
           - `min-w-0` is CRITICAL. It allows this container to shrink.
           - `flex` ensures its children are laid out horizontally.
      */}
      <div className="flex flex-1 min-w-0">
        {/*
          3. This is the primary content area (Header + Dashboard).
             - Its width is explicitly calculated and animated.
             - When the sidebar is open, its width is `100% - 400px`.
             - When closed, its width is `100%`.
        */}
        <div
          className="flex flex-col h-full transition-all duration-300 ease-in-out"
          style={{
            width: `calc(100% - ${isCopilotOpen ? COPILOT_SIDEBAR_WIDTH_PX : 0}px)`,
          }}
        >
          <Header />
          {/* This main element will scroll if its content is too tall. */}
          <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:gap-8">
            {children}
          </main>
        </div>

        {/*
          4. The AI Copilot sidebar.
             - Its width is animated directly from 0px to 400px.
        */}
        <aside
          className="h-full transition-all duration-300 ease-in-out"
          style={{ width: isCopilotOpen ? COPILOT_SIDEBAR_WIDTH_PX : 0 }}
        >
          {/* We only render the component when it's open to be efficient. */}
          {isCopilotOpen && <CopilotSidebar />}
        </aside>
      </div>
    </div>
  );
}