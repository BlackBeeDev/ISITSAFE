/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium", "playwright-core"],
    outputFileTracingIncludes: {
      "/api/scan": ["./node_modules/@sparticuz/chromium/bin/**"]
    }
  }
};

export default nextConfig;
