'use client';

import { Suspense } from 'react';
import AuthPage from '@/page-components/AuthPage';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen w-full bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AuthPage />
    </Suspense>
  );
}
