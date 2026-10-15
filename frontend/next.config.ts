import type { NextConfig } from 'next'

const apiOrigin = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

const nextConfig: NextConfig = {
  output: 'standalone',
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
    // Stylist avatars and service photography are served from these hosts.
    // `search` is intentionally omitted so the sizing/format query strings pass through.
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
}

export default nextConfig
