// FILE: apps/web/components/dashboard/DashboardPageHeader.tsx
// PURPOSE: A new, reusable component to display the title and description for each page.
'use client';

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function DashboardPageHeader({ title, description, children }: DashboardPageHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2 mb-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center space-x-2">
        {children}
      </div>
    </div>
  );
}