/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  //trailingSlash: true,
  distDir:"out",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
