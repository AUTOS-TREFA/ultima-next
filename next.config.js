/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      'jjepfehmuybpctdzipnu.supabase.co',
      'randomuser.me',
      'cufm.mx',
      'trefa.mx',
      'www.trefa.mx',
      'autos.trefa.mx',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    // Enable if needed
  },

  // Environment variables available to the client
  env: {
    // Add any custom env vars here
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add any custom webpack config here
    return config;
  },

  // Output configuration for Docker/Cloud Run
  output: 'standalone',
};

export default nextConfig;
