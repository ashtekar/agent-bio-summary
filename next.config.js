/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'axios'],
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
