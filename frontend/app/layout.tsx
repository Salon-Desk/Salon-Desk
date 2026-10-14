import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import ClientWrapper from './ClientWrapper'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const title = 'SalonDesk Deposits — AI Salon Booking & PayPal Authorization Holds'
const description =
  'A hold, not a charge: the AI-powered deposit ecosystem for modern salons. Zero upfront risk for clients, 100% protection against no-shows via PayPal authorization holds.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900 selection:bg-amber-500/20 selection:text-amber-900">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}
