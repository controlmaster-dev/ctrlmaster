
const nextConfig = {
  // Vercel no necesita standalone (aumenta mucho el uso de RAM en el build).
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Typecheck completo en CI (`npm run typecheck`). Build omite tsc si RAM es limitada.
    ignoreBuildErrors:
      process.env.VERCEL === "1" || process.env.SKIP_TYPECHECK === "1",
  },
  images: {

    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  serverExternalPackages: ['mongoose'],
  experimental: {

    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';


    const connectSrc = isProd
      ? "connect-src 'self' https:"
      : "connect-src 'self' https: http: ws: wss:";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",

      "font-src 'self' data: https://use.typekit.net",

      "style-src 'self' 'unsafe-inline' https://p.typekit.net https://use.typekit.net",
      isProd
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "worker-src 'self' blob:",
      connectSrc,
      "frame-src 'self' https:",
      "media-src 'self' https: blob:",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },

      {
        source: '/(uploads|icons|fonts)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
