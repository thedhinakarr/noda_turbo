// apps/web/app/(dashboard)/layout.tsx
"use client"; // Keep this as a Client Component, as it uses CopilotProvider/Wrapper

import NavigationSidebar from '@/components/layout/NavigationSidebar';
import { CopilotProvider } from '@/context/CopilotContext';
import CopilotWrapper from '@/components/copilot/CopilotWrapper';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'; // <--- IMPORT THE NEW HEADER

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CopilotProvider>
      <div className="flex h-screen bg-background-dark">
        
        {/* 1. The Left Navigation Sidebar */}
        <div className="w-48 flex-shrink-0"> 
          <NavigationSidebar />
        </div>

        {/* 2. The Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* RENDER THE NEW HEADER HERE, ABOVE THE PAGE CONTENT */}
          <DashboardPageHeader /> 
          
          {/* Add a div for consistent padding around the actual page content */}
          {/* This ensures the page content doesn't butt directly against the header/sidebar */}
          <div className="px-4"> 
            {children} {/* This is where your individual page content (OverviewView, BuildingView, etc.) gets rendered */}
          </div>
        </main>

        {/* 3. The Collapsible Copilot Sidebar on the Right */}
        <CopilotWrapper /> 

      </div>
    </CopilotProvider>
  );
}