import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#14171d] rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
      <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
