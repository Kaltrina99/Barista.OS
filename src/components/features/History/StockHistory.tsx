import React from 'react';
import { motion } from 'motion/react';
import { History, ArrowRightLeft, PlusCircle, MinusCircle, AlertCircle, Trash2, PackagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { StockHistoryRecord } from '../../../types';
import { cn } from '../../../lib/utils';

interface StockHistoryProps {
  history: StockHistoryRecord[];
  isLoading: boolean;
}

export const StockHistory: React.FC<StockHistoryProps> = ({ history, isLoading }) => {
  const getReasonIcon = (reason: StockHistoryRecord['reason']) => {
    switch (reason) {
      case 'sale': return <MinusCircle className="text-red-500" size={18} />;
      case 'restock': return <PackagePlus className="text-green-600" size={18} />;
      case 'manual_adjustment': return <ArrowRightLeft className="text-blue-500" size={18} />;
      case 'creation': return <PlusCircle className="text-emerald-500" size={18} />;
      case 'deletion': return <Trash2 className="text-red-600" size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  const getReasonLabel = (reason: StockHistoryRecord['reason']) => {
    return reason.replace(/_/g, ' ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <History className="animate-spin text-[#5A5A40] opacity-20" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((record) => (
        <motion.div 
          layout
          key={record.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8E2D9] p-6 rounded-[32px] flex items-center justify-between group hover:border-[#5A5A40] transition-all"
        >
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-[#F9F8F6] flex items-center justify-center border border-[#E8E2D9]">
              {getReasonIcon(record.reason)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="font-bold text-[#2D2A26] capitalize">{record.itemName}</h4>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[#F9F8F6] text-[#8C857D] border border-[#E8E2D9]">
                  {getReasonLabel(record.reason)}
                </span>
              </div>
              <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest mt-1">
                {format(new Date(record.timestamp), 'MMM d, HH:mm:ss')} • ID: {record.itemId.substring(0, 6)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-3">
              <span className={cn(
                "font-mono font-bold text-lg",
                record.change > 0 ? "text-green-600" : "text-red-500"
              )}>
                {record.change > 0 ? '+' : ''}{record.change}
              </span>
              <div className="h-4 w-[1px] bg-[#E8E2D9]" />
              <div className="text-left min-w-[60px]">
                <p className="text-[8px] font-black text-[#8C857D] uppercase tracking-tighter">New Stock</p>
                <p className="text-xs font-mono font-bold text-[#5A5A40]">{record.newQuantity}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {history.length === 0 && (
        <div className="p-20 text-center bg-white border border-[#E8E2D9] rounded-[40px]">
          <History className="mx-auto mb-4 text-[#8C857D] opacity-20" size={32} />
          <p className="text-[#8C857D] italic font-serif">No stock lifecycle records found.</p>
        </div>
      )}
    </div>
  );
};
