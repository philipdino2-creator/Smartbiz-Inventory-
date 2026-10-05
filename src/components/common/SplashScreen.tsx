import React from 'react';
import { BizFlowIcon } from './BizFlowLogo';

interface SplashScreenProps {
  businessName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ businessName = 'Smartcore ICT Centre' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white selection:bg-purple-500 selection:text-white">
      <div className="flex flex-col items-center text-center p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
        {/* Animated BizFlow Logo */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-purple-600/30 rounded-3xl blur-xl animate-pulse" />
          <BizFlowIcon size={88} className="relative drop-shadow-2xl" />
        </div>

        {/* Application Name (No Tagline!) */}
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Biz<span className="text-purple-400">Flow</span>
        </h1>

        {/* Active Business Context */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{businessName}</span>
        </div>

        {/* Loading Indicator */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 rounded-full animate-indeterminate" />
        </div>
        <p className="text-xs text-slate-400 font-mono">Initializing application...</p>
      </div>
    </div>
  );
};
