import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  color?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'text-blue-600 bg-blue-50',
}: StatsCardProps) {
  return (
    <Card className="p-5 flex items-center justify-between shadow-sm border-gray-100">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </Card>
  );
}
