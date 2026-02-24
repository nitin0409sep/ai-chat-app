/** @type {import('next').NextConfig} */

const nextConfig = {
  // 🔹 Enable React strict mode (recommended)
  reactStrictMode: true,

  // 🔹 Output mode
  // "standalone" → for Docker / Node server
  // "export" → for static hosting
  output: "standalone",

  // 🔹 Remove x-powered-by header (security)
  poweredByHeader: false,

  // 🔹 Enable gzip compression
  compress: true,

  // 🔹 Add base path if hosting under subfolder
  // example.com/app
  // basePath: "/app",

  // 🔹 Add trailing slash to all routes
  // trailingSlash: true,

  // 🔹 CDN prefix (if using CDN)
  // assetPrefix: "https://cdn.example.com",

  // 🔹 Production source maps
  productionBrowserSourceMaps: false,

  // 🔹 Environment variables (build-time)
  env: {
    CUSTOM_API_URL: "https://api.example.com",
  },

  // 🔹 Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // 🔹 Transpile packages (useful in monorepo)
  // transpilePackages: ["@my/ui", "@my/utils"],

  // 🔹 ESLint config
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 🔹 TypeScript config
  typescript: {
    ignoreBuildErrors: false,
  },

  // 🔹 Custom headers (security)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },

  // 🔹 Redirects
  async redirects() {
    return [
      {
        source: "/old-page",
        destination: "/new-page",
        permanent: true,
      },
    ];
  },

  // 🔹 Rewrites (API Proxy / URL Masking)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.example.com/:path*",
      },
    ];
  },

  // 🔹 Webpack customization (advanced)
  webpack(config) {
    config.resolve.fallback = { fs: false };
    return config;
  },

  // 🔹 Experimental features
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;