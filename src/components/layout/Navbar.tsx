import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { PlusCircle, MinusCircle, UserCheck, Search, Users, LogOut, Zap } from 'lucide-react';
import { BizFlowLogo } from '../common/BizFlowLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRecordSale: () => void;
  onOpenRecordExpense: () => void;
  onOpenSearch: () => void;
  onOpenLogin?: () => void;
  onOpenCashierSwitch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRecordSale,
  onOpenRecordExpense,
  onOpenSearch,
  onOpenLogin,
  onOpenCashierSwitch,
}) => {
  const { business, currentUser, setCurrentUser, users, logout } = useBusiness();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'sales', label: 'Sales' },
    { id: 'products', label: 'Products' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'customers', label: 'Customers' },
    { id: 'reports', label: 'Reports' },
    { id: 'plan', label: 'Plan & Usage' },
    { id: 'settings', label: 'Settings' },
  ];

  const isLinkActive = (id: string) => {
    if (activeTab === id) return true;
    if (id === 'expenses' && ['recurring', 'payables', 'reconciliation'].includes(activeTab)) return true;
    if (id === 'reports' && activeTab === 'ledger') return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: BizFlow Application Branding & Smartcore ICT Centre Business Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left group flex items-center gap-2 cursor-pointer focus:outline-hidden"
            title="BizFlow Dashboard"
          >
            {business.logoUrl ? (
              <div className="flex items-center gap-2.5">
                <img
                  src={business.logoUrl}
                  alt={business.name || 'Business Logo'}
                  className="h-8 max-w-[130px] object-contain rounded-md"
                />
                <div className="hidden sm:flex flex-col pl-2 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {business.name || 'Smartcore ICT Centre'}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                    Workspace
                  </span>
                </div>
              </div>
            ) : (
              <>
                <BizFlowLogo size="md" />
                <div className="hidden sm:flex flex-col pl-2 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {business.name || 'Smartcore ICT Centre'}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                    Workspace
                  </span>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map(link => {
            const isActive = isLinkActive(link.id);
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#4C0196] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Action Buttons, Theme Toggle & Role Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Dark Mode Toggle Button */}
          <ThemeToggle variant="button" />

          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-transparent dark:border-slate-700"
            title="Global Search across customers, sales, expenses, inventory (Ctrl+K or /)"
          >
            <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300">Search</span>
            <kbd className="hidden md:inline text-[9px] bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 px-1 py-0.2 rounded border border-slate-300 dark:border-slate-700 font-mono">
              /
            </kbd>
          </button>

          {/* Quick Expense */}
          <button
            onClick={onOpenRecordExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7B001C] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
            title="Record Outgoing Expense"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expense</span>
          </button>

          {/* Quick Sale (Dominant Action) */}
          <button
            onClick={onOpenRecordSale}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg shadow-xs transition-all cursor-pointer"
            title="Record Customer Sale or Enrollment"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Sale</span>
          </button>

          {/* User Role Switcher Dropdown & Login Trigger */}
          <div className="relative ml-1 pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={currentUser.id}
                onChange={e => {
                  const selected = users.find(u => u.id === e.target.value);
                  if (selected) setCurrentUser(selected);
                }}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-hidden cursor-pointer"
                title="Switch active user role to test RBAC"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-900 dark:text-white">
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Switcher Button - Replaces old Login door-in icon */}
            {(onOpenCashierSwitch || onOpenLogin) && (
              <button
                onClick={() => {
                  if (onOpenCashierSwitch) {
                    onOpenCashierSwitch();
                  } else if (onOpenLogin) {
                    onOpenLogin();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#4C0196] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                title="Switch Account / Cashier"
                aria-label="Switch Account / Cashier"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Switch Cashier</span>
              </button>
            )}

            {/* Clear touch-target spacing between switch button and logout button to prevent accidental terminations */}
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
              title="Sign out and lock workspace"
              aria-label="Sign out and lock workspace"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
