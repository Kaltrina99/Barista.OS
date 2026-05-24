import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export const NavTab = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2.5 px-6 py-2.5 rounded-[12px] transition-all duration-300 relative group",
      active ? "text-brand-primary font-bold" : "text-[#8C857D] hover:text-brand-primary font-medium"
    )}
  >
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="absolute inset-0 bg-white shadow-sm border border-[#E8E2D9] rounded-[12px]"
        initial={false}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <span className="relative z-10">{icon}</span>
    <span className="text-[10px] uppercase tracking-widest relative z-10">{label}</span>
  </button>
);

export const MobileNavTab = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all relative",
      active ? "text-brand-primary" : "text-[#8C857D]"
    )}
  >
    {active && (
      <motion.div 
        layoutId="activeMobileNav"
        className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl -z-10"
      />
    )}
    {icon}
    <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);
