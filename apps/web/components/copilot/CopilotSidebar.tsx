// FILE: apps/web/components/copilot/CopilotSidebar.tsx
// PURPOSE: This component is now simpler. It is no longer a Sheet,
// but a regular component that will be placed inside the new grid layout.
'use client';

import { AICopilot } from './AICopilot';
import { Button } from '@/components/ui/button';
import { Bot, X } from 'lucide-react';
import { useCopilotStore } from '@/lib/store/copilotStore';

export function CopilotSidebar() {
  const { toggleCopilot } = useCopilotStore();
  
  return (
    <div className="flex h-full max-h-screen flex-col gap-2 border-l bg-muted/40">
      <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6" />
          <span className="">AI Copilot</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleCopilot}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {/* The AICopilot component with the chat interface goes here */}
        <AICopilot />
      </div>
    </div>
  );
}