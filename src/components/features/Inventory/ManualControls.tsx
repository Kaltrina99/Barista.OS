import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ShoppingBag, X } from 'lucide-react';
import { Modal, InputGroup } from '../../shared/Modals';
import { InventoryItem, UserProfile } from '../../../types';

interface ManualControlsProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (b: boolean) => void;
  isRestockOpen: boolean;
  setIsRestockOpen: (b: boolean) => void;
  isSaleOpen: boolean;
  setIsSaleOpen: (b: boolean) => void;
  inventory: InventoryItem[];
  manualRestock: { itemId: string; quantity: number };
  setManualRestock: (v: { itemId: string; quantity: number }) => void;
  manualSale: { itemId: string; quantity: number };
  setManualSale: (v: { itemId: string; quantity: number }) => void;
  restockSource: string;
  setRestockSource: (v: string) => void;
  handleManualRestock: (e: React.FormEvent) => void;
  handleManualSale: (e: React.FormEvent) => void;
  handleSignOut: () => void;
  userEmail?: string | null;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
}

export const ManualControls: React.FC<ManualControlsProps> = ({
  isMenuOpen,
  setIsMenuOpen,
  isRestockOpen,
  setIsRestockOpen,
  isSaleOpen,
  setIsSaleOpen,
  inventory,
  manualRestock,
  setManualRestock,
  manualSale,
  setManualSale,
  restockSource,
  setRestockSource,
  handleManualRestock,
  handleManualSale,
  handleSignOut,
  userEmail,
  profile,
  isSuperAdmin
}) => {
  const canRestock = isSuperAdmin || profile?.permissions?.canProcessRestocks;
  const canSale = isSuperAdmin || profile?.permissions?.canProcessSales;
  return (
    <>
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-[#2D2A26]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-white rounded-t-[48px] p-8 relative z-10 shadow-2xl space-y-6"
            >
              <div className="w-12 h-1.5 bg-[#E8E2D9] rounded-full mx-auto mb-4" />
              <h3 className="font-serif text-3xl text-[#5A5A40] italic mb-6">Quick Controls</h3>
              <div className="grid grid-cols-2 gap-4">
                {canRestock && (
                <button 
                  onClick={() => { setIsRestockOpen(true); setIsMenuOpen(false); }}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-[#F9F8F6] rounded-[32px] border border-[#E8E2D9]"
                >
                  <TrendingUp size={24} className="text-[#C88D67]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#C88D67]">Restock</span>
                </button>
                )}
                {canSale && (
                <button 
                  onClick={() => { setIsSaleOpen(true); setIsMenuOpen(false); }}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-[#F9F8F6] rounded-[32px] border border-[#E8E2D9]"
                >
                  <ShoppingBag size={24} className="text-[#5A5A40]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">Sale</span>
                </button>
                )}
                <button 
                  onClick={handleSignOut}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-red-50 rounded-[32px] border border-red-100 col-span-2"
                >
                  <X size={24} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Logout</span>
                </button>
                {userEmail && (
                  <div className="col-span-2 mt-4 text-center">
                    <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest font-mono">Operator: {userEmail}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C857D] border-t border-[#F5F5F0] pt-8"
              >
                Return to active dashboard
              </button>
            </motion.div>
          </div>
        )}

        {isRestockOpen && (
          <Modal onClose={() => setIsRestockOpen(false)} title="Manual Restock Intake" color="#C88D67">
            <form onSubmit={handleManualRestock} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#C88D67] uppercase tracking-widest ml-1">Select Arrival Item</label>
                <select 
                  required
                  value={manualRestock.itemId}
                  onChange={(e) => setManualRestock({ ...manualRestock, itemId: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-[#F9F8F6] border border-[#E8E2D9] text-[#2D2A26] focus:border-[#C88D67] outline-none transition-all text-sm font-medium appearance-none"
                >
                  <option value="">Choose item...</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit} in stock)</option>
                  ))}
                </select>
              </div>
              <InputGroup 
                label="Incoming Quantity" 
                value={manualRestock.quantity.toString()} 
                onChange={v => setManualRestock({...manualRestock, quantity: parseInt(v) || 0})} 
                type="number" 
              />
              <InputGroup 
                label="Source / Supplier" 
                value={restockSource} 
                onChange={setRestockSource} 
                placeholder="e.g. Origin Coffee, Local Market" 
              />
              <button type="submit" className="w-full bg-[#C88D67] text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-[#C88D67]/20">Commit Arrival</button>
            </form>
          </Modal>
        )}

        {isSaleOpen && (
          <Modal onClose={() => setIsSaleOpen(false)} title="Manual Sales Entry">
            <form onSubmit={handleManualSale} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5A5A40] uppercase tracking-widest ml-1">Select Resource</label>
                <select 
                  required
                  value={manualSale.itemId}
                  onChange={(e) => setManualSale({ ...manualSale, itemId: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-[#F9F8F6] border border-[#E8E2D9] text-[#5A5A40] focus:border-[#5A5A40] outline-none transition-all text-sm font-medium appearance-none"
                >
                  <option value="">Choose item...</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit} left)</option>
                  ))}
                </select>
              </div>
              <InputGroup 
                label="Quantity Outflow" 
                value={manualSale.quantity.toString()} 
                onChange={v => setManualSale({...manualSale, quantity: parseInt(v) || 0})} 
                type="number" 
              />
              <button type="submit" className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl">Apply Deduction</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};
