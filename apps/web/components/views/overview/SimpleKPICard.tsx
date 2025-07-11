// FILE: apps/web/components/views/overview/SimpleKPICard.tsx
// This is the new, lean KPI card component.
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleKPICardProps {
  id: string;
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendDirection: 'up' | 'down' | 'none';
}

export function SimpleKPICard({ id, title, value, icon: Icon, trend, trendDirection }: SimpleKPICardProps) {
  const trendClasses = cn(
    'text-xs text-text-secondary flex items-center',
    { 'text-green-500': trendDirection === 'up' },
    { 'text-red-500': trendDirection === 'down' }
  );

  const TrendIcon = trendDirection === 'up' ? ArrowUpRight : trendDirection === 'down' ? ArrowDownRight : Minus;

  return (
    // FIX: The `bg-background-card` class should be defined in your globals.css to be a solid color.
    // This ensures the card is not transparent.
    <Card id={id} className="bg-background-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">{title}</CardTitle>
        <Icon className="h-4 w-4 text-text-secondary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        <p className={trendClasses}>
          <TrendIcon className="h-3 w-3 mr-1" />
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}