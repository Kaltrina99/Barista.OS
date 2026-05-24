import React, { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Download, Package, Clock, X } from 'lucide-react';
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

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('inventory_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const deleteSearch = (termToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToDelete);
      try {
        localStorage.setItem('inventory_recent_searches', JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
      return updated;
    });
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentSearches([]);
    try {
      localStorage.removeItem('inventory_recent_searches');
    } catch (err) {
      console.warn(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveSearch(searchTerm);
      setShowDropdown(false);
    }
  };

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
          <h2 className="text-4xl font-serif text-brand-primary italic">Warehouse Audit.</h2>
          <div className="flex gap-4 mt-2">
            <p className="text-xs text-[#8C857D] font-bold uppercase tracking-[0.2em]">Active Inventory Ledger • {inventoryCount} Items In Stock</p>
            <button 
              onClick={handleExportInventory}
              className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline flex items-center gap-1"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>
        <div ref={containerRef} className="relative w-full md:w-80">
          <div className="relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8C857D] group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search logistics..."
              value={searchTerm}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E8E2D9] rounded-[24px] pl-14 pr-6 py-4 text-sm font-medium focus:border-brand-primary outline-none transition-all shadow-sm"
            />
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white border border-[#E8E2D9] rounded-[28px] shadow-xl z-50 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#8C857D]">Recent Searches</span>
                    {recentSearches.length > 0 && (
                      <button 
                        onClick={clearAll}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {recentSearches.length > 0 ? (
                    <div className="space-y-1">
                      {recentSearches.map((term, index) => (
                        <div 
                          key={`${term}-${index}`}
                          onClick={() => {
                            setSearchTerm(term);
                            saveSearch(term);
                            setShowDropdown(false);
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl cursor-pointer hover:bg-[#F9F8F6] transition-all group"
                        >
                          <div className="flex items-center gap-3 text-sm text-[#2D2A26] font-medium">
                            <Clock size={14} className="text-[#8C857D] group-hover:text-brand-primary transition-colors" />
                            <span>{term}</span>
                          </div>
                          <button 
                            onClick={(e) => deleteSearch(term, e)}
                            className="p-1 rounded-full text-[#8C857D] hover:text-[#2D2A26] hover:bg-[#E8E2D9]/40 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-[#8C857D] italic">
                      No recent searches recorded. Press Enter to store after typing.
                    </div>
                  )}

                  {/* Suggest common items quick search if inventory exists */}
                  {filteredInventory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#F5F5F0]">
                      <span className="text-[10px] font-black tracking-widest uppercase text-[#8C857D] px-1 block mb-3">Trending Stocks</span>
                      <div className="flex flex-wrap gap-2 px-1">
                        {Array.from(new Set(filteredInventory.map(item => item.name))).slice(0, 3).map((name, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchTerm(name);
                              saveSearch(name);
                              setShowDropdown(false);
                            }}
                            className="px-3 py-1.5 bg-[#F9F8F6] hover:bg-brand-primary/10 border border-[#E8E2D9]/60 hover:border-brand-primary/30 text-[#2D2A26] hover:text-brand-primary text-xs rounded-full font-medium transition-all"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-[40px] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F5F5F0]">
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item, idx) => (
              <InventoryRow 
                key={`${item.id}-${idx}`} 
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
