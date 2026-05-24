import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { 
  Coffee, 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  ShoppingBag, 
  History, 
  ShieldCheck, 
  LogOut,
  Plus,
  CreditCard
} from 'lucide-react';
import { calculateSubscriptionPrice } from '../../utils/pricing';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSuperAdmin: boolean;
  profile: any;
  handleSignOut: () => void;
  setIsAddingItem: (val: boolean) => void;
  handleImpersonate: (uid: string | null) => void;
}

export const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isSuperAdmin, 
  profile, 
  handleSignOut,
  setIsAddingItem,
  handleImpersonate
}: SidebarProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, enabled: isSuperAdmin || profile?.enabledTabs?.includes('dashboard') },
    { id: 'inventory', label: 'Supply', icon: Package, enabled: isSuperAdmin || profile?.enabledTabs?.includes('inventory') },
    { id: 'market', label: 'Pricing', icon: TrendingUp, enabled: isSuperAdmin || profile?.enabledTabs?.includes('market') },
    { id: 'requisition', label: 'Orders', icon: ShoppingBag, enabled: isSuperAdmin || profile?.enabledTabs?.includes('requisition') },
    { id: 'history', label: 'Audits', icon: History, enabled: isSuperAdmin || profile?.enabledTabs?.includes('history') },
    { id: 'admin', label: 'Super Admin', icon: ShieldCheck, enabled: isSuperAdmin },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 fixed left-0 top-0 bottom-0 bg-white border-r border-[#E8E2D9] z-[100] p-8 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-4 mb-12">
        <motion.div 
          whileHover={{ rotate: 12 }}
          className="w-12 h-12 rounded-[16px] bg-brand-primary flex items-center justify-center text-white shadow-lg rotate-3 shrink-0"
        >
          <Coffee size={24} />
        </motion.div>
        <div>
          <h1 className="text-xl font-serif font-semibold text-brand-primary tracking-tight leading-none">Barista.OS</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-[#8C857D] uppercase tracking-[0.2em] font-black block">Intelligence Hub</span>
            {isSuperAdmin && (
              <span className="bg-brand-secondary text-white px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-tighter">Superuser</span>
            )}
          </div>
        </div>
      </div>

      {profile?.impersonatingUid && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest mb-2">
            <ShieldCheck size={14} />
            Impersonating
          </div>
          <button 
            onClick={() => handleImpersonate(null)} 
            className="w-full py-2 bg-white border border-red-200 text-red-500 rounded-xl text-[9px] font-bold uppercase hover:bg-red-50 transition-all"
          >
            End Session
          </button>
        </div>
      )}

      {/* Primary Action */}
      {(isSuperAdmin || profile?.permissions?.canAddItems) && (
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddingItem(true)}
          className="mb-8 w-full bg-brand-primary text-white py-4 rounded-[16px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
        >
          <Plus size={18} />
          New Item
        </motion.button>
      )}

      {/* Active Subscription Details Panel */}
      {profile && (
        (() => {
          const pricing = calculateSubscriptionPrice(profile);
          return (
            <div className="mb-6 p-4 rounded-2xl bg-[#F9F8F6] border border-[#E8E2D9] flex flex-col gap-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#8C857D]">
                  <CreditCard size={12} className="text-brand-primary" />
                  Your Package
                </div>
                <span className={cn(
                  "text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded font-black",
                  pricing.isSuperAdmin ? "bg-red-50 text-red-600 border border-red-100" :
                  pricing.isFreeByConfig ? "bg-green-50 text-green-600 border border-green-100" : "bg-brand-primary/5 text-brand-primary border border-brand-primary/10"
                )}>
                  {pricing.isSuperAdmin ? "Superuser" : pricing.isFreeByConfig ? "Free Plan" : "Feature Plan"}
                </span>
              </div>
              <div>
                <span className="text-xs font-serif font-black text-[#2D2A26] lowercase italic">
                  {pricing.isSuperAdmin ? "unlimited platform admin" : 
                   pricing.isFreeByConfig ? "superadmin waived package fee" : 
                   `${pricing.breakdown.length} active feature modules`}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-mono font-bold text-brand-primary">
                    ${pricing.total.toFixed(2)}
                  </span>
                  <span className="text-[8px] font-bold text-[#8C857D] uppercase">/ month</span>
                </div>
              </div>
              {!pricing.isSuperAdmin && !pricing.isFreeByConfig && (
                <div className="text-[8px] text-[#8C857D] mt-1 border-t border-[#E8E2D9] pt-2 leading-relaxed">
                  <span className="font-bold">Includes: </span>
                  {pricing.breakdown.map(b => b.name).join(', ')}
                </div>
              )}
            </div>
          );
        })()
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {tabs.filter(t => t.enabled).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-[16px] transition-all duration-300 relative group text-left",
                isActive ? "text-brand-primary font-bold" : "text-[#8C857D] hover:text-brand-primary font-medium hover:bg-[#F9F8F6]"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebarActiveNav"
                  className="absolute inset-0 bg-brand-primary/5 border border-brand-primary/10 rounded-[16px]"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={20} className={cn("relative z-10", isActive ? "text-brand-primary" : "text-[#8C857D] group-hover:text-brand-primary")} />
              <span className="text-xs uppercase tracking-widest relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="pt-8 mt-8 border-t border-[#E8E2D9]">
        <motion.button 
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-[#8C857D] hover:text-red-500 hover:bg-red-50 transition-all text-xs font-black uppercase tracking-widest"
        >
          <LogOut size={20} />
          Sign Out
        </motion.button>
      </div>
    </aside>
  );
};
