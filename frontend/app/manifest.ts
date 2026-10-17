import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/client',
    name: 'SalonDesk Deposits',
    short_name: 'SalonDesk',
    description:
      'Book salon services with a PayPal authorization hold. $0 charged today, settled at the salon.',
    start_url: '/client',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fbfbfa',
    theme_color: '#0c0a09',
    categories: ['lifestyle', 'beauty', 'business'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'My bookings',
        short_name: 'Bookings',
        url: '/client/bookings',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
