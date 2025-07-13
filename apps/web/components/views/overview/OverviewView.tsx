// FILE: apps/web/components/views/overview/OverviewView.tsx
// UPDATED FILE: Now uses the new, simpler, and more reliable chart.
'use client';

import { useQuery } from '@apollo/client';
import { GET_OVERVIEW_PAGE_DATA } from '@/lib/graphql/queries';
import type { OverviewPageData, Building } from '@/lib/graphql/types';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Import shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Import Lucide React icons
import { Building as BuildingIcon, Activity } from 'lucide-react';
// Import the new simple chart
import { WeatherTrendSimpleChart } from './WeatherTrendSimpleChart';

const SystemsMap = dynamic(() => import('./SystemsMap').then(mod => mod.SystemsMap), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

// --- Main View Component ---
export function OverviewView() {
  const { loading, error, data } = useQuery<OverviewPageData>(GET_OVERVIEW_PAGE_DATA);

  const { buildings, kpiData, weatherData } = useMemo(() => {
    const buildings = data?.overview?.buildings ?? [];
    const weatherData = data?.overview?.weather ?? [];

    const kpiData = {
      total: buildings.length,
      active: buildings.filter(b => b.asset_active).length,
      optimal: buildings.filter(b => b.asset_status === 'optimal').length,
      alerts: buildings.filter(b => b.asset_status === 'alert').length,
    };
    
    return { buildings, kpiData, weatherData };
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
          {/* USE THE NEW, SIMPLER CHART */}
          <WeatherTrendSimpleChart data={weatherData} />
        </div>
      </div>
    </div>
  );
}

// --- Child Components (These remain unchanged) ---

function KPICard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  // ... (no changes needed)
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

function RecentBuildingsTable({ buildings }: { buildings: Building[] }) {
  // ... (no changes needed)
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
  // ... (no changes needed)
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