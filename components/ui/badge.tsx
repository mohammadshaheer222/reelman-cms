import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-emerald-50 text-[#2C8567] border-emerald-100/80',
        brand: 'bg-[#2C8567] text-white border-transparent shadow-2xs',
        secondary: 'bg-gray-100 text-gray-700 border-gray-200/60',
        destructive: 'bg-red-50 text-red-700 border-red-200/70',
        outline: 'border-gray-200/90 bg-white text-gray-700',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        warning: 'bg-amber-50 text-amber-700 border-amber-200/70',
        dark: 'bg-[#141414] text-white border-transparent',
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

