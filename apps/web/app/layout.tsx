// apps/web/app/layout.tsx
import './globals.css';
import { ApolloClientProvider } from './ApolloProviderWrapper';

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
    <html lang="en">
      <body>
        <ApolloClientProvider>
          {children}
        </ApolloClientProvider>
      </body>
    </html>
  );
}