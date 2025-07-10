// components/dashboard/KPICard.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useUiActionsStore } from '@/lib/store/uiActions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button'; // Assuming this path is correct
import CircularProgress from '@/components/ui/CircularProgrss'; // New component

// Define the props for the KPICard component
interface KPICardProps {
  id: string; // A unique ID for highlighting, e.g., "kpi-data-quality"
  title: string;
  metricValue: number; // For the circular progress (e.g., 50 for 50%)
  displayValue: string | number; // The large number/percentage displayed (e.g., "50%", "45")
  icon: React.ElementType;
  variant?: 'primary' | 'optimal' | 'alert'; // For icon color and potentially progress bar color
  listItems?: { name: string; value: string | number }[]; // For the list of buildings/issues
  buttonText?: string;
  onButtonClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  id,
  title,
  metricValue,
  displayValue,
  icon: Icon,
  variant = 'primary', // Default to 'primary' variant
  listItems,
  buttonText,
  onButtonClick,
}) => {
  // Subscribe to the UI actions store to know when to highlight
  const { highlightedElementId } = useUiActionsStore();
  const isHighlighted = highlightedElementId === id;

  // Determine colors based on variant
  const iconColorClass = {
    primary: 'text-brand-primary',
    optimal: 'text-accent-green', // Green for optimal (e.g., high data quality, high opt. potential)
    alert: 'text-accent-red',     // Red for alert (e.g., many technical issues, low data quality)
  }[variant];

  const progressPrimaryColorClass = {
    primary: 'text-brand-accent',
    optimal: 'text-accent-green',
    alert: 'text-accent-red',
  }[variant];

  // Map display values to more user-friendly labels if needed
  const getListItemLabel = (title: string): string => {
    switch (title) {
      case 'Overall Data quality': return 'Quality issues';
      case 'Contractual issues': return 'Contract breach';
      case 'Technical issues': return 'Technical issues';
      case 'Optimization potential': return 'Opt. Potential';
      default: return '';
    }
  };

  return (
    // Use the shadcn Card component as the base.
    <Card
      id={id} // Set the ID for highlighting
      className={cn(
        'transition-all duration-300', // Smooth transition for the highlight effect
        isHighlighted ? 'bg-background-card ring-2 ring-brand-accent ring-offset-4 ring-offset-background animate-glow' : 'ring-0',
        'flex flex-col' // Ensure flex column for proper footer alignment
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", iconColorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-4 pt-0 flex-grow">
        <CircularProgress
          percentage={metricValue}
          primaryColor={progressPrimaryColorClass}
          size={100} // Increased size for better visibility
          strokeWidth={10}
        />
        <div className="text-4xl font-bold text-text-primary mt-4">{displayValue}</div>
      </CardContent>
      {listItems && listItems.length > 0 && (
        <CardContent className="pt-2 px-6">
          <p className="text-sm text-text-secondary mb-2">{getListItemLabel(title)}</p>
          <ul className="space-y-1 text-text-light">
            {listItems.slice(0, 3).map((item, index) => ( // Show top 3
              <li key={index} className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="font-medium">{item.value}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      {buttonText && onButtonClick && (
        <CardFooter className="pt-4 flex justify-center">
          <Button variant="ghost" onClick={onButtonClick} className="text-brand-primary hover:bg-brand-primary/10">
            {buttonText}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default KPICard;