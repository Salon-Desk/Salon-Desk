import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SalonDesk Deposits — AI Salon Booking & PayPal Authorization Holds',
  description: 'A hold, not a charge: The AI-powered deposit ecosystem for modern salons. Zero upfront risk for clients, 100% protection against no-shows via PayPal authorization holds.',
  openGraph: {
    title: 'SalonDesk Deposits — AI Salon Booking & PayPal Authorization Holds',
    description: 'A hold, not a charge: The AI-powered deposit ecosystem for modern salons. Zero upfront risk for clients, 100% protection against no-shows via PayPal authorization holds.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SalonDesk Deposits — AI Salon Booking & PayPal Authorization Holds',
    description: 'A hold, not a charge: The AI-powered deposit ecosystem for modern salons.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-amber-500/20 selection:text-amber-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
