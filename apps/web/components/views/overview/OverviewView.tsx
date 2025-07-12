// FILE: apps/web/components/views/overview/OverviewView.tsx
// UPDATED FILE: The main view component with the new map-centric layout.
'use client';

import { useQuery } from '@apollo/client';
import { GET_OVERVIEW_PAGE_DATA } from '@/lib/graphql/queries';
import type { OverviewPageData, Building } from '@/lib/graphql/types';
import { useMemo } from 'react';
import { format, isValid } from "date-fns";
import dynamic from 'next/dynamic';

// Import shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Import Recharts components for charting
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Import Lucide React icons
import { Building as BuildingIcon, Thermometer, Cloud, Activity } from 'lucide-react';

// Dynamically import the map component to ensure it only runs on the client side
const SystemsMap = dynamic(() => import('./SystemsMap').then(mod => mod.SystemsMap), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});


// --- Main View Component ---
export function OverviewView() {
  const { loading, error, data } = useQuery<OverviewPageData>(GET_OVERVIEW_PAGE_DATA);

  // Memoize processed data to prevent re-calculation on every render
  const { buildings, kpiData, weatherChartData } = useMemo(() => {
    const buildings = data?.overview?.buildings ?? [];
    const weather = data?.overview?.weather ?? [];

    const kpiData = {
      total: buildings.length,
      active: buildings.filter(b => b.asset_active).length,
      optimal: buildings.filter(b => b.asset_status === 'optimal').length,
      alerts: buildings.filter(b => b.asset_status === 'alert').length,
    };

    const weatherChartData = weather
      .map(w => {
        const date = new Date(w.time_period);
        if (!isValid(date)) return null;
        return {
          time: format(date, 'MMM dd'),
          temperature: w.outdoor_temperature,
        };
      })
      .filter((item): item is { time: string; temperature: number | null } => item !== null)
      .slice()
      .reverse();

    return { buildings, kpiData, weatherChartData };
  }, [data]);

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <Card className="w-full bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Buildings" value={kpiData.total.toString()} icon={BuildingIcon} />
        <KPICard title="Active Buildings" value={kpiData.active.toString()} icon={Activity} />
        <KPICard title="Optimal Status" value={kpiData.optimal.toString()} icon={BuildingIcon} />
        <KPICard title="Active Alerts" value={kpiData.alerts.toString()} icon={Activity} />
      </div>

      {/* Row 2: Leaflet Map */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Locations</CardTitle>
          <CardDescription>A geographical overview of all building assets.</CardDescription>
        </CardHeader>
        <CardContent className="h-[450px] p-2">
          <SystemsMap buildings={buildings} />
        </CardContent>
      </Card>

      {/* Row 3: Asset Table and Weather Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentBuildingsTable buildings={buildings} />
        </div>
        <div>
          <WeatherLineChart data={weatherChartData} />
        </div>
      </div>
    </div>
  );
}

// --- Child Components ---

function KPICard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function WeatherLineChart({ data }: { data: { time: string; temperature: number | null }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature Trend</CardTitle>
        <CardDescription>Recent outdoor temperature readings.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTemperature" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-accent)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-brand-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}°C`} />
            <Tooltip
              cursor={{ stroke: 'var(--color-brand-primary)', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
            />
            <Area type="monotone" dataKey="temperature" stroke="var(--color-brand-primary)" fillOpacity={1} fill="url(#colorTemperature)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RecentBuildingsTable({ buildings }: { buildings: Building[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Buildings</CardTitle>
        <CardDescription>A complete list of all assets in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
           
            </TableRow>
          </TableHeader>
          <TableBody>
            {buildings.map((building) => (
              <TableRow key={building.uuid}>
                <TableCell className="font-medium">{building.name}</TableCell>
                <TableCell>
                  <Badge variant={building.asset_status === 'optimal' ? 'default' : 'destructive'}>
                    {building.asset_status}
                  </Badge>
                </TableCell>
                <TableCell>{building.asset_type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-[520px]" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}