import type { NextConfig } from 'next'

// API_INTERNAL_URL is the Next server rewrite target (Compose DNS, e.g. http://api:8000).
// NEXT_PUBLIC_API_URL stays the browser-facing origin and is not used inside the web container.
const apiOrigin = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

type RemotePattern = NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number]

/** Allow /_next/image to fetch uploaded files from this origin (any port). */
function storagePattern(origin: string | undefined): RemotePattern | null {
  if (!origin) {
    return null
  }
  try {
    const url = new URL(origin)
    const protocol = url.protocol === 'http:' ? 'http' : 'https'
    return {
      protocol,
      hostname: url.hostname,
      pathname: '/api/v1/storage/**',
    }
  } catch {
    return null
  }
}

const storageRemotePatterns = [
  storagePattern(process.env.NEXT_PUBLIC_SITE_URL),
  storagePattern(process.env.NEXT_PUBLIC_API_URL),
  storagePattern('https://salon-desk.onrender.com'),
  storagePattern('http://salon-desk.onrender.com'),
  storagePattern('https://paypalai.hackathon.huludelala.com'),
  storagePattern('http://paypalai.hackathon.huludelala.com'),
  { protocol: 'https', hostname: '**.onrender.com', pathname: '/api/v1/storage/**' },
  { protocol: 'http', hostname: '**.onrender.com', pathname: '/api/v1/storage/**' },
  { protocol: 'https', hostname: '**.huludelala.com', pathname: '/api/v1/storage/**' },
  { protocol: 'http', hostname: '**.huludelala.com', pathname: '/api/v1/storage/**' },
  { protocol: 'http', hostname: 'localhost', pathname: '/api/v1/storage/**' },
  { protocol: 'https', hostname: 'localhost', pathname: '/api/v1/storage/**' },
  { protocol: 'http', hostname: '127.0.0.1', pathname: '/api/v1/storage/**' },
  { protocol: 'https', hostname: '127.0.0.1', pathname: '/api/v1/storage/**' },
].filter((pattern): pattern is RemotePattern => pattern !== null)

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: '/health',
        destination: `${apiOrigin}/health`,
      },
    ]
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    // Uploaded logos live on this same app (local disk or RustFS via /api/v1/storage).
    // Next 16 rejects those fetches unless the host is listed and local IPs are allowed.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      ...storageRemotePatterns,
    ],
  },
}

export default nextConfig
