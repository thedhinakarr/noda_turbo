// FILE: apps/web/components/views/overview/OverviewView.tsx
// This Client Component now correctly passes the live data to the KPI cards.
'use client';

import React from 'react';
import { OverviewData, System } from '@/lib/graphql/types';
import dynamic from 'next/dynamic';
import AssetListTable from '@/components/dashboard/AssetListTable';
import WeatherForecastChart from '@/components/dashboard/WeatherForecastChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import the legacy components
import { TimestampDisplay } from './TimestampDisplay';
import { AssetTypeDistributionChart } from './AssetTypeDistributionChart';
import { AssetStatusGauge } from './AssetStatusGauge';
import { ActiveAssetsKPI } from './ActiveAssetsKPI';

const SystemsMap = dynamic(() => import('@/components/dashboard/SystemsMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full rounded-lg bg-background-card animate-pulse" />,
});

export function OverviewView({ initialData }: { initialData: OverviewData }) {
  const buildings: System[] = initialData?.overview?.buildings ?? [];
  const weatherData = initialData?.overview?.weather ?? [];
  
  let latestTimestamp: string | undefined = undefined;
  if (weatherData && weatherData.length > 0) {
    latestTimestamp = weatherData.reduce((latest, current) => {
      if (!current.timestamp) return latest;
      if (!latest) return current.timestamp;
      return new Date(current.timestamp) > new Date(latest) ? current.timestamp : latest;
    }, weatherData[0]?.timestamp);
  }

  const activeAssets = buildings.filter(b => b.uuid === 'OPERATIONAL').length;

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4">
      {/* Top Row: Legacy KPI Cards now receive live data */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimestampDisplay timestamp={Date.now()} />
        <AssetTypeDistributionChart systems={buildings} />
        <AssetStatusGauge systems={buildings} />
        <ActiveAssetsKPI count={activeAssets} />
      </section>

      {/* Middle Row: Map */}
      <section className="flex-grow rounded-lg bg-background-card p-1">
        <SystemsMap systems={buildings} />
      </section>

      {/* Bottom Row: Asset List & Weather */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
            <AssetListTable systems={buildings} />
        </div>
        <Card className="bg-background-card">
            <CardHeader><CardTitle>Weather Forecast</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
                <WeatherForecastChart weatherData={weatherData} />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}