// FILE: apps/web/components/layout/Header.tsx
// PURPOSE: A new, clean header that sits above the main content.
'use client';

import Link from 'next/link';
import { Search, Menu, Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '../dashboard/ThemeToggle';
import { useCopilotStore } from '@/lib/store/copilotStore';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export function Header() {
  const { toggleCopilot } = useCopilotStore();
  const pathname = usePathname();
  const pageTitle = pathname.split('/').pop() || 'Overview';
  const capitalizedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          {/* Mobile navigation can be added here */}
        </SheetContent>
      </Sheet>
      
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">NODA</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{capitalizedTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="relative ml-auto flex items-center gap-4 md:grow-0">
        <ThemeToggle />
        <Button variant="outline" size="icon" onClick={toggleCopilot}>
            <MessageSquare className="w-5 h-5" />
            <span className="sr-only">Toggle AI Copilot</span>
        </Button>
       
      </div>
    </header>
  );
}