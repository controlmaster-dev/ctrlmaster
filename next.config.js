/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["94.72.126.17"],
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
    ],
  },
  output: "standalone",
};

module.exports = nextConfig;
