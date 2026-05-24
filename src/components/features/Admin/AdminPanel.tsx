import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Users, ShieldCheck, CheckCircle2, Trash2, ShieldAlert, CreditCard } from 'lucide-react';
import { UserProfile, SubscriptionTier, AppTab } from '../../../types';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';
import { FEATURE_INFO, calculateSubscriptionPrice } from '../../../utils/pricing';

interface AdminPanelProps {
  isAdminLoading: boolean;
  allTenants: UserProfile[];
  handleImpersonate: (uid: string | null) => void;
  handleUpdateSubscription: (uid: string, tier: SubscriptionTier) => void;
  handleUpdateTabs: (uid: string, tabs: AppTab[]) => void;
  handleApproveTenant: (uid: string, isApproved: boolean) => void;
  handleDeleteTenant: (uid: string) => void;
  handleUpdateTheme: (uid: string, theme: any) => void;
}

const AVAILABLE_TABS: { id: AppTab; label: string }[] = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'inventory', label: 'Supply' },
  { id: 'market', label: 'Pricing' },
  { id: 'requisition', label: 'Orders' },
  { id: 'history', label: 'Audits' },
];

const THEME_COLORS = [
  { id: '#5A5A40', label: 'Sage' },
  { id: '#C88D67', label: 'Terracotta' },
  { id: '#2D2A26', label: 'Charcoal' },
  { id: '#8C5E58', label: 'Mauve' },
  { id: '#4A5D6B', label: 'Ocean' },
  { id: '#6B4A5E', label: 'Plum' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdminLoading,
  allTenants,
  handleImpersonate,
  handleUpdateSubscription,
  handleUpdateTabs,
  handleApproveTenant,
  handleDeleteTenant,
  handleUpdateTheme
}) => {
  const toggleTab = (tenant: UserProfile, tabId: AppTab) => {
    const currentTabs = tenant.enabledTabs || ['dashboard', 'inventory', 'history'];
    const newTabs = currentTabs.includes(tabId)
      ? currentTabs.filter(t => t !== tabId)
      : [...currentTabs, tabId];
    handleUpdateTabs(tenant.uid, newTabs);
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="mb-10">
        <h2 className="text-4xl font-serif text-brand-primary italic">Consolidated Oversight.</h2>
        <p className="text-xs text-[#8C857D] font-bold uppercase tracking-[0.2em] mt-2">Tenant Registry • Subscription Management • Approval Terminal</p>
      </div>

      {isAdminLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <RefreshCw className="animate-spin text-brand-primary" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8C857D]">Syncing Registry...</p>
        </div>
      ) : allTenants.length === 0 ? (
        <div className="bg-white/50 border border-[#E8E2D9] border-dashed rounded-[32px] p-10 md:p-20 text-center">
          <div className="w-16 h-16 bg-[#F0EBE4] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-[#8C857D]" />
          </div>
          <h3 className="text-xl font-serif text-brand-primary mb-2 italic lowercase">Registry is silent.</h3>
          <p className="text-[#8C857D] text-sm max-w-sm mx-auto">
            No other tenants have registered yet. If you have tenants, ensure they have logged in at least once.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {allTenants.map((tenant, idx) => {
            const pricing = calculateSubscriptionPrice(tenant);
            return (
              <div key={`${tenant.uid || 'tenant'}-${idx}`} className="bg-white border border-[#E8E2D9] p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 group hover:border-brand-primary transition-all relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full xl:w-auto">
                  <div className={cn(
                     "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-lg shrink-0",
                     tenant.isApproved ? "bg-brand-primary" : "bg-brand-secondary animate-pulse"
                  )}>
                    <Users size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg md:text-xl font-bold text-[#2D2A26] lowercase italic truncate">{tenant.email}</h4>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#8C857D]">UID: {tenant.uid.substring(0, 8)}...</span>
                      <span className={cn(
                         "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl font-bold",
                         pricing.isSuperAdmin ? "bg-red-50 text-red-700 border border-red-200" : 
                         pricing.isFreeByConfig ? "bg-green-50 text-green-700 border border-green-200" : "bg-brand-primary/5 text-brand-primary border border-brand-primary/10"
                      )}>
                         {pricing.isSuperAdmin ? "Super Admin (Free)" : 
                          pricing.isFreeByConfig ? "Gifted Package (Free)" : `Active-Feature Package ($${pricing.total.toFixed(2)}/mo)`}
                      </span>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-[#F0EBE4]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Features & Module Prices</p>
                        <span className="text-[9px] font-bold text-[#8C857D]">(select features to automatically construct package fee)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TABS.map(tab => {
                          const isEnabled = (tenant.enabledTabs || ['dashboard', 'inventory', 'requisition', 'history']).includes(tab.id);
                          const feat = FEATURE_INFO[tab.id];
                          return (
                            <button
                              key={tab.id}
                              onClick={() => toggleTab(tenant, tab.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border flex items-center gap-2",
                                isEnabled 
                                  ? "bg-brand-primary text-white border-brand-primary" 
                                  : "bg-white text-[#8C857D] border-[#E8E2D9] hover:border-brand-primary/30"
                              )}
                              title={`${feat?.name}: ${feat?.description}`}
                            >
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isEnabled ? "bg-green-400" : "bg-gray-300"
                              )} />
                              {tab.label} (${feat?.price?.toFixed(0)}/mo)
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Highly-visible, premium dynamically calculated receipt */}
                    <div className="mt-4 p-4 rounded-2xl bg-[#F9F8F6] border border-[#E8E2D9] flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-primary">
                          <CreditCard size={12} />
                          Active Package Breakdown
                        </div>
                        <p className="text-[10px] text-[#8C857D] mt-1">
                          {pricing.isSuperAdmin 
                            ? "Developer / Administrative account. Complete access with no billing liability." 
                            : pricing.isFreeByConfig 
                              ? "Free access has been granted for this tenant by administrative decision." 
                              : `Monthly charge reflects ${pricing.breakdown.length} active feature modules.`}
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex flex-col justify-center">
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#8C857D]">Subscription Rate</span>
                        <span className="text-base font-mono font-bold text-[#2D2A26]">
                          ${pricing.total.toFixed(2)} / mo
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#F0EBE4]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-3">Tenant Branding (Theme)</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {THEME_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => handleUpdateTheme(tenant.uid, { ...tenant.theme, primaryColor: color.id })}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              tenant.theme?.primaryColor === color.id ? "border-brand-primary scale-110" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color.id }}
                            title={color.label}
                          />
                        ))}
                        <input 
                          type="text" 
                          placeholder="#HEX"
                          value={tenant.theme?.primaryColor?.startsWith('#') ? tenant.theme.primaryColor : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.length === 7 && val.startsWith('#')) {
                              handleUpdateTheme(tenant.uid, { ...tenant.theme, primaryColor: val });
                            }
                          }}
                          className="px-3 py-2 bg-[#F9F8F6] border border-[#E8E2D9] rounded-xl text-[10px] font-mono w-20 outline-none focus:border-brand-secondary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto xl:justify-end border-t xl:border-t-0 pt-6 xl:pt-0 border-[#F0EBE4]">
                  <div className="text-left md:text-right mr-4 w-full md:w-auto">
                     <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest">Last Active</p>
                     <p className="text-sm font-mono font-bold text-brand-primary">{tenant.lastActive ? format(new Date(tenant.lastActive), 'MMM d, HH:mm') : 'Never'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                     <button 
                       onClick={() => handleImpersonate(tenant.uid)}
                       className="px-4 md:px-6 py-3 bg-[#F9F8F6] border border-[#E8E2D9] text-[#5A5A40] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2 flex-1 md:flex-none"
                     >
                       <ShieldCheck size={14} />
                       Impersonate
                     </button>

                     <select 
                       value={tenant.subscriptionTier}
                       onChange={(e) => handleUpdateSubscription(tenant.uid, e.target.value as SubscriptionTier)}
                       className="bg-[#F9F8F6] border border-[#E8E2D9] rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-secondary flex-1 md:flex-none cursor-pointer"
                       title="Subscription Package Type"
                     >
                       <option value="free">Grant Free Acc.</option>
                       <option value="pro">Feature-Based Billable</option>
                     </select>

                   {!tenant.isApproved ? (
                     <button 
                       onClick={() => handleApproveTenant(tenant.uid, true)}
                       className="px-4 md:px-6 py-3 bg-brand-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-secondary/20 hover:opacity-90 transition-all flex-1 md:flex-none"
                     >
                       Approve
                     </button>
                   ) : (
                     <div className="flex items-center gap-2 flex-1 md:flex-none">
                       <div className="px-4 md:px-6 py-3 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2 flex-1 md:flex-none">
                         <CheckCircle2 size={14} />
                         Verified
                       </div>
                       <button 
                         onClick={() => handleApproveTenant(tenant.uid, false)}
                         className="p-3 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                         title="Disable Tenant"
                       >
                         <ShieldAlert size={18} />
                       </button>
                     </div>
                   )}

                   <button 
                     onClick={() => {
                       if (window.confirm('Constructive purge: This will permanently remove this tenant and all associated data. Continue?')) {
                         handleDeleteTenant(tenant.uid);
                       }
                     }}
                     className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                     title="Purge Tenant"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) }
    </motion.div>
  );
};
