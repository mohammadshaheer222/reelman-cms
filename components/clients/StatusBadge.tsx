import React from 'react';
import { Status } from '@/types';

interface StatusBadgeProps {
  status: Status | string | undefined;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Unknown
      </span>
    );
  }

  const name = typeof status === 'object' ? status.name : status;
  const color = typeof status === 'object' ? status.color : '#6366f1';

  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wide rounded-full ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}35`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
