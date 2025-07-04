// apps/web/components/copilot/CopilotWrapper.tsx
"use client";

import { useCopilot } from '@/context/CopilotContext';
import CopilotSidebar from './CopilotSidebar'; // Ensure this path is correct

export default function CopilotWrapper() {
  const { isCopilotOpen } = useCopilot();
  
  // Pass the state down as a prop named 'isVisible'
  return <CopilotSidebar isVisible={isCopilotOpen} />;
}