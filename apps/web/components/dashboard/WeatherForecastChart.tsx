// FILE: apps/web/components/dashboard/WeatherForecastChart.tsx
// This component now uses theme-consistent colors from your globals.css.
'use client';

import { WeatherData } from '@/lib/graphql/types';
import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

export default function WeatherForecastChart({ weatherData }: { weatherData: WeatherData[] }) {
  if (!weatherData || weatherData.length === 0) {
    return <div className="flex h-full items-center justify-center text-text-secondary">No weather data available.</div>;
  }

  const formattedData = weatherData.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: d.outdoorTemperature,
    cloudiness: d.cloudiness,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%" className="bg-background-card">
      <ComposedChart data={formattedData}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="time" stroke="var(--color-text-secondary)" fontSize={12} />
        <YAxis yAxisId="left" stroke="var(--color-text-secondary)" fontSize={12} />
        <YAxis yAxisId="right" orientation="right" stroke="var(--color-text-secondary)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-background-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }}/>
        {/* FIX: Using CSS variables from your globals.css for theme consistency. */}
        <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="var(--color-accent-red)" name="Temperature" dot={false} strokeWidth={2} />
        <Area yAxisId="right" type="monotone" dataKey="cloudiness" fill="var(--color-brand-primary)" stroke="var(--color-brand-accent)" name="Cloudiness" fillOpacity={0.3} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}