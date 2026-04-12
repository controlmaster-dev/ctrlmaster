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
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Code splitting optimization
  webpack: (config, { isServer }) => {
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
    return [
      {
        source: '/(.*)',
        headers: [
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
