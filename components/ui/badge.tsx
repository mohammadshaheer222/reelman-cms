import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#2C8567] dark:text-emerald-300 border-emerald-100/80 dark:border-emerald-800',
        brand: 'bg-[#2C8567] text-white border-transparent shadow-2xs',
        secondary: 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-gray-200/60 dark:border-neutral-700',
        destructive: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200/70 dark:border-red-800',
        outline: 'border-gray-200/90 dark:border-neutral-700 bg-white dark:bg-[#14171d] text-gray-700 dark:text-neutral-300',
        success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800',
        warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800',
        dark: 'bg-[#141414] dark:bg-neutral-800 text-white border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  color?: string;
}

function Badge({ className, variant, color, style, ...props }: BadgeProps) {
  const customStyle = color
    ? {
        backgroundColor: color + '20',
        color: color,
        ...style,
      }
    : style;

  return (
    <div
      className={cn(badgeVariants({ variant }), color ? '' : '', className)}
      style={customStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

