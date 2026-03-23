import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
      },
      {
        protocol: "https",
        hostname: "static.coingecko.com",
      },
      {
        protocol: "http",
        hostname: "coin-images.coingecko.com",
      },
      {
        protocol: "http",
        hostname: "static.coingecko.com",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-native-async-storage/async-storage": path.resolve(
        "./src/shims/asyncStorage.ts"
      ),
    };
    return config;
  },
};

export default nextConfig;
