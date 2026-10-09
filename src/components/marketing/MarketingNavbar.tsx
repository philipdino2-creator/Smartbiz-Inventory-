import React, { useState, useEffect } from 'react';
import { BizFlowLogo } from '../common/BizFlowLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { useBusiness } from '../../context/BusinessContext';
import { Link, useRouter } from '../../context/RouterContext';
import {
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Sparkles,
} from 'lucide-react';

export const MarketingNavbar: React.FC = () => {
  const { isAuthenticated } = useBusiness();
  const { path, navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/faq', label: 'FAQs' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 dark:border-slate-800/80 py-3'
          : 'bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4C0196] rounded-xl p-1"
            aria-label="BizFlow Home"
          >
            <BizFlowLogo size="sm" showWordmark />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
            {navLinks.map(link => {
              const isActive = path === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-[#4C0196] dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs & Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            <ThemeToggle variant="segmented" />

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/app')}
                className="flex items-center gap-2 px-4 py-2 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4C0196]"
                title="Go to your authenticated BizFlow workspace"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#4C0196] dark:hover:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4C0196]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Get Started Free</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle variant="switch" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-[65px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5" aria-label="Mobile Navigation">
            {navLinks.map(link => {
              const isActive = path === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-[#4C0196] dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/app');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#4C0196] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#4C0196] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started Free</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
