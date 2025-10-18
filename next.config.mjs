/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Basic performance optimizations only
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
