import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Users, ShieldCheck, CheckCircle2, Trash2, ShieldAlert } from 'lucide-react';
import { UserProfile, SubscriptionTier, AppTab } from '../../../types';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface AdminPanelProps {
  isAdminLoading: boolean;
  allTenants: UserProfile[];
  handleImpersonate: (uid: string | null) => void;
  handleUpdateSubscription: (uid: string, tier: SubscriptionTier) => void;
  handleUpdateTabs: (uid: string, tabs: AppTab[]) => void;
  handleApproveTenant: (uid: string, isApproved: boolean) => void;
  handleDeleteTenant: (uid: string) => void;
}

const AVAILABLE_TABS: { id: AppTab; label: string }[] = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'inventory', label: 'Supply' },
  { id: 'market', label: 'Pricing' },
  { id: 'requisition', label: 'Orders' },
  { id: 'history', label: 'Audits' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdminLoading,
  allTenants,
  handleImpersonate,
  handleUpdateSubscription,
  handleUpdateTabs,
  handleApproveTenant,
  handleDeleteTenant
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
        <h2 className="text-4xl font-serif text-[#C88D67] italic">Consolidated Oversight.</h2>
        <p className="text-xs text-[#8C857D] font-bold uppercase tracking-[0.2em] mt-2">Tenant Registry • Subscription Management • Approval Terminal</p>
      </div>

      {isAdminLoading ? (
        <div className="flex justify-center p-20">
          <RefreshCw className="animate-spin text-[#C88D67]" size={32} />
        </div>
      ) : allTenants.length === 0 ? (
        <div className="bg-white/50 border border-[#E8E2D9] border-dashed rounded-[32px] p-20 text-center">
          <div className="w-16 h-16 bg-[#F0EBE4] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-[#8C857D]" />
          </div>
          <h3 className="text-xl font-serif text-[#5A5A40] mb-2 italic">Registry is silent.</h3>
          <p className="text-[#8C857D] text-sm max-w-sm mx-auto">
            No other tenants have registered yet. When they log in for the first time, they will appear here for your configuration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {allTenants.map((tenant) => (
            <div key={tenant.uid} className="bg-white border border-[#E8E2D9] p-8 rounded-[40px] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 group hover:border-[#C88D67] transition-all relative overflow-hidden">
              <div className="flex items-center gap-6">
                <div className={cn(
                   "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-lg",
                   tenant.isApproved ? "bg-[#5A5A40]" : "bg-[#C88D67] animate-pulse"
                )}>
                  <Users size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#2D2A26]">{tenant.email}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8C857D]">UID: {tenant.uid.substring(0, 8)}...</span>
                    <span className={cn(
                       "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                       tenant.subscriptionTier === 'enterprise' ? "bg-purple-100 text-purple-700" : 
                       tenant.subscriptionTier === 'pro' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    )}>
                       {tenant.subscriptionTier}
                    </span>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-[#F0EBE4]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40] mb-3">Feature Access Control (Charging per tab)</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TABS.map(tab => {
                        const isEnabled = (tenant.enabledTabs || ['dashboard', 'inventory', 'requisition', 'history']).includes(tab.id);
                        return (
                          <button
                            key={tab.id}
                            onClick={() => toggleTab(tenant, tab.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border flex items-center gap-2",
                              isEnabled 
                                ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                                : "bg-white text-[#8C857D] border-[#E8E2D9] hover:border-[#5A5A40]/30"
                            )}
                          >
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isEnabled ? "bg-green-400" : "bg-gray-300"
                            )} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right mr-4 hidden md:block">
                   <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest">Last Active</p>
                   <p className="text-sm font-mono font-bold text-[#5A5A40]">{tenant.lastActive ? format(new Date(tenant.lastActive), 'MMM d, HH:mm') : 'Never'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                   <button 
                     onClick={() => handleImpersonate(tenant.uid)}
                     className="px-6 py-3 bg-[#F9F8F6] border border-[#E8E2D9] text-[#5A5A40] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5A5A40] hover:text-white transition-all flex items-center gap-2"
                   >
                     <ShieldCheck size={14} />
                     Impersonate
                   </button>

                   <select 
                     value={tenant.subscriptionTier}
                     onChange={(e) => handleUpdateSubscription(tenant.uid, e.target.value as SubscriptionTier)}
                     className="bg-[#F9F8F6] border border-[#E8E2D9] rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#C88D67]"
                   >
                     <option value="free">Free</option>
                     <option value="basic">Basic</option>
                     <option value="pro">Pro</option>
                     <option value="enterprise">Enterprise</option>
                   </select>

                   {!tenant.isApproved ? (
                     <button 
                       onClick={() => handleApproveTenant(tenant.uid, true)}
                       className="px-6 py-3 bg-[#C88D67] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#C88D67]/20 hover:opacity-90 transition-all"
                     >
                       Approve
                     </button>
                   ) : (
                     <div className="flex items-center gap-2">
                       <div className="px-6 py-3 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
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
          ))}
        </div>
      )}
    </motion.div>
  );
};
