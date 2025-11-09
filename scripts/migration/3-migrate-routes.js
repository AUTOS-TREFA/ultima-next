#!/usr/bin/env node
/**
 * Migration Script 3: Migrate Routes
 *
 * This script:
 * 1. Reads route-map.json
 * 2. Creates app directory structure for each route
 * 3. Generates page.tsx files with proper imports
 * 4. Creates layout.tsx files for route groups
 * 5. Maintains all existing page components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 3: Route Migration');
console.log('═'.repeat(60));

// Load route mappings
const routeMapPath = path.join(__dirname, 'route-map.json');
const routeMap = JSON.parse(fs.readFileSync(routeMapPath, 'utf8'));

console.log(`\n📋 Found ${routeMap.routes.length} routes to migrate`);

// Helper: Create directory if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper: Generate page.tsx content
function generatePageContent(route) {
  const componentPath = route.component;
  const isClientComponent = shouldBeClientComponent(route.component);

  // Convert component name to file name (e.g., HomePage -> HomePage)
  const importPath = `@/pages/${componentPath}`;

  let content = '';

  // Add 'use client' if needed
  if (isClientComponent) {
    content += `'use client';\n\n`;
  }

  // Add import and metadata
  content += `import ${componentPath} from '${importPath}';\n`;

  // Add dynamic params if needed
  if (route.dynamic) {
    const paramName = route.nextPath.match(/\[([^\]]+)\]/)?.[1] || 'params';
    content += `\ninterface PageProps {\n`;
    content += `  params: { ${paramName}: string };\n`;
    content += `  searchParams?: { [key: string]: string | string[] | undefined };\n`;
    content += `}\n\n`;
    content += `export default function Page({ params, searchParams }: PageProps) {\n`;
    content += `  return <${componentPath} />;\n`;
    content += `}\n`;
  } else {
    content += `\nexport default function Page() {\n`;
    content += `  return <${componentPath} />;\n`;
    content += `}\n`;
  }

  return content;
}

// Helper: Determine if component should be client-side
function shouldBeClientComponent(componentName) {
  const clientComponents = [
    'ExplorarPage',
    'Application',
    'CarStudioPage',
    'AuthPage',
    'AdminLoginPage',
    'ProfilePage',
    'ConstructorPage',
    'MarketingHubPage',
  ];

  return clientComponents.includes(componentName);
}

// Step 1: Create route directories and page files
console.log('\n📁 Creating route structure...');

let createdPages = 0;
let skippedPages = 0;

routeMap.routes.forEach(route => {
  const nextPath = path.join(rootDir, route.nextPath);
  const dir = path.dirname(nextPath);

  // Create directory
  ensureDir(dir);

  // Create page.tsx if it doesn't exist
  if (!fs.existsSync(nextPath)) {
    const content = generatePageContent(route);
    fs.writeFileSync(nextPath, content);
    createdPages++;
    console.log(`  ✓ Created ${route.nextPath}`);
  } else {
    skippedPages++;
    console.log(`  - Skipped ${route.nextPath} (already exists)`);
  }
});

console.log(`\n  Created ${createdPages} pages, skipped ${skippedPages} existing pages`);

// Step 2: Create layout files
console.log('\n📐 Creating layout files...');

// Root layout
const rootLayoutPath = path.join(rootDir, 'app/layout.tsx');
const rootLayoutContent = `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { FilterProvider } from '@/context/FilterContext';
import { ConfigProvider } from '@/context/ConfigContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AuthHandler from '@/components/AuthHandler';
import RedirectManager from '@/components/RedirectManager';
import LeadSourceHandler from '@/components/LeadSourceHandler';
import { conversionTracking } from '@/services/ConversionTrackingService';
import '../index.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TREFA - Financiamiento Automotriz',
  description: 'Compra el auto de tus sueños con el mejor financiamiento en México',
};

// Initialize conversion tracking
if (typeof window !== 'undefined') {
  conversionTracking.initialize();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      networkMode: 'online',
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <FilterProvider>
                <ConfigProvider>
                  <Toaster position="top-right" richColors closeButton />
                  <AuthHandler />
                  <RedirectManager />
                  <LeadSourceHandler />
                  {children}
                </ConfigProvider>
              </FilterProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
`;

if (!fs.existsSync(rootLayoutPath)) {
  fs.writeFileSync(rootLayoutPath, rootLayoutContent);
  console.log('  ✓ Created app/layout.tsx');
} else {
  console.log('  - app/layout.tsx already exists');
}

// Public layout (with header and footer)
const publicLayoutPath = path.join(rootDir, 'app/(public)/layout.tsx');
const publicLayoutContent = `import MainLayout from '@/components/MainLayout';
import { InventoryProvider } from '@/context/VehicleContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </InventoryProvider>
  );
}
`;

ensureDir(path.dirname(publicLayoutPath));
if (!fs.existsSync(publicLayoutPath)) {
  fs.writeFileSync(publicLayoutPath, publicLayoutContent);
  console.log('  ✓ Created app/(public)/layout.tsx');
} else {
  console.log('  - app/(public)/layout.tsx already exists');
}

// Standalone layout (no header/footer, but with inventory context)
const standaloneLayoutPath = path.join(rootDir, 'app/(standalone)/layout.tsx');
const standaloneLayoutContent = `import { InventoryProvider } from '@/context/VehicleContext';

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryProvider>
      {children}
    </InventoryProvider>
  );
}
`;

ensureDir(path.dirname(standaloneLayoutPath));
if (!fs.existsSync(standaloneLayoutPath)) {
  fs.writeFileSync(standaloneLayoutPath, standaloneLayoutContent);
  console.log('  ✓ Created app/(standalone)/layout.tsx');
} else {
  console.log('  - app/(standalone)/layout.tsx already exists');
}

// Auth layout (public only pages)
const authLayoutPath = path.join(rootDir, 'app/(auth)/layout.tsx');
const authLayoutContent = `'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      // Redirect to dashboard if already logged in
      router.push('/escritorio');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
`;

ensureDir(path.dirname(authLayoutPath));
if (!fs.existsSync(authLayoutPath)) {
  fs.writeFileSync(authLayoutPath, authLayoutContent);
  console.log('  ✓ Created app/(auth)/layout.tsx');
} else {
  console.log('  - app/(auth)/layout.tsx already exists');
}

// Dashboard layout (protected routes)
const dashboardLayoutPath = path.join(rootDir, 'app/escritorio/layout.tsx');
const dashboardLayoutContent = `import DashboardLayout from '@/components/DashboardLayout';
import { InventoryProvider } from '@/context/VehicleContext';

export default function EscritorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </InventoryProvider>
  );
}
`;

ensureDir(path.dirname(dashboardLayoutPath));
if (!fs.existsSync(dashboardLayoutPath)) {
  fs.writeFileSync(dashboardLayoutPath, dashboardLayoutContent);
  console.log('  ✓ Created app/escritorio/layout.tsx');
} else {
  console.log('  - app/escritorio/layout.tsx already exists');
}

// Step 3: Create migration report
console.log('\n📊 Creating migration report...');
const report = {
  timestamp: new Date().toISOString(),
  totalRoutes: routeMap.routes.length,
  createdPages,
  skippedPages,
  layoutsCreated: 5,
  routes: routeMap.routes.map(r => ({
    from: r.path,
    to: r.nextPath,
    component: r.component,
    layout: r.layout,
  })),
};

const reportPath = path.join(__dirname, 'route-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✓ Report saved to: route-migration-report.json`);

console.log('\n✅ Phase 3 Complete: Routes migrated');
console.log(`\n  📊 Summary:`);
console.log(`     Total routes: ${routeMap.routes.length}`);
console.log(`     Pages created: ${createdPages}`);
console.log(`     Pages skipped: ${skippedPages}`);
console.log(`     Layouts created: 5`);
console.log('\n' + '═'.repeat(60));
