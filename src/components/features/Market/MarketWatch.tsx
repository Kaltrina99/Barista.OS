import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

interface MarketInsight {
  id: string;
  name: string;
  supplier: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  type: 'inflation' | 'discount';
}

interface MarketWatchProps {
  insights: MarketInsight[];
}

export const MarketWatch: React.FC<MarketWatchProps> = ({ insights }) => {
  return (
    <motion.div 
      key="market"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-serif text-[#5A5A40] italic lowercase">market intelligence.</h2>
          <p className="text-xs text-[#8C857D] font-bold uppercase tracking-[0.2em] mt-2">Inflation & Discount Tracking • {insights.length} Critical Changes Detected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E8E2D9] rounded-[48px] p-10 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-[100px] -mr-8 -mt-8" />
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
              <TrendingUp size={28} />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#2D2A26] italic">Inflation Watch.</h3>
              <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest mt-1">Increasing cost of supply</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {insights.filter(i => i.type === 'inflation').map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id} 
                className="p-8 bg-[#FDFBF9] border border-[#E8E2D9] rounded-[40px] flex items-center justify-between group hover:border-red-200 transition-all"
              >
                <div>
                  <p className="text-lg font-bold text-[#2D2A26] capitalize">{item.name}</p>
                  <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest mt-1">Brand: {item.supplier || 'Generic'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-red-500 flex items-center justify-end gap-1">
                    <ArrowUpRight size={18} />
                    {item.change.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-[#8C857D] font-bold">Prev: ${item.previousPrice.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
            {insights.filter(i => i.type === 'inflation').length === 0 && (
              <div className="py-20 text-center">
                <p className="text-sm text-[#8C857D] font-serif italic">No significant inflation detected in recent restocks.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D9] rounded-[48px] p-10 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-[100px] -mr-8 -mt-8" />
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-3xl bg-green-50 flex items-center justify-center text-green-600">
              <TrendingDown size={28} />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#2D2A26] italic">Cost Opportunities.</h3>
              <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest mt-1">Reduced acquisition costs</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {insights.filter(i => i.type === 'discount').map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id} 
                className="p-8 bg-[#FDFBF9] border border-[#E8E2D9] rounded-[40px] flex items-center justify-between group hover:border-green-200 transition-all"
              >
                <div>
                  <p className="text-lg font-bold text-[#2D2A26] capitalize">{item.name}</p>
                  <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest mt-1">Brand: {item.supplier || 'Generic'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-green-600 flex items-center justify-end gap-1">
                    <TrendingDown size={18} />
                    {Math.abs(item.change).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-[#8C857D] font-bold">Prev: ${item.previousPrice.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
            {insights.filter(i => i.type === 'discount').length === 0 && (
              <div className="py-20 text-center">
                <p className="text-sm text-[#8C857D] font-serif italic">No recent price drops recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
