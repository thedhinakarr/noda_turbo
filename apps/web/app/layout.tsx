import './globals.css';
import { ApolloClientProvider } from './ApolloProviderWrapper';
import AuthProvider from './AuthProvider'; // Import the new AuthProvider
import { Inter, Lato } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontHeading = Lato({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-lato',
});

export const metadata = {
  title: 'NODA CoPilot Dashboard',
  description: 'Monitoring and Optimization for Thermal Systems',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background-dark font-sans text-text antialiased",
          fontSans.variable,
          fontHeading.variable
        )}
      >
        {/* Wrap the application with our new AuthProvider */}
        <AuthProvider>
          <ApolloClientProvider>
            {children}
          </ApolloClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
