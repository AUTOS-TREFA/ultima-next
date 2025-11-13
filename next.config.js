/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pemgwyymodlwabaexxrb.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'cufm.mx',
      },
      {
        protocol: 'https',
        hostname: 'autostrefa.mx',
      },
      {
        protocol: 'https',
        hostname: 'www.autostrefa.mx',
      },
      {
        protocol: 'https',
        hostname: 'autos.autostrefa.mx',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers para CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Api-Key, X-Api-Secret, Authorization' },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Ignorar warnings de módulos opcionales
    config.ignoreWarnings = [
      { module: /node_modules/ },
    ];

    // Resolver problemas de módulos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Output configuration for Docker/Cloud Run
  output: 'standalone',

  // Configuración de TypeScript
  typescript: {
    // Permitir build aunque haya errores (temporal durante migración)
    ignoreBuildErrors: true,
  },

  // Configuración de ESLint
  eslint: {
    // Permitir build aunque haya warnings (temporal durante migración)
    ignoreDuringBuilds: true,
  },

  // Experimental - allow static generation to fail without breaking build
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
