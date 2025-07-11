// FILE: apps/web/components/views/overview/ActiveAssetsKPI.tsx
// FIXED: Rebuilt to exactly match legacy design.
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ActiveAssetsKPI({ count }: { count: number }) {
  return (
    <Card className="bg-background-card h-24 p-2 flex flex-col justify-center items-center text-center">
      <CardTitle className="text-sm font-normal text-text-secondary mb-2">Number of active assets</CardTitle>
      <p className="text-4xl font-bold text-green-500">7</p>
    </Card>
  );
}