"use client"; // This is a client component

import React from 'react';
import { cn } from '@/lib/utils'; // Import the utility for combining class names

// Define the props for the KPICard component
interface KPICardProps {
  title: string;          // e.g., "Total Systems"
  value: string | number; // e.g., 10, "50%"
  icon: React.ElementType;  // The Lucide icon component for the card
  variant?: 'primary' | 'optimal' | 'alert'; // Variants to control icon color
  children?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  variant = 'primary', // Default variant
  children,
}) => {
  // Determine the icon color based on the variant prop
  const iconColor = {
    primary: 'text-brand-primary',
    optimal: 'text-status-optimal',
    alert: 'text-status-alert',
  }[variant];

  return (
    // Use theme colors for the card background
    <div className="bg-background-light rounded-lg shadow-lg p-5 flex items-center space-x-4 animate-fade-in">
      {/* Use theme colors and apply icon color variant */}
      <div className={cn("p-3 bg-brand-primary/10 rounded-full", iconColor)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        {/* Use theme colors for text */}
        <p className="text-sm font-medium text-text-medium">{title}</p>
        <p className="text-2xl font-semibold text-text-light">{value}</p>
        {children}
      </div>
    </div>
  );
};

export default KPICard;
