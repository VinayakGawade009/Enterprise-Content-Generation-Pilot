import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ECGP — Enterprise Content Generation Pilot',
  description:
    'AI-powered enterprise content generation with multi-stage governance and Human-in-the-Loop review.',
};

import { ConvexClientProvider } from '../components/ConvexClientProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
