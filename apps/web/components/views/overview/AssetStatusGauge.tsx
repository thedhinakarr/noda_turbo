// FILE: apps/web/components/views/overview/AssetStatusGauge.tsx
// FIXED: Rebuilt to exactly match legacy design.
'use client';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { System } from '@/lib/graphql/types';

export function AssetStatusGauge({ systems }: { systems: System[] }) {
  const systemsWithStatus = systems.filter(s => typeof s.ranking?.overall === 'number');
  const avgStatus = systemsWithStatus.length > 0
    ? systemsWithStatus.reduce((acc, s) => acc + s.ranking!.overall!, 0) / systemsWithStatus.length
    : 0;
  
  const data = [{ name: 'status', value: Math.round(avgStatus) }];

  return (
    <Card className="bg-background-card h-24 p-2 flex flex-col">
      <CardTitle className="text-sm font-normal text-text-secondary text-center flex-none">Avg. asset status [%]</CardTitle>
      <div className="w-full h-full flex-grow">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={-180} barSize={12}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: 'rgba(75, 85, 99, 0.5)' }} dataKey="value" cornerRadius={6} fill="#34D399" />
            <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-current text-text-primary">
              {data[0].value}%
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}