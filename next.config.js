/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["94.72.126.17"],
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "res.cloudinary.com",
    ],
  },
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
