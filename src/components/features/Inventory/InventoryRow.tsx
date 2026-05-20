import React, { memo } from 'react';
import { Package, Trash2, Edit3, AlertCircle, LineChart } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { InventoryItem } from '../../../types';

interface InventoryRowProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onViewPriceHistory: (item: InventoryItem) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const InventoryRow = memo(({ item, onEdit, onDelete, onViewPriceHistory, canEdit, canDelete }: InventoryRowProps) => {
  return (
    <div 
      className={cn(
        "p-10 bg-white border border-[#E8E2D9] rounded-[48px] hover:border-[#5A5A40] transition-all group relative overflow-hidden",
        item.quantity <= item.threshold ? "bg-red-50/30 border-red-100" : ""
      )}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-8">
          <div className={cn(
            "w-20 h-20 rounded-[32px] flex items-center justify-center transition-all group-hover:scale-105",
            item.quantity <= item.threshold ? "bg-red-100 text-red-600" : "bg-[#F9F8F6] text-[#5A5A40]"
          )}>
            <Package size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-serif text-[#2D2A26] italic lowercase">{item.name}.</h3>
              {item.quantity <= item.threshold && (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] bg-red-500 text-white px-2.5 py-1 rounded-full">
                  <AlertCircle size={10} /> Critical
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-[0.2em] mt-2">Source: {item.supplier || 'Private Selection'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-16">
          <div className="text-right">
            <p className="text-4xl font-mono font-bold text-[#2D2A26] mb-1">{item.quantity}<span className="text-lg opacity-40 ml-1">{item.unit}</span></p>
            <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest">Base: {item.threshold} {item.unit}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onViewPriceHistory(item)}
              title="Price History"
              className="w-14 h-14 rounded-3xl border border-[#E8E2D9] flex items-center justify-center text-[#C88D67] hover:border-[#C88D67] hover:text-[#C88D67] hover:bg-white transition-all bg-[#FDFBF9]"
            >
              <LineChart size={20} />
            </button>
            {canEdit && (
              <button 
                onClick={() => onEdit(item)}
                className="w-14 h-14 rounded-3xl border border-[#E8E2D9] flex items-center justify-center text-[#8C857D] hover:border-[#5A5A40] hover:text-[#5A5A40] hover:bg-white transition-all bg-[#FDFBF9]"
              >
                <Edit3 size={20} />
              </button>
            )}
            {canDelete && (
              <button 
                onClick={() => onDelete(item.id)}
                className="w-14 h-14 rounded-3xl border border-[#E8E2D9] flex items-center justify-center text-red-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all bg-[#FDFBF9]"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
