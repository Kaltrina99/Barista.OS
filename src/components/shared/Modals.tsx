import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  color?: string;
}

export const Modal: React.FC<ModalProps> = ({ onClose, title, children, color = "#5A5A40" }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#2D2A26]/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 1, y: '100%' }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] md:rounded-[56px] shadow-[0_32px_64px_-16px_rgba(45,42,38,0.3)] relative z-10 border-t sm:border border-[#E8E2D9] max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="p-8 sm:p-14 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="pr-4">
              <h3 className="text-2xl md:text-4xl font-serif italic lowercase tracking-tight leading-tight mb-2" style={{ color }}>{title}.</h3>
              <div className="h-1 w-8 md:w-12 bg-[#F0EBE4] rounded-full" />
            </div>
            <button 
              onClick={onClose} 
              className="w-12 h-12 flex-shrink-0 rounded-full bg-[#F9F8F6] flex items-center justify-center text-[#8C857D] hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all duration-300"
            >
              <X size={24} />
            </button>
          </div>
          <div className="relative">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const InputGroup: React.FC<{
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ label, value, onChange, placeholder, type = "text" }) => {
  return (
    <div className="space-y-3 group">
      <label className="text-[10px] font-black text-[#8C857D] uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within:text-[#5A5A40]">{label}</label>
      <div className="relative">
        <input 
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-7 py-5 rounded-3xl bg-[#F9F8F6] border border-[#F0EBE4] focus:bg-white focus:border-[#5A5A40] focus:shadow-[0_8px_20px_-8px_rgba(90,90,64,0.1)] outline-none transition-all text-sm font-semibold text-[#2D2A26] placeholder:text-[#8C857D]/40"
        />
      </div>
    </div>
  );
};
