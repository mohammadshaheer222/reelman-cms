import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C8567]/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#141414] dark:bg-neutral-100 text-white dark:text-[#141414] hover:bg-black dark:hover:bg-white shadow-xs hover:shadow-sm font-semibold',
        brand: 'bg-[#2C8567] text-white hover:bg-[#236d54] shadow-xs hover:shadow-emerald-600/20',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-xs',
        outline: 'border border-gray-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50/80 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white text-gray-700 dark:text-gray-200 shadow-2xs',
        secondary: 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-neutral-700',
        ghost: 'hover:bg-gray-100/80 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white text-gray-700 dark:text-gray-300',
        link: 'text-[#2C8567] dark:text-emerald-400 underline-offset-4 hover:underline',
        pill: 'rounded-full bg-[#141414] dark:bg-neutral-100 text-white dark:text-[#141414] hover:bg-black dark:hover:bg-white shadow-xs',
        pillBrand: 'rounded-full bg-[#2C8567] text-white hover:bg-[#236d54] shadow-xs',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs sm:text-sm',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-sm font-semibold',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

