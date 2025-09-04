/**
 * @type {import('next').NextConfig}
 *
 * The Next.js configuration for Prompt2Visuals. We enable the experimental
 * app directory and allow loading images from any remote host. This is
 * necessary because the application fetches thumbnails from Freepik and
 * AI‑generated image URLs returned by the OpenAI API. Without configuring
 * `remotePatterns` Next.js blocks external images by default.
 */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
