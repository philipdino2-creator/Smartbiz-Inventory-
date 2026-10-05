import React from 'react';
import { useTheme, ThemePreference } from '../../context/ThemeContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'button' | 'segmented' | 'cards' | 'switch';
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = '',
  showLabels = false,
}) => {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  // 1. Compact Icon Button (for Navbar & Mobile Header)
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200'
            : 'bg-white border-slate-200 text-slate-600 hover:text-[#4C0196] hover:bg-purple-50 hover:border-purple-200'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode (Day)' : 'Switch to Dark Mode (Night)'}
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
        )}
        {showLabels && (
          <span className="text-xs font-semibold">
            {isDark ? 'Light' : 'Dark'}
          </span>
        )}
      </button>
    );
  }

  // 2. Direct Switch Toggle (Interactive Switch for Settings & Menus)
  if (variant === 'switch') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#4C0196] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
            isDark ? 'bg-[#4C0196]' : 'bg-slate-300'
          }`}
          title={isDark ? 'Turn Dark Mode OFF (Switch to Light Mode)' : 'Turn Dark Mode ON (Switch to Night Mode)'}
        >
          <span className="sr-only">Toggle dark mode</span>
          <span
            className={`pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              isDark ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-[#4C0196]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </span>
        </button>

        {showLabels && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isDark ? 'Dark Mode: ON' : 'Dark Mode: OFF'}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isDark
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#4C0196] dark:text-purple-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isDark ? 'Night Comfort' : 'Day Mode'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. Compact Segmented Control (Light / Dark / System)
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Light Mode"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#4C0196] text-white shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Dark Mode (Night)"
        >
          <Moon className="w-3.5 h-3.5 text-purple-200" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Match Device System Theme"
        >
          <Laptop className="w-3.5 h-3.5 text-slate-400" />
          <span>System</span>
        </button>
      </div>
    );
  }

  // 3. Full Settings Visual Selection Cards
  const options: Array<{
    id: ThemePreference;
    title: string;
    subtitle: string;
    icon: typeof Sun;
    previewBg: string;
    previewText: string;
  }> = [
    {
      id: 'light',
      title: 'Light Mode',
      subtitle: 'Crisp high-contrast layout optimized for bright daytime work environments.',
      icon: Sun,
      previewBg: 'bg-white border-slate-200 text-slate-900',
      previewText: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'dark',
      title: 'Dark Mode (Night)',
      subtitle: 'Deep midnight slate palette engineered for low eye strain and night shifts.',
      icon: Moon,
      previewBg: 'bg-slate-900 border-slate-700 text-slate-100',
      previewText: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'system',
      title: 'System Automatic',
      subtitle: 'Dynamically coordinates with your operating system day/night schedule.',
      icon: Laptop,
      previewBg: 'bg-gradient-to-r from-white to-slate-900 border-slate-300 text-slate-800',
      previewText: 'bg-slate-200/80 text-slate-700',
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map(opt => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'border-[#4C0196] bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-[#4C0196] shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Active Check Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#4C0196] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Header */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    opt.id === 'dark'
                      ? 'bg-purple-900/30 text-purple-400'
                      : opt.id === 'light'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{opt.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {opt.subtitle}
                </p>
              </div>

              {/* Miniature UI Card Preview */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full">
                <div
                  className={`p-2.5 rounded-xl border text-[10px] space-y-1.5 shadow-2xs ${opt.previewBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">BizFlow Preview</span>
                    <span className="font-mono text-[9px] text-[#4C0196]">₦45,000</span>
                  </div>
                  <div className={`p-1 rounded text-[9px] truncate font-medium ${opt.previewText}`}>
                    Python Bootcamp Enrollment
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Persistence Notice */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>
            Active display state: <strong className="text-slate-900 dark:text-white capitalize">{isDark ? 'Dark Night Mode' : 'Light Day Mode'}</strong>
            {theme === 'system' && ' (Following system OS)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Persists across all sessions
        </span>
      </div>
    </div>
  );
};
