import React from 'react';
import { motion } from 'motion/react';
import { Search, Download, History, CheckCircle2, Plus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';
import { StockHistory } from './StockHistory';

interface AuditLedgerProps {
  auditType: 'sales' | 'restocks' | 'stock';
  setAuditType: (t: 'sales' | 'restocks' | 'stock') => void;
  filteredHistory: any[];
  searchHistoryTerm: string;
  setSearchHistoryTerm: (s: string) => void;
  handleExportAudit: () => void;
  setIsClearingHistory: (b: boolean) => void;
  loadMoreHistory: () => void;
  isHistoryLoadingMore: boolean;
  hasMore: boolean;
  stockHistory?: any[]; // Added for stock view
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({
  auditType,
  setAuditType,
  filteredHistory,
  searchHistoryTerm,
  setSearchHistoryTerm,
  handleExportAudit,
  setIsClearingHistory,
  loadMoreHistory,
  isHistoryLoadingMore,
  hasMore,
  stockHistory = []
}) => {
  return (
    <motion.div 
      key="history"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-serif text-[#5A5A40] italic lowercase">audit history.</h2>
          <div className="flex flex-wrap gap-4 mt-6">
            <button 
              onClick={() => setAuditType('sales')}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all",
                auditType === 'sales' ? "bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20" : "bg-white text-[#8C857D] border border-[#E8E2D9]"
              )}
            >
              Outflow (Sales)
            </button>
            <button 
              onClick={() => setAuditType('restocks')}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all",
                auditType === 'restocks' ? "bg-[#C88D67] text-white shadow-lg shadow-[#C88D67]/20" : "bg-white text-[#8C857D] border border-[#E8E2D9]"
              )}
            >
              Inflow (Restocks)
            </button>
            <button 
              onClick={() => setAuditType('stock')}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all",
                auditType === 'stock' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white text-[#8C857D] border border-[#E8E2D9]"
              )}
            >
              Stock Lifecycle
            </button>
            {filteredHistory.length > 0 && auditType !== 'stock' && (
              <div className="flex gap-4">
                <button 
                  onClick={handleExportAudit}
                  className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border border-[#E8E2D9] text-[#5A5A40] hover:bg-[#F9F8F6] flex items-center gap-2"
                >
                  <Download size={12} /> Export Excel (CSV)
                </button>
                <button 
                  onClick={() => setIsClearingHistory(true)}
                  className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all text-red-500 hover:bg-red-50"
                >
                  Clear All {auditType === 'sales' ? 'Sales' : 'Restocks'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8C857D] group-focus-within:text-[#5A5A40] transition-colors" />
          <input 
            type="text" 
            placeholder={auditType === 'sales' ? "Search transactions..." : "Search suppliers or items..."}
            value={searchHistoryTerm}
            onChange={(e) => setSearchHistoryTerm(e.target.value)}
            className="w-full bg-white border border-[#E8E2D9] rounded-[24px] pl-14 pr-6 py-4 text-sm font-medium focus:border-[#5A5A40] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className={cn(auditType === 'stock' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6")}>
        {auditType === 'stock' ? (
          <StockHistory history={stockHistory} isLoading={isHistoryLoadingMore} />
        ) : (
          filteredHistory.map((record: any) => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={record.id} 
              className="bg-white border border-[#E8E2D9] p-8 rounded-[40px] shadow-sm hover:border-[#5A5A40] transition-all cursor-default relative overflow-hidden"
            >
              <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] -mr-4 -mt-4", auditType === 'sales' ? "bg-[#5A5A40]/5" : "bg-[#C88D67]/5")} />
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl bg-[#FDFBF9] border border-[#E8E2D9] flex items-center justify-center", auditType === 'sales' ? "text-[#5A5A40]" : "text-[#C88D67]")}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest">{format(new Date(record.timestamp), 'MMM d, yyyy')}</p>
                    <p className="text-sm font-mono font-bold text-[#5A5A40]">{format(new Date(record.timestamp), 'HH:mm:ss')}</p>
                  </div>
                </div>
                {(record.totalValue || record.totalCost) && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest">{auditType === 'sales' ? 'Impact' : 'Expense'}</p>
                    <p className={cn("text-sm font-bold", auditType === 'sales' ? "text-[#C88D67]" : "text-[#5A5A40]")}>
                      ${(record.totalValue || record.totalCost || 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              {auditType === 'restocks' && (
                <div className="mb-4">
                   <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest mb-1">Source</p>
                   <p className="text-xs font-bold text-[#C88D67] italic capitalize">{record.source || 'Unknown'}</p>
                </div>
              )}

              <div className="space-y-3 mb-8">
                {(record.itemsSold || record.itemsRestocked).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-[#8C857D] font-medium capitalize">{item.name}</span>
                      {item.price && <span className="text-[10px] text-[#8C857D] opacity-60">@ ${item.price}/unit</span>}
                    </div>
                    <span className={cn("font-mono font-bold", auditType === 'sales' ? "text-red-500" : "text-green-600")}>
                      {auditType === 'sales' ? '-' : '+'}{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-[#F5F5F0] flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8C857D]">System Sync</span>
                <span className={cn("text-xs font-bold bg-[#5A5A40]/5 px-3 py-1 rounded-full italic", auditType === 'sales' ? "text-[#5A5A40]" : "text-[#C88D67]")}>verified</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {filteredHistory.length === 0 && (
        <div className="p-20 bg-white border border-[#E8E2D9] rounded-[40px] text-center">
           <div className="w-16 h-16 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8C857D]">
             <History size={24} />
           </div>
           <p className="text-[#8C857D] font-serif italic">No logs matched your criteria.</p>
        </div>
      )}

      {hasMore && !searchHistoryTerm && (
        <div className="flex justify-center pt-8 pb-12">
          <button 
            onClick={loadMoreHistory}
            disabled={isHistoryLoadingMore}
            className="px-10 py-5 bg-white border border-[#E8E2D9] rounded-2xl text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest hover:border-[#5A5A40] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isHistoryLoadingMore ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
            Load Older Audit Logs
          </button>
        </div>
      )}
    </motion.div>
  );
};
