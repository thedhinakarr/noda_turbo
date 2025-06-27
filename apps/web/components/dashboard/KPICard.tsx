// apps/web/components/dashboard/KPICard.tsx
"use client"; // This is a client component

import React from 'react';
import { Thermometer, CheckCircle, AlertTriangle } from 'lucide-react'; // Example icons needed for KPIs

// Define the props for the KPICard component
interface KPICardProps {
  title: string;          // e.g., "Total Systems"
  value: string | number; // e.g., 10, "50%"
  icon: React.ElementType; // The Lucide icon component for the card
  iconColorClass?: string; // Optional Tailwind class for icon color (e.g., 'text-[#8A0A0A]')
  valueColorClass?: string; // Optional Tailwind class for value color (e.g., 'text-[#F2F2F2]')
  bgColorClass?: string;    // Optional Tailwind class for background (default bg-gray-900)
  pLeft?: string;           // Optional Tailwind class for padding left (e.g., 'p-3')
  rounded?: string;         // Optional Tailwind class for roundedness (e.g., 'rounded-full')
  children?: React.ReactNode; // Optional: for additional content like status text
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon, // Destructure and rename icon to Icon (capitalized for component usage)
  iconColorClass = 'text-[#8A0A0A]', // Default icon color for consistency
  valueColorClass = 'text-[#F2F2F2]', // Default value color
  bgColorClass = 'bg-gray-900', // Default card background
  pLeft = 'p-3',
  rounded = 'rounded-full',
  children,
}) => {
  return (
    <div className={`${bgColorClass} rounded-lg shadow p-5 flex items-center space-x-4`}>
      <div className={`${pLeft} bg-[#6B0000]/20 ${rounded} ${iconColorClass}`}> {/* Icon background tint, icon color */}
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#D9D9D9]">{title}</p>
        <p className={`text-2xl font-semibold ${valueColorClass}`}>{value}</p>
        {children} {/* Render any additional content like status text here */}
      </div>
    </div>
  );
};

export default KPICard;