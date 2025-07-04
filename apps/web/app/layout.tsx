import './globals.css';
import { ApolloClientProvider } from './ApolloProviderWrapper';
import AuthProvider from './AuthProvider';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata = {
  title: 'NODA CoPilot Dashboard',
  description: 'Monitoring and Optimization for Thermal Systems',
};

// This is the TRUE Root Layout. It is a simple shell.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background-dark font-sans text-text-primary antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          <ApolloClientProvider>
            {children}
          </ApolloClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}