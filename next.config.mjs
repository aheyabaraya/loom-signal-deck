/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    useLightningcss: true
  }
};

export default nextConfig;
