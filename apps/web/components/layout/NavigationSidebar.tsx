// apps/web/components/layout/NavigationSidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, Building, BarChart, Settings, LogOut } from 'lucide-react'; // Import LogOut icon
import { signOut } from 'next-auth/react'; // Import signOut
import { cn } from '@/lib/utils';
import Image from 'next/image';

// --- Navigation Items Configuration ---
// Updated to support nested 'children' for Settings
const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Retrospect', href: '/retrospect', icon: History },
  { name: 'Building', href: '/building', icon: Building },
  { name: 'Demand', href: '/demand', icon: BarChart },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    // Added children array for sub-options
    children: [
      // Logout is now a sub-item
      { name: 'Logout', href: '#', icon: LogOut, action: 'logout' }, // Use '#' or a specific route if needed
    ],
  },
];

export default function NavigationSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <aside className="w-48 h-full flex flex-col justify-between p-4 border-r border-border">
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-bold text-text-primary">Mölndal Energi</h1>
          <p className="text-sm text-text-secondary">Noda Copilot 1.2.1</p>
        </div>

        <nav>
          <ul>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <React.Fragment key={item.name}>
                  <li>
                    <Link
                      href={item.href}
                      // Use an onClick handler if it's a special action like logout
                      onClick={item.action === 'logout' ? handleLogout : undefined}
                      className={cn(
                        'flex items-center p-3 my-1 rounded-md transition-colors duration-200',
                        isActive
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background-card'
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                  {/* Render children if the current item is 'Settings' and is active (or always for simplicity) */}
                  {item.children && (isActive || pathname.startsWith(item.href + '/')) && ( // Check if parent is active or a sub-route is active
                    <ul className="ml-6 border-l border-border border-border-tertiary pl-2"> {/* Indent sub-items */}
                      {item.children.map((childItem) => (
                        <li key={childItem.name}>
                          <Link
                            href={childItem.href}
                            onClick={childItem.action === 'logout' ? handleLogout : undefined}
                            className={cn(
                              'flex items-center p-3 my-1 rounded-md transition-colors duration-200 text-sm',
                              pathname === childItem.href // Check if sub-item is active
                                ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-card'
                            )}
                          >
                            <childItem.icon className="w-4 h-4 mr-3" /> {/* Smaller icon for sub-items */}
                            <span>{childItem.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="mt-auto pt-4 text-center">
        <Image
          src="/images/noda_logo.png"
          alt="NODA Energy Partner Logo"
          width={100}
          height={30}
          priority
        />
      </div>
    </aside>
  );
}