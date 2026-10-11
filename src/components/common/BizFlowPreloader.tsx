import React, { useId } from 'react';
import { BizFlowIcon } from './BizFlowLogo';

export interface BizFlowPreloaderProps {
  /**
   * Preloader scale variant:
   * - 'sm': 44px icon, 88px ring
   * - 'md': 64px icon, 120px ring (default)
   * - 'lg': 80px icon, 144px ring
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the preloader covers the full viewport as a fixed overlay
   * @default true
   */
  fullScreen?: boolean;

  /**
   * Status text displayed below the logo (e.g., 'Loading workspace...', 'Initializing application...')
   */
  status?: string;

  /**
   * Whether to display the BizFlow brand wordmark
   * @default true
   */
  showWordmark?: boolean;

  /**
   * Additional custom CSS classes
   */
  className?: string;

  /**
   * Exit transition state (fades out opacity smoothly)
   * @default false
   */
  isExiting?: boolean;
}

/**
 * BizFlow Animated App Icon Preloader
 *
 * Combines:
 * 1. The official, stationary BizFlow logo with a subtle scale pulse (1.0 to 1.035).
 * 2. A thin, elegant progress ring rotating continuously around the logo with a royal purple (#4C0196)
 *    to burgundy (#7B001C) gradient accent.
 * 3. A soft, restrained ambient glow matching the brand palette.
 * 4. Responsive light and dark theme adaptation.
 * 5. Hardware-accelerated CSS animations respecting prefers-reduced-motion.
 */
export const BizFlowPreloader: React.FC<BizFlowPreloaderProps> = ({
  size = 'md',
  fullScreen = true,
  status = 'Loading workspace...',
  showWordmark = true,
  className = '',
  isExiting = false,
}) => {
  const reactId = useId().replace(/:/g, '');

  const dimensions = {
    sm: { iconPx: 44, ringSize: 88, radius: 38, strokeWidth: 2, arc: 140, gap: 100 },
    md: { iconPx: 64, ringSize: 120, radius: 52, strokeWidth: 2.5, arc: 200, gap: 127 },
    lg: { iconPx: 80, ringSize: 144, radius: 62, strokeWidth: 3, arc: 245, gap: 145 },
  }[size];

  const center = dimensions.ringSize / 2;

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-6 select-none">
      {/* Visual Anchor: Rotating Ring + Stationary Pulsing Logo + Ambient Glow */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${dimensions.ringSize}px`, height: `${dimensions.ringSize}px` }}
      >
        {/* Restrained Ambient Radial Glow */}
        <div
          className="absolute inset-0 m-auto rounded-full pointer-events-none bizflow-animate-glow"
          style={{
            width: `${dimensions.ringSize * 0.82}px`,
            height: `${dimensions.ringSize * 0.82}px`,
            background:
              'radial-gradient(circle, rgba(76, 1, 150, 0.24) 0%, rgba(123, 0, 28, 0.12) 60%, transparent 80%)',
            filter: 'blur(16px)',
          }}
          aria-hidden="true"
        />

        {/* Thin, Elegant Rotating Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full bizflow-animate-spin-ring"
          viewBox={`0 0 ${dimensions.ringSize} ${dimensions.ringSize}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`bfRingGrad-${reactId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              {/* Official Brand Palette: Royal Purple (#4C0196) to Burgundy (#7B001C) */}
              <stop offset="0%" stopColor="#4C0196" />
              <stop offset="65%" stopColor="#7B001C" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Concentric Base Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={dimensions.radius}
            stroke="currentColor"
            strokeWidth={dimensions.strokeWidth}
            className="text-slate-200/80 dark:text-slate-800/80"
          />

          {/* Rotating Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={dimensions.radius}
            stroke={`url(#bfRingGrad-${reactId})`}
            strokeWidth={dimensions.strokeWidth + 0.5}
            strokeLinecap="round"
            strokeDasharray={`${dimensions.arc} ${dimensions.gap}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>

        {/* Centerpiece: Stationary Logo with Gentle Scale Pulse */}
        <div
          className="relative z-10 flex items-center justify-center bizflow-animate-pulse-logo"
          style={{ width: `${dimensions.iconPx}px`, height: `${dimensions.iconPx}px` }}
        >
          <BizFlowIcon size={dimensions.iconPx} className="drop-shadow-sm" />
        </div>
      </div>

      {/* Brand Identity Wordmark & Context Status */}
      {showWordmark && (
        <div className="mt-5 flex flex-col items-center">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Biz<span className="text-[#4C0196] dark:text-[#A855F7]">Flow</span>
          </div>

          {status && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4C0196] dark:bg-[#A855F7] animate-pulse" />
              <span>{status}</span>
            </div>
          )}
        </div>
      )}

      {/* Screen-reader Accessible Label */}
      <span className="sr-only">{status || 'Loading BizFlow application'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC]/98 dark:bg-[#0B0F19]/98 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center transition-opacity duration-300 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${className}`}
    >
      {content}
    </div>
  );
};
