// FILE: apps/web/components/copilot/CopilotSheet.tsx
// PURPOSE: A new component that wraps the AI Copilot in a slide-out Sheet.
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AICopilot } from './AICopilot';
import { useCopilotStore } from '@/lib/store/copilotStore';

export function CopilotSheet() {
  // The Sheet's open/closed state is controlled by our global store.
  const { isCopilotOpen, setCopilotOpen } = useCopilotStore();

  return (
    <Sheet open={isCopilotOpen} onOpenChange={setCopilotOpen}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6">
          <SheetTitle>AI Copilot</SheetTitle>
          <SheetDescription>
            Ask questions about your system data. The AI can help you find insights.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto">
          <AICopilot />
        </div>
      </SheetContent>
    </Sheet>
  );
}