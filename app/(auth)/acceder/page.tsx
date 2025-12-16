'use client';

import { Suspense } from 'react';
import LoginPage from '@/page-components/LoginPage';
import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen w-full bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#003161]" />
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
