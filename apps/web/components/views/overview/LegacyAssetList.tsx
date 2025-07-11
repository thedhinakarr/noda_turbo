// FILE: apps/web/components/views/overview/LegacyAssetList.tsx
// New Component
'use client';
import { System } from '@/lib/graphql/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LegacyAssetList({ systems }: { systems: System[] }) {
  return (
    <Card className="bg-background-card h-full">
      <CardHeader><CardTitle>Asset list</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2">Name</th>
              <th className="p-2">Asset</th>
              <th className="p-2">Status</th>
              <th className="p-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system, index) => (
              <tr key={system.id} className="border-b border-border">
                <td className="p-2">{index + 1}. {system.name}</td>
                <td className="p-2">1</td>
                <td className="p-2">1</td>
                <td className="p-2">1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}