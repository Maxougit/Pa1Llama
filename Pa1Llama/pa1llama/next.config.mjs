/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: process.env.API_URL,
    RAG_URL: process.env.RAG_URL,
  },
};

export default nextConfig;
