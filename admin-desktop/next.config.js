/** @type {import('next').NextConfig} */

const nextConfig = {

  reactStrictMode: true,

  output: "export",

  trailingSlash: true,

  images: { unoptimized: true },

  experimental: {

    optimizePackageImports: ["antd"],

  },

  compiler: {

    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,

  },

};



module.exports = nextConfig;

