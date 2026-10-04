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

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
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
      label: 'Courses & Products Catalog',
      desc: 'Training courses, fees, accessories, and stock levels',
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
      <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Grab handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{business.name}</h3>
            <p className="text-xs text-slate-500">
              Active User: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.role.toUpperCase()})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
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
                    ? 'bg-purple-50 text-[#4C0196] font-semibold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-100 text-[#4C0196]' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[11px] text-slate-400 font-normal">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Demo Reset for Mobile */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              resetToDemoData();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-amber-800 font-medium hover:underline py-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Records</span>
          </button>
          <span className="text-[10px] text-slate-400">Smartcore v1.0 MVP</span>
        </div>
      </div>
    </div>
  );
};
