// apps/web/components/copilot/CopilotSidebar.tsx
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { AICopilot } from '@/components/copilot/AICopilot';
import { useCopilot } from '@/context/CopilotContext';

// Accept 'isVisible' prop to control its appearance
export default function CopilotSidebar({ isVisible }: { isVisible: boolean }) {
  const { setCopilotOpen } = useCopilot();

  const handleCloseCopilot = () => {
    setCopilotOpen(false);
  };

  // Define the target width for the open state (e.g., w-96 = 24rem/384px)
  const OPEN_WIDTH_CLASS = 'w-128'; // Increased width for the Copilot

  return (
    // Apply transition classes directly to the sidebar's main div.
    // When not visible, set width to w-0 and overflow-hidden for smooth transition.
    <div
      className={`
        h-full bg-background-dark border-l border-border flex flex-col flex-shrink-0
        transition-all duration-300 ease-in-out transform
        ${isVisible ? OPEN_WIDTH_CLASS : 'w-0 overflow-hidden'}
      `}
    >
      {/* Conditionally render content only when visible to prevent interaction with hidden elements */}
      {/* This is crucial for performance and preventing layout shifts during transition */}
      {isVisible && (
        <>
          {/* Header with Close Button */}
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <h2 className="font-heading text-xl font-bold text-text-light">NODA CoPilot</h2>
            <button
              onClick={handleCloseCopilot}
              className="p-2 rounded-full hover:bg-background-card text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close Copilot"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* AICopilot Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <AICopilot />
          </div>
        </>
      )}
    </div>
  );
}