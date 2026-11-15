import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 sm:h-9 w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#101318] px-3 py-2 text-base sm:text-sm text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C8567] dark:focus-visible:ring-[#dc2626] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors scroll-mt-24 scroll-mb-24',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

