import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { Modal } from '../../shared/Modals';
import { RestockRecord, InventoryItem } from '../../../types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface PriceHistoryModalProps {
  item: InventoryItem;
  restockHistory: RestockRecord[];
  onClose: () => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ item, restockHistory, onClose }) => {
  const priceData = useMemo(() => {
    // Filter restock history for this item
    const history = restockHistory
      .filter(record => record.itemsRestocked.some(ri => ri.name.toLowerCase() === item.name.toLowerCase()))
      .map(record => {
        const restockItem = record.itemsRestocked.find(ri => ri.name.toLowerCase() === item.name.toLowerCase());
        return {
          date: record.timestamp,
          formattedDate: format(new Date(record.timestamp), 'MMM d'),
          price: restockItem?.price || 0,
          source: record.source
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Add current price as the last point if it's different from the last restock
    if (history.length > 0 && history[history.length - 1].price !== item.price) {
      history.push({
        date: new Date().toISOString(),
        formattedDate: 'Now',
        price: item.price,
        source: 'Final Registry'
      });
    } else if (history.length === 0) {
      // If no history, just show current price
      history.push({
        date: new Date().toISOString(),
        formattedDate: 'Initial',
        price: item.price,
        source: 'Registry Entry'
      });
    }

    return history;
  }, [item, restockHistory]);

  const latestChange = useMemo(() => {
    if (priceData.length < 2) return null;
    const current = priceData[priceData.length - 1].price;
    const previous = priceData[priceData.length - 2].price;
    const diff = current - previous;
    const percent = previous !== 0 ? (diff / previous) * 100 : 0;
    return { diff, percent };
  }, [priceData]);

  return (
    <Modal onClose={onClose} title={`${item.name} cost metrics`}>
      <div className="space-y-8">
        <div className="flex items-center justify-between p-6 bg-[#F9F8F6] rounded-3xl border border-[#F0EBE4]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#5A5A40] shadow-sm">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest">Current Unit Price</p>
              <p className="text-2xl font-serif font-medium text-[#2D2A26]">${item.price.toFixed(2)}</p>
            </div>
          </div>
          {latestChange && (
            <div className="text-right">
              <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest mb-1">Latest Volatility</p>
              <div className={`flex items-center justify-end gap-1 font-bold ${latestChange.diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {latestChange.diff > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{Math.abs(latestChange.percent).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E8E2D9] rounded-[32px] p-8">
          <h4 className="text-sm font-black text-[#8C857D] uppercase tracking-[0.2em] mb-8">Supply Cost Trajectory</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#8C857D', fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#8C857D', fontWeight: 700 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#5A5A40" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#5A5A40', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <ReferenceLine y={item.price} stroke="#C88D67" strokeDasharray="3 3" label={{ value: 'Avg', position: 'right', fill: '#C88D67', fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-[#8C857D] uppercase tracking-[0.2em] ml-1">Recent Procurement Logs</h4>
          <div className="grid grid-cols-1 gap-2">
            {priceData.slice().reverse().map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#F9F8F6] rounded-2xl text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#5A5A40]" />
                  <span className="text-[#8C857D] font-medium">{p.formattedDate}</span>
                  <span className="text-[#2D2A26] font-bold italic lowercase">• {p.source}</span>
                </div>
                <span className="font-mono font-bold text-[#5A5A40]">${p.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
