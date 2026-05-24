import React, { memo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Camera, 
  Package, 
  ArrowUpRight, 
  DollarSign, 
  AlertCircle, 
  CreditCard,
  ShoppingBag,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateSubscriptionPrice } from '../../../utils/pricing';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { CompactStat, ActionButton } from '../../shared/Stats';
import { InventoryItem } from '../../../types';
import { cn } from '../../../lib/utils';

interface OverviewProps {
  totalInventoryValue: number;
  criticalItems: InventoryItem[];
  recentRestockCost: number;
  chartData: any[];
  topItemsData: any[];
  onAction: (action: 'sales' | 'restock' | 'intel' | 'requisition') => void;
  isApproved: boolean;
  profile?: any;
}

export const Overview = memo(({ 
  totalInventoryValue, 
  criticalItems, 
  recentRestockCost, 
  chartData, 
  topItemsData, 
  onAction,
  isApproved,
  profile
}: OverviewProps) => {
  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {!isApproved && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-[32px] flex items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">!</div>
          <div>
            <h4 className="font-bold text-amber-900">Awaiting Super Admin Approval</h4>
            <p className="text-sm text-amber-700">Your account is currently in preview mode. Full feature access requires administrator verification.</p>
          </div>
        </div>
      )}

      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-md">
          <h2 className="text-5xl font-serif font-light text-brand-primary leading-tight mb-4 lowercase italic">stock oversight.</h2>
          <p className="text-sm text-[#8C857D] font-medium leading-relaxed">
            AI-powered logistics for boutique hospitality. Real-time movement tracking and predictive threshold analysis.
          </p>
          {profile && (
            (() => {
              const pricing = calculateSubscriptionPrice(profile);
              return (
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/[0.03] border border-brand-primary/15 text-[9px] text-brand-primary font-black uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span>
                    Price Plan: {pricing.isSuperAdmin ? 'Superuser Free-tier' : 
                     pricing.isFreeByConfig ? 'Gifted Waiver ($0.00/mo)' : `Active features package ($${pricing.total.toFixed(2)}/mo)`}
                  </span>
                </div>
              );
            })()
          )}
        </div>
        <div className="flex items-center gap-6">
          {criticalItems.length > 0 && (
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 relative cursor-pointer"
              onClick={() => onAction('requisition')}
            >
              <Bell size={24} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {criticalItems.length}
              </span>
            </motion.div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <CompactStat 
          title="Inventory Value" 
          value={`$${totalInventoryValue.toLocaleString()}`} 
          label="Asset Worth" 
          icon={<DollarSign size={16}/>}
          trend="Real-time evaluation"
          color="accent"
        />
        <CompactStat 
          title="Alert Status" 
          value={criticalItems.length} 
          label="Critical Items" 
          icon={<AlertCircle size={16}/>}
          trend="Needs immediate scan"
          color="danger"
        />
        <CompactStat 
          title="Historical Outflow" 
          value={`$${recentRestockCost.toLocaleString()}`} 
          label="Total Spent" 
          icon={<CreditCard size={16}/>}
          trend="Log aggregate"
          color="warm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <ActionButton 
          onClick={() => onAction('sales')}
          title="Daily Outflow Scan"
          label="Audit POS photos"
          icon={<Camera size={28} />}
        />
        <ActionButton 
          onClick={() => onAction('restock')}
          title="Restock Intake"
          label="Audit delivery notes"
          icon={<TrendingUp size={28} />}
        />
        <ActionButton 
          onClick={() => onAction('intel')}
          title="Resource Intel"
          label="Identify products"
          icon={<Package size={28} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white border border-[#E8E2D9] rounded-[40px] p-8 shadow-sm group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h4 className="font-serif text-xl text-brand-primary mb-1 italic">Volume Dynamics</h4>
              <p className="text-[10px] text-[#8C857D] uppercase tracking-[0.2em] font-black">7-Day Trajectory</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E8E2D9" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#8C857D', fontWeight: 700 }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="units" 
                  stroke="var(--primary-accent)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorUnits)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-brand-secondary/5 border border-brand-secondary/10 rounded-[40px] p-8 shadow-sm flex flex-col h-full text-brand-secondary">
          <h4 className="font-serif text-xl text-brand-primary mb-8 italic lowercase">Popular Demand</h4>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItemsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--secondary-accent)" strokeOpacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--primary-accent)', fontWeight: 800, textTransform: 'uppercase' }}
                  width={90}
                />
                <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} contentStyle={{ borderRadius: '16px' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {topItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--secondary-accent)' : 'var(--primary-accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {criticalItems.length > 0 && (
        <div className="bg-white border border-red-100 rounded-[40px] p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-[100px] -mr-8 -mt-8" />
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#2D2A26] italic">Immediate Scalability Risks.</h3>
              <p className="text-[10px] text-[#8C857D] font-black uppercase tracking-widest mt-1">Found {criticalItems.length} assets below safety margin</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalItems.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-6 bg-[#FDFBF9] border border-[#E8E2D9] rounded-[32px] flex items-center justify-between hover:border-red-200 transition-all cursor-pointer"
                onClick={() => onAction('requisition')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-center text-[#5A5A40]">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#2D2A26] italic lowercase">{item.name}</h5>
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{item.quantity} {item.unit} remaining</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-[#8C857D] group-hover:text-[#C88D67] transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});
