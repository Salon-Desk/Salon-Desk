import './globals.css'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'

import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'

import Providers from './Providers'

const title = 'SalonDesk Deposits — AI Salon Booking & PayPal Authorization Holds'
const description =
  'A hold, not a charge: the AI-powered deposit ecosystem for modern salons. Zero upfront risk for clients, 100% protection against no-shows via PayPal authorization holds.'

export const metadata: Metadata = {
  title,
  description,
  applicationName: 'SalonDesk',
  appleWebApp: { capable: true, title: 'SalonDesk', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: { title, description, type: 'website', images: ['/icons/icon-512.png'] },
  twitter: { card: 'summary_large_image', title, description },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfa' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900 selection:bg-amber-500/20 selection:text-amber-900">
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
