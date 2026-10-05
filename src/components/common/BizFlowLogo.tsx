import React from 'react';

interface BizFlowLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showWordmark?: boolean;
  variant?: 'default' | 'white' | 'monochrome';
  className?: string;
  iconOnly?: boolean;
}

export const BizFlowIcon: React.FC<{ size?: number | string; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bfBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4C0196" />
          <stop offset="60%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="bfFlowWhite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="bfFlowCyan" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>

      {/* Rounded Container */}
      <rect width="512" height="512" rx="128" fill="url(#bfBgGrad)" />
      <rect
        x="10"
        y="10"
        width="492"
        height="492"
        rx="118"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.15"
        strokeWidth="6"
      />

      {/* Stylized B + Forward Momentum Ribbon */}
      <g transform="translate(116, 106)">
        {/* Vertical Spine */}
        <path
          d="M20 20 C20 9 29 0 40 0 L64 0 C75 0 84 9 84 20 L84 280 C84 291 75 300 64 300 L40 300 C29 300 20 291 20 280 Z"
          fill="url(#bfFlowWhite)"
        />

        {/* Top Loop */}
        <path
          d="M74 16 L150 16 C196 16 232 48 232 94 C232 140 196 172 150 172 L74 172 Z"
          fill="none"
          stroke="url(#bfFlowWhite)"
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bottom Flow Ribbon */}
        <path
          d="M74 144 L170 144 C222 144 264 178 264 228 C264 278 222 284 170 284 L30 284"
          fill="none"
          stroke="url(#bfFlowCyan)"
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Micro Pulse Accents */}
        <circle cx="150" cy="94" r="14" fill="#6D28D9" />
        <circle cx="170" cy="224" r="14" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const BizFlowLogo: React.FC<BizFlowLogoProps> = ({
  size = 'md',
  showWordmark = true,
  variant = 'default',
  className = '',
  iconOnly = false,
}) => {
  const pixelSizes = {
    xs: 20,
    sm: 24,
    md: 32,
    lg: 42,
    xl: 56,
    '2xl': 72,
  };

  const textSizes = {
    xs: 'text-sm font-bold tracking-tight',
    sm: 'text-base font-bold tracking-tight',
    md: 'text-lg font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
    '2xl': 'text-4xl font-black tracking-tight',
  };

  const iconPx = pixelSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <BizFlowIcon size={iconPx} className="shadow-xs hover:scale-105 transition-transform" />

      {showWordmark && !iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={`${textSizes[size]} ${
              variant === 'white'
                ? 'text-white'
                : variant === 'monochrome'
                ? 'text-slate-900'
                : 'text-slate-900'
            }`}
          >
            Biz<span className="text-[#4C0196]">Flow</span>
          </span>
        </div>
      )}
    </div>
  );
};

export const PoweredByBizFlow: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium ${className}`}>
      <span>Powered by</span>
      <BizFlowIcon size={14} />
      <span className="font-bold text-slate-700">BizFlow</span>
    </div>
  );
};
