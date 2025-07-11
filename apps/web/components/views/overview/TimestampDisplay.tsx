// FILE: apps/web/components/views/overview/TimestampDisplay.tsx
// FIXED: Final production version.
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TimestampDisplay({ timestamp }: { timestamp?: string }) {
  const displayTime = timestamp ? new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ') : 'N/A';
  return (
    <Card className="bg-background-card h-24 p-2 flex flex-col justify-center items-center text-center">
        <CardTitle className="text-sm font-normal text-text-secondary mb-2">Timestamp latest value</CardTitle>
        <p className="text-xl font-mono text-text-primary">{displayTime}</p>
    </Card>
  );
}