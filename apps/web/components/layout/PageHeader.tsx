// FILE: apps/web/components/layout/PageHeader.tsx
// NEW FILE: A new, simplified header that matches your screenshot's design.
'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../dashboard/ThemeToggle';
import { useCopilotStore } from '@/lib/store/copilotStore';
import { MessageSquare } from 'lucide-react';

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const { toggleCopilot } = useCopilotStore();

  return (
    <div className="flex items-center justify-between mb-6">
     
    </div>
  );
}