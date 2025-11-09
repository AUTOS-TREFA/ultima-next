'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import ValuationApp from '../Valuation/App';

const QuoteCarPage: React.FC = () => {
    // SEO metadata is handled in the page.tsx file in Next.js

    const searchParams = useSearchParams();
    const initialSearch = searchParams?.get('search');

    return (
        <div className="w-full flex justify-center items-start py-8 sm:py-12">
             <ValuationApp initialSearchQuery={initialSearch} />
        </div>
    );
};

export default QuoteCarPage;
