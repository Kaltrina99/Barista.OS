import React from 'react';
import { Coffee, ArrowUpRight, Camera, TrendingUp } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AuthScreenProps {
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  handleEmailAuth: (e: React.FormEvent) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleSignIn: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authMode,
  setAuthMode,
  handleEmailAuth,
  email,
  setEmail,
  password,
  setPassword,
  handleSignIn
}) => {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-6 text-[#2D2A26]">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-[#5A5A40] rounded-[32px] flex items-center justify-center text-white shadow-2xl mx-auto rotate-6">
              <Coffee size={48} />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-serif font-bold text-[#5A5A40] italic tracking-tight">Barista.OS</h1>
            <p className="text-sm text-[#8C857D] font-medium leading-relaxed max-w-[280px] mx-auto">
              The intelligent operating system for boutique cafés and coffee obsessives.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-[#E8E2D9] shadow-sm space-y-6">
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setAuthMode('login')}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all",
                authMode === 'login' ? "bg-[#5A5A40] text-white" : "bg-[#F9F8F6] text-[#8C857D]"
              )}
            >
              Log In
            </button>
            <button 
              onClick={() => setAuthMode('signup')}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all",
                authMode === 'signup' ? "bg-[#5A5A40] text-white" : "bg-[#F9F8F6] text-[#8C857D]"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#5A5A40] uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-[#F9F8F6] border border-[#E8E2D9] focus:border-[#5A5A40] outline-none transition-all text-sm"
                placeholder="name@cafe.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#5A5A40] uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-[#F9F8F6] border border-[#E8E2D9] focus:border-[#5A5A40] outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-[#5A5A40] text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-[#5A5A40]/20 hover:opacity-90 active:scale-95 transition-all"
            >
              {authMode === 'login' ? 'Initialize Hub' : 'Register Operator'}
            </button>
          </form>

          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-[#E8E2D9]"></div>
            <span className="flex-shrink mx-4 text-[8px] font-black text-[#8C857D] uppercase tracking-widest">or continue with</span>
            <div className="flex-grow border-t border-[#E8E2D9]"></div>
          </div>

          <button 
            onClick={handleSignIn}
            className="w-full bg-white border border-[#E8E2D9] text-[#2D2A26] py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#F9F8F6] active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            Identity Provider (Google)
            <ArrowUpRight size={18} />
          </button>
        </div>

        <div className="pt-8 grid grid-cols-2 gap-4 text-center">
          <div className="p-6 bg-white rounded-[32px] border border-[#E8E2D9] text-left">
            <Camera size={20} className="text-[#C88D67] mb-4" />
            <p className="text-[10px] font-black uppercase mb-1">Vision AI</p>
            <p className="text-[10px] text-[#8C857D]">pos photo auditing</p>
          </div>
          <div className="p-6 bg-white rounded-[32px] border border-[#E8E2D9] text-left">
            <TrendingUp size={20} className="text-[#5A5A40] mb-4" />
            <p className="text-[10px] font-black uppercase mb-1">Analytics</p>
            <p className="text-[10px] text-[#8C857D]">volume dynamics</p>
          </div>
        </div>
      </div>
    </div>
  );
};
