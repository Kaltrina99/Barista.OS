import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Search, Download, Package } from 'lucide-react';
import { InventoryRow } from './InventoryRow';
import { InventoryItem, UserProfile } from '../../../types';

interface SupplyGridProps {
  filteredInventory: InventoryItem[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  handleExportInventory: () => void;
  setEditingItem: (item: InventoryItem) => void;
  handleDeleteItem: (id: string) => void;
  onViewPriceHistory: (item: InventoryItem) => void;
  inventoryCount: number;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
}

export const SupplyGrid = memo(({
  filteredInventory,
  searchTerm,
  setSearchTerm,
  handleExportInventory,
  setEditingItem,
  handleDeleteItem,
  onViewPriceHistory,
  inventoryCount,
  profile,
  isSuperAdmin
}: SupplyGridProps) => {
  const canEdit = isSuperAdmin || profile?.permissions?.canEditItems;
  const canDelete = isSuperAdmin || profile?.permissions?.canDeleteItems;
  return (
    <motion.div 
      key="inventory"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-serif text-[#5A5A40] italic">Warehouse Audit.</h2>
          <div className="flex gap-4 mt-2">
            <p className="text-xs text-[#8C857D] font-bold uppercase tracking-[0.2em]">Active Inventory Ledger • {inventoryCount} Items In Stock</p>
            <button 
              onClick={handleExportInventory}
              className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40] hover:underline flex items-center gap-1"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8C857D] group-focus-within:text-[#5A5A40] transition-colors" />
          <input 
            type="text" 
            placeholder="Search logistics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E8E2D9] rounded-[24px] pl-14 pr-6 py-4 text-sm font-medium focus:border-[#5A5A40] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-[40px] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F5F5F0]">
          {filteredInventory.length > 0 ? (
            filteredInventory.map(item => (
              <InventoryRow 
                key={item.id} 
                item={item} 
                onEdit={setEditingItem} 
                onDelete={handleDeleteItem} 
                onViewPriceHistory={onViewPriceHistory}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8C857D]">
                <Package size={24} />
              </div>
              <p className="text-[#8C857D] font-serif italic">{searchTerm ? "No matches found in register." : "No active stock found."}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
