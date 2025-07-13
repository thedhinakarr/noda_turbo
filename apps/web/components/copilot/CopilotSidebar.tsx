// FILE: apps/web/components/copilot/CopilotSidebar.tsx
// PURPOSE: Simplified sidebar content with a close button connected to the store.
'use client';

import { AICopilot } from './AICopilot';
import { Button } from '@/components/ui/button';
import { Bot, X } from 'lucide-react';
import { useCopilotStore } from '@/lib/store/copilotStore';

export function CopilotSidebar() {
  const { toggleCopilot } = useCopilotStore();
  
  return (
    <div className="flex h-full max-h-screen flex-col gap-2 border-l bg-background shadow-lg">
      <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Bot className="h-6 w-6" />
          <span className="">Copilot</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleCopilot} className="hover:bg-accent">
          <X className="h-4 w-4" />
          <span className="sr-only">Close Copilot</span>
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <AICopilot />
      </div>
    </div>
  );
}