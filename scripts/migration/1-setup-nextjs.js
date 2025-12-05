#!/usr/bin/env node
/**
 * Migration Script 1: Setup Next.js
 *
 * This script:
 * 1. Installs Next.js dependencies
 * 2. Creates app directory structure
 * 3. Generates initial configuration files
 * 4. Sets up TypeScript and Tailwind for Next.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 1: Setup');
console.log('═'.repeat(60));

// Step 1: Create app directory structure
console.log('\n📁 Creating app directory structure...');
const directories = [
  'app',
  'app/(public)',
  'app/(standalone)',
  'app/(auth)',
  'app/escritorio',
  'app/escritorio/admin',
  'app/escritorio/ventas',
  'app/api',
  'app/api/intelimotor',
  'app/api/health',
];

directories.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ Created ${dir}`);
  } else {
    console.log(`  - ${dir} already exists`);
  }
});

// Step 2: Create next.config.js
console.log('\n⚙️  Creating next.config.js...');
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      'pemgwyymodlwabaexxrb.supabase.co',
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

module.exports = nextConfig;
`;

fs.writeFileSync(path.join(rootDir, 'next.config.js'), nextConfig);
console.log('  ✓ next.config.js created');

// Step 3: Create .env.local template
console.log('\n🔐 Creating .env.local template...');
const envTemplate = `# Supabase Configuration (Public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side only variables
SUPABASE_SERVICE_ROLE_KEY=

# Airtable (Server-side only)
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Intelimotor API (Server-side only)
INTELIMOTOR_API_KEY=
INTELIMOTOR_API_SECRET=

# AWS/Cloudflare R2 (Server-side only)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Google Gemini API (Server-side only)
GOOGLE_GEMINI_API_KEY=

# Brevo Email API (Server-side only)
BREVO_API_KEY=

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
`;

const envLocalPath = path.join(rootDir, '.env.local');
if (!fs.existsSync(envLocalPath)) {
  fs.writeFileSync(envLocalPath, envTemplate);
  console.log('  ✓ .env.local template created');
} else {
  console.log('  - .env.local already exists, skipping');
}

// Step 4: Update tsconfig.json for Next.js
console.log('\n📝 Updating tsconfig.json for Next.js...');
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

// Create backup first
fs.copyFileSync(tsconfigPath, tsconfigPath + '.backup');

// Create new Next.js compatible tsconfig
const newTsconfig = {
  compilerOptions: {
    target: "ES2017",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [
      {
        name: "next"
      }
    ],
    paths: {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/services/*": ["./src/services/*"],
      "@/context/*": ["./src/context/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  exclude: ["node_modules"]
};

fs.writeFileSync(tsconfigPath, JSON.stringify(newTsconfig, null, 2));
console.log('  ✓ tsconfig.json updated (backup created)');

// Step 5: Create .gitignore additions
console.log('\n📋 Updating .gitignore...');
const gitignorePath = path.join(rootDir, '.gitignore');
let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';

const nextjsIgnores = `
# Next.js
/.next/
/out/
next-env.d.ts
.vercel
.env*.local
`;

if (!gitignore.includes('/.next/')) {
  gitignore += nextjsIgnores;
  fs.writeFileSync(gitignorePath, gitignore);
  console.log('  ✓ .gitignore updated with Next.js entries');
} else {
  console.log('  - .gitignore already has Next.js entries');
}

// Step 6: Update package.json scripts (will be done in a separate script)
console.log('\n✅ Phase 1 Complete: Next.js structure initialized');
console.log('\nNext steps:');
console.log('  1. Run: node scripts/migration/2-migrate-env.js');
console.log('  2. Install dependencies: npm install next@latest react@latest react-dom@latest');
console.log('  3. Continue with route migration');
console.log('\n' + '═'.repeat(60));
