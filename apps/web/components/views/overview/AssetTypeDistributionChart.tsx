// FILE: apps/web/components/views/overview/AssetTypeDistributionChart.tsx
// FIXED: Rebuilt to exactly match legacy design.
'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { System } from '@/lib/graphql/types';

const COLORS = ['#00C49F', '#A01543', '#FACC15', '#60A5FA'];

export function AssetTypeDistributionChart({ systems }: { systems: System[] }) {
  const typeDistribution = systems.reduce((acc, system) => {
    const type = system.typeGroup || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));

  return (
    <Card className="bg-background-card h-24 p-2 flex flex-col">
      <CardTitle className="text-sm font-normal text-text-secondary text-center flex-none">Asset type distribution</CardTitle>
      <div className="flex-grow flex items-center justify-center w-full h-full">
        {chartData.length > 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius="60%" outerRadius="100%">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex flex-col justify-center items-start pl-4">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-text-secondary">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No data</p>
        )}
      </div>
    </Card>
  );
}