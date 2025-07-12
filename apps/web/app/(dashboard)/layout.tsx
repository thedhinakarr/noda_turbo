// FILE: apps/web/app/(dashboard)/layout.tsx
// PURPOSE: The final, correct layout that assembles the shell.
import { NavigationSidebar } from '@/components/layout/NavigationSidebar';
import { Header } from '@/components/layout/Header';
import { CopilotSheet } from '@/components/copilot/CopilotSheet';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <NavigationSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
      <CopilotSheet />
    </div>
  );
}