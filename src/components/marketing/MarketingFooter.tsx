import React from 'react';
import { BizFlowLogo } from '../common/BizFlowLogo';
import { Link } from '../../context/RouterContext';
import {
  ShieldCheck,
  Database,
  Lock,
  ArrowUpRight,
  Mail,
  MapPin,
  CheckCircle,
} from 'lucide-react';

export const MarketingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block" aria-label="BizFlow Home">
              <BizFlowLogo size="sm" showWordmark variant="white" />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              BizFlow is the modern business management workspace built to help small enterprises, retail counters, and digital training centres organize sales, track expenses, eliminate cash leaks, and monitor daily profitability with confidence.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <Database className="w-3 h-3 text-purple-400" />
                <span>PostgreSQL Persistence</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Isolated Multi-Tenant Security</span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-white transition-colors">
                  All Features
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Pricing &amp; Access
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Features Highlights */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Capabilities</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Instant Thermal POS Receipts</li>
              <li>Live Profit &amp; Margin Ledger</li>
              <li>Customer Debt &amp; WhatsApp Reminders</li>
              <li>Daily Drawer Cash Reconciliation</li>
              <li>Role-Based Access (Owner &amp; Staff)</li>
            </ul>
          </div>

          {/* Workspace Access */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Access Workspace</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/register"
                  className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                >
                  <span>Create Free Account</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-white transition-colors">
                  Password Recovery
                </Link>
              </li>
            </ul>

            <div className="pt-2">
              <span className="text-[11px] text-slate-500 block">Current Operating Region:</span>
              <span className="text-xs text-slate-300 font-medium">Nigeria (NGN / ₦) • Africa/Lagos</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} BizFlow Management Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>Production Live Ready</span>
            </span>
            <span className="text-slate-600">|</span>
            <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
              Staff Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
