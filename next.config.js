/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable Next.js image optimization
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
  output: "standalone",
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Tree-shake large barrel imports so only used icons/helpers ship.
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  // Code splitting optimization (production only — skip in dev for speed)
  webpack: (config, { isServer, dev }) => {
    if (dev) return config;
    if (!isServer) {
      // Split vendor chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Separate recharts into its own chunk
          recharts: {
            name: 'recharts',
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            priority: 30,
          },
          // Separate framer-motion into its own chunk
          framerMotion: {
            name: 'framer-motion',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            priority: 25,
          },
          // Separate lucide-react icons
          lucide: {
            name: 'lucide-icons',
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            priority: 20,
          },
          // Common vendor libraries
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
        maxInitialRequests: 25,
        minSize: 20000,
      };
    }
    return config;
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    // In development we also allow plain http/ws so local services (e.g. the
    // WhatsApp API on http://localhost:3001 and HMR websockets) keep working.
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
      // Adobe Typekit serves the "obviously-variable" font files.
      "font-src 'self' data: https://use.typekit.net",
      // Typekit also delivers its font CSS via @import from p.typekit.net.
      "style-src 'self' 'unsafe-inline' https://p.typekit.net https://use.typekit.net",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
      // Cache static assets
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
