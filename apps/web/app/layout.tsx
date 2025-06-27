import './globals.css';
import { ApolloClientProvider } from './ApolloProviderWrapper';
import { Inter, Lato } from 'next/font/google';
import { cn } from '@/lib/utils'; // A utility for combining class names

// --- NEW: Load the fonts for our design system ---
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS variable for the sans-serif font
});

const fontHeading = Lato({
  subsets: ['latin'],
  weight: ['700', '900'], // Load bold and black weights for headings
  variable: '--font-lato',  // CSS variable for the heading font
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
        <ApolloClientProvider>
          {children}
        </ApolloClientProvider>
      </body>
    </html>
  );
}
