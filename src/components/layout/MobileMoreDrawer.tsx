import React from 'react';
import {
  X,
  CreditCard,
  Package,
  BookOpen,
  FileText,
  Settings,
  Shield,
  RotateCcw,
  CalendarClock,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowLogo } from '../common/BizFlowLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin?: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenLogin,
}) => {
  const { business, currentUser, resetToDemoData } = useBusiness();

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'recurring',
      label: 'Recurring Expenses',
      desc: 'Subscriptions, rent, NEPA electricity, diesel & scheduled bills',
      icon: CalendarClock,
    },
    {
      id: 'payables',
      label: 'Supplier Payables',
      desc: 'Money the business owes to suppliers & vendors',
      icon: CreditCard,
    },
    {
      id: 'products',
      label: 'Items & Services',
      desc: 'Courses, tuition, physical products, inventory stock & pricing',
      icon: Package,
    },
    {
      id: 'ledger',
      label: 'Complete Cash Ledger',
      desc: 'Chronological double-entry cash flow journal & audit',
      icon: BookOpen,
    },
    {
      id: 'reports',
      label: 'Financial Reports & P&L',
      desc: 'Profit & loss statements, sales channels, debtor aging',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'Business Settings',
      desc: 'Company profile, currency, VAT rate, and team roles',
      icon: Settings,
    },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom duration-200 border-t border-slate-200 dark:border-slate-800">
        {/* Grab handle */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />

        {/* Drawer Header with BizFlow Identity */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <BizFlowLogo size="sm" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Workspace: <span className="font-semibold text-slate-800 dark:text-slate-200">{business.name || 'Smartcore ICT Centre'}</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Active User: <span className="font-medium text-slate-700 dark:text-slate-300">{currentUser.name}</span> ({currentUser.role.toUpperCase()})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Mode Switcher in Drawer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">Night &amp; Dark Mode</span>
            <span className="text-[10px] text-slate-400">Theme preference</span>
          </div>
          <ThemeToggle variant="segmented" className="w-full justify-between" />
        </div>

        {/* Menu Items */}
        <div className="space-y-1.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/70 text-[#4C0196] dark:text-purple-300 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-100 dark:bg-purple-900/50 text-[#4C0196] dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Account / Authentication row */}
        {onOpenLogin && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#4C0196] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BizFlowLogo size="xs" iconOnly />
                <span>Account &amp; Database Login / Google Sign In</span>
              </div>
              <span className="text-[10px] bg-[#4C0196] text-white px-2 py-0.5 rounded font-semibold">Switch</span>
            </button>
          </div>
        )}

        {/* Quick Demo Reset for Mobile (Owner only) */}
        {currentUser.role === 'owner' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                resetToDemoData();
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400 font-medium hover:underline py-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Records</span>
            </button>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">BizFlow v2.0</span>
          </div>
        )}
      </div>
    </div>
  );
};
