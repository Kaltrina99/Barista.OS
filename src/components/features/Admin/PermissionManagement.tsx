import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  User, 
  Check, 
  Search, 
  Settings, 
  Layout, 
  Package, 
  TrendingUp, 
  ClipboardCheck, 
  History,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { UserProfile, AppTab } from '../../../types';
import { inventoryService, auth } from '../../../services/inventoryService';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface PermissionManagerProps {
  onClose: () => void;
  tenants: UserProfile[];
  onUpdatePermissions: (uid: string, permissions: any) => Promise<void>;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  onClose,
  tenants,
  onUpdatePermissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [localPermissions, setLocalPermissions] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setLocalPermissions(selectedUser.permissions || {
        dashboard: true,
        inventory: true,
        market: true,
        requisition: true,
        history: true,
        canAddItems: true,
        canEditItems: true,
        canDeleteItems: true,
        canProcessSales: true,
        canProcessRestocks: true
      });
    }
  }, [selectedUser]);

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.email?.toLowerCase().includes(searchTerm.toLowerCase());
    // Show all except the current user to avoid self-locking permissions
    return matchesSearch && t.uid !== auth.currentUser?.uid;
  });

  const togglePermission = (key: string) => {
    setLocalPermissions((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!selectedUser || !localPermissions) return;
    setIsSaving(true);
    try {
      // Also sync enabledTabs for backward compatibility and simpler checks
      const enabledTabs: AppTab[] = [];
      if (localPermissions.dashboard) enabledTabs.push('dashboard');
      if (localPermissions.inventory) enabledTabs.push('inventory');
      if (localPermissions.market) enabledTabs.push('market');
      if (localPermissions.requisition) enabledTabs.push('requisition');
      if (localPermissions.history) enabledTabs.push('history');

      await onUpdatePermissions(selectedUser.uid, { 
        permissions: localPermissions,
        enabledTabs
      });
      setSelectedUser(null);
    } finally {
      setIsSaving(false);
    }
  };

  const PermissionToggle = ({ label, icon: Icon, state, onToggle, description }: any) => (
    <div className="flex items-center justify-between p-4 bg-[#F9F8F6] border border-[#E8E2D9] rounded-2xl hover:border-[#5A5A40]/30 transition-all">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          state ? "bg-[#5A5A40] text-white" : "bg-[#E8E2D9] text-[#8C857D]"
        )}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#5A5A40]">{label}</p>
          <p className="text-[10px] text-[#8C857D] font-bold mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "w-12 h-6 rounded-full transition-all relative",
          state ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]" : "bg-[#E8E2D9]"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
          state ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#5A5A40]/10 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white border-2 border-[#E8E2D9] w-full max-w-6xl h-[95vh] md:h-[85vh] rounded-[32px] md:rounded-[48px] shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:hidden z-50 w-10 h-10 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-[#8C857D]"
        >
          <X size={20} />
        </button>

        {/* Sidebar: User List */}
        <div className={cn(
          "w-full md:w-80 border-r border-[#E8E2D9] flex flex-col bg-[#F9F8F6] shrink-0",
          selectedUser ? "hidden md:flex" : "flex h-full"
        )}>
          <div className="p-6 md:p-8 border-b border-[#E8E2D9]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 md:p-3 bg-[#5A5A40] rounded-2xl text-white">
                <Shield size={18} />
              </div>
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[#5A5A40]">Access Matrix</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C857D]" size={14} />
              <input 
                type="text"
                placeholder="Find tenant..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#C88D67] transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {filteredTenants.length > 0 ? (
              filteredTenants.map(tenant => (
                <button
                  key={tenant.uid}
                  onClick={() => setSelectedUser(tenant)}
                  className={cn(
                    "w-full p-4 rounded-3xl border transition-all text-left flex items-center gap-4 group",
                    selectedUser?.uid === tenant.uid 
                      ? "bg-[#5A5A40] border-[#5A5A40] shadow-lg shadow-[#5A5A40]/20" 
                      : "bg-white border-[#E8E2D9] hover:border-[#5A5A40]/30"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center transition-colors",
                    selectedUser?.uid === tenant.uid ? "bg-white/10" : "bg-[#F9F8F6]"
                  )}>
                    <User size={16} className={selectedUser?.uid === tenant.uid ? "text-white" : "text-[#5A5A40]"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate",
                      selectedUser?.uid === tenant.uid ? "text-white" : "text-[#5A5A40]"
                    )}>
                      {tenant.email.split('@')[0]}
                    </p>
                    <p className={cn(
                      "text-[8px] font-bold uppercase truncate mt-0.5",
                      selectedUser?.uid === tenant.uid ? "text-white/50" : "text-[#8C857D]"
                    )}>
                      {tenant.email}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-[#8C857D]">
                <p className="text-[10px] font-black uppercase tracking-widest">No nodes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Permission Controls */}
        <div className={cn(
          "flex-1 flex flex-col bg-white",
          !selectedUser && "hidden md:flex"
        )}>
          <div className="p-6 md:p-8 border-b border-[#E8E2D9] flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4 md:gap-6">
              {selectedUser && (
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 text-[#8C857D]"
                >
                  <Shield size={20} />
                </button>
              )}
              {selectedUser ? (
                <>
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-[#F9F8F6] border border-[#E8E2D9] rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0">
                    <Settings className="text-[#C88D67] animate-spin-slow" size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-xl font-mono font-black text-[#5A5A40] mb-0.5 truncate uppercase">Config: {selectedUser.email.split('@')[0]}</h3>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#8C857D] truncate">Modifying granular access capabilities</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 text-[#8C857D]">
                  <AlertCircle size={20} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Select a node to configure access</p>
                </div>
              )}
            </div>
            <button onClick={onClose} className="hidden md:block p-2 text-[#8C857D] hover:text-[#5A5A40] transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-12 scrollbar-hide">
            {selectedUser && localPermissions && (
              <>
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C857D] mb-6">Navigation Modules</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PermissionToggle 
                      label="Dashboard" 
                      icon={Layout} 
                      state={localPermissions.dashboard}
                      onToggle={() => togglePermission('dashboard')}
                      description="Access the command center and analytics"
                    />
                    <PermissionToggle 
                      label="Inventory" 
                      icon={Package} 
                      state={localPermissions.inventory}
                      onToggle={() => togglePermission('inventory')}
                      description="View and manage physical stock"
                    />
                    <PermissionToggle 
                      label="Market" 
                      icon={TrendingUp} 
                      state={localPermissions.market}
                      onToggle={() => togglePermission('market')}
                      description="Real-time pricing and stock data"
                    />
                    <PermissionToggle 
                      label="Requisition" 
                      icon={ClipboardCheck} 
                      state={localPermissions.requisition}
                      onToggle={() => togglePermission('requisition')}
                      description="Supply chain and restock processing"
                    />
                    <PermissionToggle 
                      label="History" 
                      icon={History} 
                      state={localPermissions.history}
                      onToggle={() => togglePermission('history')}
                      description="Activity logs and audit trails"
                    />
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C857D] mb-6">Operational Capabilities</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PermissionToggle 
                      label="Asset Creation" 
                      icon={Unlock} 
                      state={localPermissions.canAddItems}
                      onToggle={() => togglePermission('canAddItems')}
                      description="Ability to provision new inventory items"
                    />
                    <PermissionToggle 
                      label="Asset Editing" 
                      icon={Settings} 
                      state={localPermissions.canEditItems}
                      onToggle={() => togglePermission('canEditItems')}
                      description="Ability to modify existing inventory data"
                    />
                    <PermissionToggle 
                      label="Asset Deletion" 
                      icon={Lock} 
                      state={localPermissions.canDeleteItems}
                      onToggle={() => togglePermission('canDeleteItems')}
                      description="Ability to decommission items permanently"
                    />
                    <PermissionToggle 
                      label="Process Sales" 
                      icon={TrendingUp} 
                      state={localPermissions.canProcessSales}
                      onToggle={() => togglePermission('canProcessSales')}
                      description="Access to sales scanning and logging"
                    />
                    <PermissionToggle 
                      label="Process Restocks" 
                      icon={Package} 
                      state={localPermissions.canProcessRestocks}
                      onToggle={() => togglePermission('canProcessRestocks')}
                      description="Access to supply intake and bills scanning"
                    />
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="p-6 md:p-8 border-t border-[#E8E2D9] bg-[#F9F8F6] flex justify-end">
            <button
              disabled={!selectedUser || isSaving}
              onClick={handleSave}
              className={cn(
                "w-full md:w-auto px-10 py-5 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                selectedUser 
                  ? "bg-[#C88D67] text-white shadow-xl shadow-[#C88D67]/20 hover:-translate-y-1" 
                  : "bg-[#E8E2D9] text-[#8C857D] cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Check size={18} />
                  Authorize Deployment
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
