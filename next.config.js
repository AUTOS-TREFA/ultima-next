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
      {
        protocol: 'https',
        hostname: 'r2.trefa.mx',
      },
      {
        protocol: 'https',
        hostname: 'images.trefa.mx',
      },
      {
        protocol: 'https',
        hostname: 'web.miniextensions.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Headers para CORS and caching
  async headers() {
    return [
      // CORS for API routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Api-Key, X-Api-Secret, Authorization, If-None-Match' },
        ],
      },
      // Cache API - vehicles list (15 min + stale-while-revalidate)
      {
        source: '/api/vehicles',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600' },
          { key: 'Vary', value: 'Accept-Encoding' },
        ],
      },
      // Cache API - vehicle detail (1 hour + stale-while-revalidate)
      {
        source: '/api/vehicles/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' },
          { key: 'Vary', value: 'Accept-Encoding' },
        ],
      },
      // Cache API - filter options (24 hours - rarely changes)
      {
        source: '/api/vehicles/filters',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800' },
          { key: 'Vary', value: 'Accept-Encoding' },
        ],
      },
      // Cache API - slugs (12 hours)
      {
        source: '/api/vehicles/slugs',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=43200, s-maxage=43200, stale-while-revalidate=172800' },
          { key: 'Vary', value: 'Accept-Encoding' },
        ],
      },
      // Cache static assets
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache fonts
      {
        source: '/:all*(woff|woff2|ttf|otf|eot)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache Next.js static files
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache JavaScript chunks
      {
        source: '/:path*.js',
        has: [{ type: 'query', key: 'v' }],
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
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

  // Optimize bundle by excluding unused packages
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Compress pages
  compress: true,

  // Optimize power consumption
  poweredByHeader: false,
};

export default nextConfig;
