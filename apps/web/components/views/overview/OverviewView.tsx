// apps/web/components/views/overview/OverviewView.tsx
"use client";

import React from 'react';
// REMOVED: import OverviewHeader from '@/components/dashboard/OverviewHeader'; // No longer needed here

export default function OverviewView() {
    return (
        // REMOVED: <OverviewHeader />
        // The header is now in DashboardLayout.tsx
        <div className="w-full">
            {/* The line below the header is now part of DashboardPageHeader's border-b.
                Adjust spacing as needed.
            */}
            <div className="pt-6 mt-6"> 
                <p className="text-sm text-text-secondary">
                    Latest recorded value: 2025-06-23 - 14:00
                </p>
            </div>

            <div className="mt-6">
                {/* <KPICardGrid /> */}
                <p className="text-text-secondary">KPI Card Grid will be here.</p>
            </div>
        </div>
    );
}