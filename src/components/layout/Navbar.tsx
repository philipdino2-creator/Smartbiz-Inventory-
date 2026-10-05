import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { PlusCircle, MinusCircle, UserCheck, Search, LogIn } from 'lucide-react';
import { BizFlowLogo } from '../common/BizFlowLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRecordSale: () => void;
  onOpenRecordExpense: () => void;
  onOpenSearch: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRecordSale,
  onOpenRecordExpense,
  onOpenSearch,
  onOpenLogin,
}) => {
  const { business, currentUser, setCurrentUser, users } = useBusiness();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'sales', label: 'Sales' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'recurring', label: 'Recurring' },
    { id: 'customers', label: 'Debtors' },
    { id: 'payables', label: 'Payables' },
    { id: 'products', label: 'Items & Services' },
    { id: 'ledger', label: 'Ledger' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: BizFlow Application Branding & Smartcore ICT Centre Business Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left group flex items-center gap-2 cursor-pointer focus:outline-hidden"
            title="BizFlow Dashboard"
          >
            <BizFlowLogo size="md" />
            <div className="hidden sm:flex flex-col pl-2 border-l border-slate-200">
              <span className="text-[11px] font-semibold text-slate-800 leading-tight">
                {business.name || 'Smartcore ICT Centre'}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                Workspace
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map(link => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#4C0196] bg-purple-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Action Buttons & Role Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            title="Global Search across customers, sales, expenses, inventory (Ctrl+K or /)"
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline text-xs font-medium text-slate-700">Search</span>
            <kbd className="hidden md:inline text-[9px] bg-white text-slate-400 px-1 py-0.2 rounded border border-slate-300 font-mono">
              /
            </kbd>
          </button>

          {/* Quick Expense */}
          <button
            onClick={onOpenRecordExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7B001C] bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
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
          <div className="relative ml-1 pl-2 border-l border-slate-200 flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={currentUser.id}
                onChange={e => {
                  const selected = users.find(u => u.id === e.target.value);
                  if (selected) setCurrentUser(selected);
                }}
                className="bg-transparent text-slate-800 text-xs font-medium focus:outline-hidden cursor-pointer"
                title="Switch active user role to test RBAC"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#4C0196] hover:bg-purple-50 transition-colors cursor-pointer"
                title="Sign in / Switch session"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
