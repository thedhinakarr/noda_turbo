"use client";

import React, { useEffect } from 'react';
import NavigationSidebar from '@/components/layout/NavigationSidebar';
import CopilotWrapper from '@/components/copilot/CopilotWrapper';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import { useSession } from "next-auth/react";
import { useCopilotUiStore } from '@/lib/store/copilotStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the state of the sidebar from our global store
  const { isSidebarOpen } = useCopilotUiStore();

  // This is the temporary code to log the session token for Postman testing.
  const { data: session } = useSession();
  useEffect(() => {
    if (session) {
      console.log("SESSION FOUND. Use this token for Postman:");
      console.log(session.accessToken);
    }
  }, [session]);

  return (
    <div className="flex h-screen bg-background-dark text-text-primary overflow-hidden">
      <NavigationSidebar />
      {/* This is the main content area. We conditionally apply a right margin
        to "push" it to the left when the Copilot sidebar is open.
        The transition classes ensure this push is animated smoothly.
      */}
      <main
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          isSidebarOpen ? "mr-[400px]" : "mr-0"
        )}
      >
        <DashboardPageHeader />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
      {/* The CopilotWrapper renders the sidebar, which is a fixed element */}
      <CopilotWrapper />
    </div>
  );
}
