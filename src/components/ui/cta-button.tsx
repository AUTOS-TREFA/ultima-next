'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * CTAButton - Unified Call-to-Action Button Component
 *
 * Brand Colors:
 * - Primary (Orange): #FF6801 - Brand identity color
 * - Secondary/CTA (Blue): #003161 - Action buttons color
 *
 * Use this component for all CTAs across the site to maintain consistency.
 */

const ctaButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary CTA - Blue (#003161)
        default: 'bg-[#003161] text-white hover:bg-[#002850] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[#003161]',

        // Secondary CTA - Blue outline
        outline: 'border-2 border-[#003161] text-[#003161] bg-transparent hover:bg-[#003161] hover:text-white shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[#003161]',

        // Brand Primary - Orange (#FF6801) for brand elements
        brand: 'bg-[#FF6801] text-white hover:bg-[#E55E01] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[#FF6801]',

        // Brand Outline - Orange outline
        'brand-outline': 'border-2 border-[#FF6801] text-[#FF6801] bg-transparent hover:bg-[#FF6801] hover:text-white shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[#FF6801]',

        // Ghost - subtle for secondary actions
        ghost: 'text-[#003161] hover:bg-[#003161]/10 hover:text-[#002850]',

        // Link style
        link: 'text-[#003161] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        default: 'h-11 px-6 text-sm',
        lg: 'h-14 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface CTAButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ctaButtonVariants> {
  asChild?: boolean;
}

const CTAButton = React.forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(ctaButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
CTAButton.displayName = 'CTAButton';

export { CTAButton, ctaButtonVariants };
