// FILE: apps/web/components/layout/NavigationSidebar.tsx
// PURPOSE: A rewrite to integrate correctly with the flexbox layout.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bot,
  Settings,
  LayoutGrid,
  LineChart,
  Building,
  BarChartHorizontal,
} from 'lucide-react';

export function NavigationSidebar() {
  const pathname = usePathname();

  const routes = [
    { href: '/', label: 'Overview', icon: LayoutGrid, active: pathname === '/' },
    { href: '/retrospect', label: 'Retrospect', icon: LineChart, active: pathname === '/retrospect' },
    { href: '/building', label: 'Building', icon: Building, active: pathname === '/building' },
    { href: '/demand', label: 'Demand', icon: BarChartHorizontal, active: pathname === '/demand' },
  ];

  return (
    // THE ONLY CHANGE IS IN THIS LINE:
    // The "fixed", "inset-y-0", "left-0", and "z-10" classes have been REMOVED.
    <aside className="hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Bot className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">NODA Copilot</span>
          </Link>
          {routes.map((route) => (
            <Tooltip key={route.href}>
              <TooltipTrigger asChild>
                <Link
                  href={route.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    route.active && "bg-accent text-accent-foreground"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  <span className="sr-only">{route.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{route.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}