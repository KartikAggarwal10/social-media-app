import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
       {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
       {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },{
        protocol: "https",
        hostname: "cdn2.fptshop.com.vn",
      }
    ],
  },
};
export default nextConfig;