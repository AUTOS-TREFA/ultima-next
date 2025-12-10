import SalesPerformanceDashboard from '@/page-components/SalesPerformanceDashboard';

// Prevent prerendering since this page requires auth
export const dynamic = 'force-dynamic';

export default function Page() {
  return <SalesPerformanceDashboard />;
}
