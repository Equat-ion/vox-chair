import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Set the source directory
  distDir: '.next',
  
  // Disable eslint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Disable type checking during build
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // Set the app directory to be in src
  experimental: {
    appDir: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Configure allowed image domains
  images: {
    domains: ['flagcdn.com'],
  },
};

export default nextConfig;
