import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CompactStatProps {
  title: string;
  value: string | number;
  label?: string;
  trend: string;
  icon: React.ReactNode;
  color: 'accent' | 'danger' | 'warm';
}

export const CompactStat = memo(({ title, value, label, trend, icon, color }: CompactStatProps) => {
  const themes = {
    accent: "bg-[#5A5A40]/5 border-[#5A5A40]/10 text-[#5A5A40]",
    danger: "bg-red-50 border-red-100 text-red-700",
    warm: "bg-amber-50 border-amber-100 text-amber-700"
  };

  return (
    <div className={cn("p-6 rounded-[32px] border transition-all hover:bg-white hover:shadow-lg group", themes[color])}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-8 h-8 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 mb-0.5">{title}</p>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest">{label}</p>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-serif font-medium">{value}</h4>
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase opacity-60 italic pb-1">
          <RefreshCw size={10} className="animate-spin-slow" />
          {trend}
        </div>
      </div>
    </div>
  );
});

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
  color?: string;
}

export const ActionButton = memo(({ onClick, title, icon, label, color = "#5A5A40" }: ActionButtonProps) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center p-10 bg-white border border-[#E8E2D9] rounded-[48px] hover:border-[#5A5A40] hover:shadow-xl hover:-translate-y-1 transition-all w-full overflow-hidden"
  >
    <div className="absolute inset-0 bg-[#5A5A40]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="w-20 h-20 rounded-[32px] mb-6 flex items-center justify-center transition-all group-hover:scale-110 shadow-lg" style={{ backgroundColor: color + '15', color }}>
      {icon}
    </div>
    <span className="text-xl font-serif text-[#2D2A26] italic mb-1 lowercase">{title}.</span>
    <span className="text-[10px] text-[#8C857D] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
));
