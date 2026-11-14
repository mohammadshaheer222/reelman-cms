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
  color = 'text-[#141414] bg-gray-100',
}: StatsCardProps) {
  return (
    <Card className="p-5 sm:p-6 flex items-start justify-between bg-white rounded-2xl border border-gray-100/90 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300 group">
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em]">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-[#141414] mt-2 tracking-tight group-hover:text-black transition-colors">
          {value}
        </p>
        {description && (
          <p className="text-xs text-gray-400 mt-1.5 font-normal truncate leading-normal">
            {description}
          </p>
        )}
      </div>
      <div
        className={`p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-2xs ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </Card>
  );
}
