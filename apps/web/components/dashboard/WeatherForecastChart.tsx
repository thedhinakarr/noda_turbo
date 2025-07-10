// apps/web/components/dashboard/WeatherForecastChart.tsx
"use client";

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { WeatherData } from '@/lib/graphql/types'; // Import your WeatherData type
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card';
import { format } from 'date-fns'; // For formatting timestamps

interface WeatherForecastChartProps {
  weatherData: WeatherData[];
}

const WeatherForecastChart: React.FC<WeatherForecastChartProps> = ({ weatherData }) => {
  // Prepare data for recharts: filter out nulls and format timestamp for display
  const chartData = weatherData
    .filter(d => d.outdoorTemperature !== null && d.cloudiness !== null) // Ensure both values exist
    .map(d => ({
      ...d,
      // Format timestamp for display on the X-axis
      // Example: 'Jul 10, 14:00' or 'HH:mm' if timestamps are close
      displayTimestamp: format(new Date(d.timestamp), 'MMM dd, HH:mm'),
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-primary">Weather Forecast</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-text-secondary">
          No sufficient weather data available.
        </CardContent>
      </Card>
    );
  }

  // Determine min/max for Y-axes for better scaling
  const minTemp = Math.min(...chartData.map(d => d.outdoorTemperature || 0)) - 2;
  const maxTemp = Math.max(...chartData.map(d => d.outdoorTemperature || 0)) + 2;
  const minCloud = Math.min(...chartData.map(d => d.cloudiness || 0)) - 10; // Cloudiness 0-100
  const maxCloud = Math.max(...chartData.map(d => d.cloudiness || 0)) + 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-primary">Weather Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={ 'var(--color-border)' } /> {/* Grid lines */}

            {/* X-Axis for Timestamp */}
            <XAxis
              dataKey="displayTimestamp"
              tickFormatter={(tick) => format(new Date(tick), 'HH:mm')} // Show only time on ticks
              stroke="var(--color-text-secondary)"
              tickLine={false}
              axisLine={false}
              minTickGap={30} // Adjust to prevent overcrowding
            />

            {/* Left Y-Axis for Outdoor Temperature */}
            <YAxis
              yAxisId="temperature"
              label={{
                value: 'Temperature (°C)',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--color-text-secondary)',
                offset: -5 // Adjust label position
              }}
              stroke="var(--color-text-secondary)"
              tickLine={false}
              axisLine={false}
              unit="°C"
              domain={[minTemp, maxTemp]} // Set dynamic domain
            />

            {/* Right Y-Axis for Cloudiness */}
            <YAxis
              yAxisId="cloudiness"
              orientation="right"
              label={{
                value: 'Cloudiness (%)',
                angle: 90,
                position: 'insideRight',
                fill: 'var(--color-text-secondary)',
                offset: -5 // Adjust label position
              }}
              stroke="var(--color-text-secondary)"
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[minCloud, maxCloud]} // Set dynamic domain
            />

            {/* Tooltip for hover details */}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-background-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius)',
              }}
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value: number, name: string, props) => {
                if (name === 'Outdoor Temperature') return [`${value.toFixed(1)}°C`, name];
                if (name === 'Cloudiness') return [`${value.toFixed(0)}%`, name];
                return [value, name];
              }}
            />

            {/* Legend */}
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              payload={[
                { value: 'Outdoor Temperature', type: 'line', id: 'temp', color: 'var(--color-brand-primary)' },
                { value: 'Cloudiness', type: 'line', id: 'cloud', color: 'var(--color-accent-blue)' },
              ]}
              formatter={(value, entry) => <span style={{ color: entry.color }}>{value}</span>}
            />

            {/* Line for Outdoor Temperature */}
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="outdoorTemperature"
              stroke="var(--color-brand-primary)"
              name="Outdoor Temperature"
              activeDot={{ r: 8 }}
            />

            {/* Line for Cloudiness */}
            <Line
              yAxisId="cloudiness"
              type="monotone"
              dataKey="cloudiness"
              stroke="var(--color-accent-blue)"
              name="Cloudiness"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WeatherForecastChart;