// apps/web/components/views/overview/OverviewView.tsx
"use client";

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_OVERVIEW_DATA } from '@/lib/graphql/queries';
import KPICard from '@/components/dashboard/KPICard';
import { AlertTriangle, Building, FlaskConical, CircleDollarSign, Factory, ShieldCheck } from 'lucide-react';
import { OverviewData, System, WeatherData } from '@/lib/graphql/types';
import dynamic from 'next/dynamic';

import WeatherForecastChart from '@/components/dashboard/WeatherForecastChart';
import AssetListTable from '@/components/dashboard/AssetListTable'; // AssetListTable import

// Dynamic import for the SystemsMap component, turning off SSR
const SystemsMap = dynamic(() => import('@/components/dashboard/SystemsMap'), {
    ssr: false, // Essential for Leaflet, as it relies on browser-specific APIs
    loading: () => <div className="h-[500px] w-full bg-background-card rounded-lg animate-pulse flex items-center justify-center text-text-secondary">Loading Map...</div>,
});


// A simple, manually styled skeleton component for loading states
const KPICardGridSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="h-[280px] w-full rounded-lg bg-background-card animate-pulse"></div>
        <div className="h-[280px] w-full rounded-lg bg-background-card animate-pulse"></div>
        <div className="h-[280px] w-full rounded-lg bg-background-card animate-pulse"></div>
        <div className="h-[280px] w-full rounded-lg bg-background-card animate-pulse"></div>
    </div>
);

// Helper function to format timestamp strings from the backend
const formatTimestamp = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        // Format to "YYYY-MM-DD - HH:MM"
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // 24-hour format
        }).replace(',', ' -');
    } catch (e) {
        console.error("Error formatting timestamp:", timestamp, e);
        return timestamp; // Return original string if parsing fails
    }
};

export default function OverviewView() {
    console.log("OverviewView component is rendering.");
    // Fetch data using the Apollo useQuery hook
    const { loading, error, data } = useQuery<OverviewData>(GET_OVERVIEW_DATA);

    // Log data for debugging purposes in development mode
    if (!loading && !error) {
        console.log("GraphQL Data Received:", data);
    }

    // Handle loading state: Display skeleton loaders
    if (loading) {
        return (
            <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
                <div className="h-[500px] w-full bg-background-card rounded-lg animate-pulse flex items-center justify-center text-text-secondary">Loading Map...</div>
                <KPICardGridSkeleton />
            </div>
        );
    }

    // Handle error state: Display an error message
    if (error) {
        return (
            <div className="flex items-center justify-center h-64 bg-background-card rounded-lg p-6">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-accent-red" />
                    <h3 className="mt-2 text-lg font-semibold text-text-primary">Error loading data</h3>
                    <p className="mt-1 text-sm text-text-secondary">Could not fetch overview data. Please try again later.</p>
                    <p className="mt-1 text-xs text-text-secondary break-all">Error: {error.message}</p>
                </div>
            </div>
        );
    }

    // Destructure data; use empty arrays as fallbacks
    const buildings = data?.overview?.buildings || [];
    const weatherData = data?.overview?.weather || [];

    // --- Data Processing for KPI Cards ---
    // These calculations derive aggregate metrics from the 'buildings' data

    // 1. Overall Data Quality KPI
    const totalOverallRanks = buildings.reduce((sum: number, b: System) => sum + (b.ranking?.overall || 0), 0);
    const avgDataQuality = buildings.length > 0 ? (totalOverallRanks / buildings.length) : 0;
    // List items: Top 3 buildings with lowest overall rank (poorer quality)
    const dataQualityList = [...buildings]
        .sort((a: System, b: System) => (a.ranking?.overall || 0) - (b.ranking?.overall || 0))
        .slice(0, 3)
        .map((b: System) => ({
            name: b.name || 'Unknown Building',
            value: `${(b.ranking?.overall || 0).toFixed(0)}%`,
        }));
    const dataQualityVariant = avgDataQuality < 70 ? 'alert' : 'optimal'; // Threshold for alert status

    // 2. Contractual Issues KPI (Placeholder as per discussion)
    const contractualIssuesCount = 5; // Hardcoded placeholder value
    // List items for contractual issues are omitted due to lack of direct data in System type

    // 3. Technical Issues KPI
    // Helper to calculate total faults for a single system
    const calculateTotalFaults = (system: System): number => {
        if (!system.faults) return 0;
        return (
            (system.faults.primaryLoss || 0) +
            (system.faults.smirch || 0) +
            (system.faults.heatSystem || 0) +
            (system.faults.valve || 0) +
            (system.faults.transfer || 0)
        );
    };
    // Aggregate total faults across all buildings
    const totalTechnicalIssues = buildings.reduce((sum: number, b: System) => sum + calculateTotalFaults(b), 0);
    // List items: Top 3 buildings with highest total fault count
    const technicalIssuesList = [...buildings]
        .sort((a: System, b: System) => calculateTotalFaults(b) - calculateTotalFaults(a))
        .filter((b: System) => calculateTotalFaults(b) > 0) // Only include buildings with actual faults
        .slice(0, 3)
        .map((b: System) => ({
            name: b.name || 'Unknown Building',
            value: calculateTotalFaults(b),
        }));
    const technicalIssuesVariant = totalTechnicalIssues > 0 ? 'alert' : 'optimal'; // Threshold for alert status

    // 4. Optimization Potential KPI
    // Calculate average optimization potential (100 - efficiency)
    const totalOptimizationPotential = buildings.reduce((sum: number, b: System) => sum + (100 - (b.kpis?.efficiency || 100)), 0);
    const avgOptimizationPotential = buildings.length > 0 ? (totalOptimizationPotential / buildings.length) : 0;
    // List items: Top 3 buildings with highest optimization potential (lowest efficiency)
    const optimizationPotentialList = [...buildings]
        .sort((a: System, b: System) => (100 - (b.kpis?.efficiency || 100)) - (100 - (a.kpis?.efficiency || 100)))
        .slice(0, 3)
        .map((b: System) => ({
            name: b.name || 'Unknown Building',
            value: `${(100 - (b.kpis?.efficiency || 100)).toFixed(0)}%`,
        }));
    const optimizationPotentialVariant = avgOptimizationPotential > 30 ? 'optimal' : 'primary'; // Threshold for optimal status

    // Determine the latest weather data point for display in the header
    const latestWeatherData = weatherData.length > 0
        ? weatherData.reduce((latest: WeatherData, current: WeatherData) =>
            new Date(current.timestamp || 0) > new Date(latest.timestamp || 0) ? current : latest // Handle potential null timestamp
        )
        : null;

    return (
        <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
            {/* Header section with page title and latest recorded value */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Overview</h2>
                {latestWeatherData && latestWeatherData.timestamp ? ( // Only display if timestamp is available
                    <p className="text-sm text-text-secondary mt-2 md:mt-0">
                        Latest recorded value: <span className="font-medium text-text-light">{formatTimestamp(latestWeatherData.timestamp)}</span>
                    </p>
                ) : (
                    <p className="text-sm text-text-secondary mt-2 md:mt-0">Latest recorded value: N/A</p>
                )}
            </div>

            {/* Map Section: Displays system locations on an interactive map */}
            <section className="mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">System Locations Overview</h3>
                {/* Render map only if there are buildings with valid coordinates */}
                {buildings.length > 0 && buildings.some(b => b.location?.latitude !== null && b.location?.longitude !== null) ? (
                    <SystemsMap systems={buildings} />
                ) : (
                    <div className="h-[500px] w-full bg-background-card rounded-lg flex items-center justify-center text-text-secondary">
                        No system locations available or invalid coordinates.
                    </div>
                )}
            </section>

            {/* KPI Card Grid: Displays overall aggregated performance metrics */}
            <section className="mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Overall System Performance Metrics</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <KPICard
                        id="kpi-data-quality"
                        title="Overall Data quality"
                        metricValue={parseFloat(avgDataQuality.toFixed(0))}
                        displayValue={`${avgDataQuality.toFixed(0)}%`}
                        icon={ShieldCheck}
                        variant={dataQualityVariant}
                        listItems={dataQualityList}
                        buttonText="Full report"
                        onButtonClick={() => alert('View Data Quality Report')}
                    />
                    <KPICard
                        id="kpi-contractual-issues"
                        title="Contractual Issues"
                        metricValue={contractualIssuesCount * 10} // Scale placeholder for progress bar
                        displayValue={contractualIssuesCount}
                        icon={Factory}
                        variant={contractualIssuesCount > 0 ? 'alert' : 'optimal'}
                        buttonText="Full list of breaches"
                        onButtonClick={() => alert('View Contractual Issues Report')}
                    />
                    <KPICard
                        id="kpi-technical-issues"
                        title="Technical Issues"
                        metricValue={Math.min(100, totalTechnicalIssues > 0 ? (totalTechnicalIssues / buildings.length) * 10 : 0)} // Scale total issues for progress bar
                        displayValue={totalTechnicalIssues}
                        icon={AlertTriangle}
                        variant={technicalIssuesVariant}
                        listItems={technicalIssuesList}
                        buttonText="Full report"
                        onButtonClick={() => alert('View Technical Issues Report')}
                    />
                    <KPICard
                        id="kpi-optimization-potential"
                        title="Optimization potential"
                        metricValue={parseFloat(avgOptimizationPotential.toFixed(0))}
                        displayValue={`${avgOptimizationPotential.toFixed(0)}%`}
                        icon={FlaskConical}
                        variant={optimizationPotentialVariant}
                        listItems={optimizationPotentialList}
                        buttonText="Full report"
                        onButtonClick={() => alert('View Optimization Potential Report')}
                    />
                </div>
            </section>

            {/* Information Panels: Key Metrics, Asset List, and Weather Forecast Chart */}
            <section className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {/* Column 1: Key Overview Metrics (Left panel) */}
                    <div className="lg:col-span-2 xl:col-span-2 bg-background-card rounded-lg p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Key Overview Metrics</h3>
                            <ul className="text-text-light space-y-2">
                                <li className="flex items-start">
                                    <span className="mr-2 text-brand-primary">•</span>
                                    <p>
                                        <span className="font-bold text-brand-primary">Overall Data quality</span>, metric + graph
                                    </p>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2 text-brand-primary">•</span>
                                    <p>
                                        Are there <span className="font-bold text-brand-primary">contractual issues</span> in the network? Graph shows percentage and number of issues
                                    </p>
                                </li>
                                <li className="ml-4">
                                    Expand buildings with the most significant issues, show which contractual data points are significantly over- or undershot.
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2 text-brand-primary">•</span>
                                    <p>
                                        Are there <span className="font-bold text-brand-primary">technical issues</span>?, metric + graph
                                    </p>
                                </li>
                                <li className="ml-4">
                                    Expand buildings with the most significant issues.
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2 text-brand-primary">•</span>
                                    <p>
                                        Is there any <span className="font-bold text-brand-primary">Optimization potential</span>?
                                    </p>
                                </li>
                                <li className="ml-4">
                                    Available flexibility (virtual storage capacity)
                                </li>
                                <li className="ml-4">
                                    Potential to reduce the supply temperature in the network (dynamic supply temperature)
                                </li>
                                <li className="ml-4">
                                    Potential to reduce the return temperature
                                </li>
                                <li className="ml-4">
                                    Potential to reduce the flow rate
                                </li>
                                <li className="ml-4">
                                    Are there technical problems in the heat-system (e.g. heat exchanger)?
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Column 2: Asset List Table */}
                    <div className="lg:col-span-1 xl:col-span-1">
                        <AssetListTable systems={buildings} /> {/* Pass the buildings data to the AssetListTable */}
                    </div>

                    {/* Column 3: Descriptive Text + Weather Forecast Chart */}
                    <div className="lg:col-span-1 xl:col-span-1 bg-background-card rounded-lg p-6 flex flex-col justify-between">
                    
                        {/* Weather data display (now a chart) */}
                        {weatherData.length > 0 && weatherData.some(d => d.timestamp !== null && d.outdoorTemperature !== null && d.cloudiness !== null) ? (
                            <WeatherForecastChart weatherData={weatherData} />
                        ) : (
                            <div className="mt-4 p-4 bg-background-dark rounded-lg text-sm text-text-secondary h-[300px] flex items-center justify-center">
                                No weather forecast data available.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}