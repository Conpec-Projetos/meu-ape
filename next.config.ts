import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/meu-ape-120a9.firebasestorage.app/o/**",
      },
    ]
  },
};

export default nextConfig;
