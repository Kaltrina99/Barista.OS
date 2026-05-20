import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, AlertCircle, Package } from 'lucide-react';
import { InventoryItem } from '../../../types';

interface RequisitionQueueProps {
  inventory: InventoryItem[];
  onManualRestock: (itemId: string, quantity: number, supplier: string) => void;
}

export const RequisitionQueue: React.FC<RequisitionQueueProps> = ({
  inventory,
  onManualRestock
}) => {
  const criticalItems = inventory.filter(i => i.quantity <= 0);
  const lowStockItems = inventory.filter(i => i.quantity > 0 && i.quantity <= i.threshold);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-12"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-serif text-[#C88D67] italic lowercase leading-tight">replenishment queue.</h2>
          <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-[0.2em] mt-3">Logistics Prioritization • {inventory.filter(i => i.quantity <= i.threshold).length} Active Depletions</p>
        </div>
      </header>

      <div className="space-y-12">
        {/* Critical Depletion (Zero) */}
        {criticalItems.length > 0 && (
          <section>
            <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Immediate Depletion
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {criticalItems.map(item => (
                <motion.div 
                  layout
                  key={item.id}
                  className="bg-white border border-red-200 p-8 rounded-[40px] shadow-sm flex flex-col justify-between group transition-all hover:shadow-xl hover:border-red-400"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                      <ShoppingBag size={28} />
                    </div>
                    <span className="text-[10px] font-black text-white bg-red-500 px-3 py-1.5 rounded-full uppercase tracking-widest">Out of Stock</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-serif text-[#2D2A26] italic lowercase mb-2">{item.name}.</h4>
                    <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest mb-6">Source: {item.supplier || 'Unassigned'}</p>
                    <button 
                      onClick={() => onManualRestock(item.id, 10, item.supplier || '')}
                      className="w-full py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                    >
                      Dispatch Order
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Level Warning (Below threshold but above zero) */}
        {lowStockItems.length > 0 && (
          <section>
            <h3 className="text-[10px] font-black text-[#C88D67] uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C88D67]" />
              Safety Margin Warnings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lowStockItems.map(item => (
                <motion.div 
                  layout
                  key={item.id}
                  className="bg-white border border-[#F0EBE4] p-8 rounded-[40px] shadow-sm flex flex-col justify-between group transition-all hover:shadow-lg hover:border-[#C88D67]/30"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#FDFBF9] border border-[#F0EBE4] flex items-center justify-center text-[#C88D67]">
                      <AlertCircle size={28} />
                    </div>
                    <span className="text-[10px] font-black text-[#C88D67] bg-[#FDFBF9] border border-[#FCEEE0] px-3 py-1.5 rounded-full uppercase tracking-widest">Low Stock</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-serif text-[#2D2A26] italic lowercase mb-1">{item.name}.</h4>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-3xl font-mono font-bold text-[#2D2A26]">{item.quantity}</span>
                      <span className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest">/ limit {item.threshold} {item.unit}</span>
                    </div>
                    <button 
                      onClick={() => onManualRestock(item.id, Math.max(1, item.threshold * 2), item.supplier || '')}
                      className="w-full py-4 bg-[#C88D67] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#C88D67]/20 hover:bg-[#B57C5A] transition-all active:scale-95"
                    >
                      Procure Surplus
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {criticalItems.length === 0 && lowStockItems.length === 0 && (
          <div className="py-40 text-center">
            <div className="w-24 h-24 rounded-full bg-[#F9F8F6] flex items-center justify-center mx-auto mb-8 border border-[#E8E2D9]">
              <Package size={40} className="text-[#5A5A40] opacity-20" />
            </div>
            <h3 className="font-serif text-3xl text-[#5A5A40] italic mb-4">Stock Integrity Maintained.</h3>
            <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-[0.2em]">All assets are currently above safety thresholds</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
