import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ArrowDownCircle,
  Users,
  Menu,
} from 'lucide-react';

interface MobileTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMoreMenu: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenMoreMenu,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: Receipt },
    { id: 'expenses', label: 'Expenses', icon: ArrowDownCircle },
    { id: 'customers', label: 'Debtors', icon: Users },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg no-print transition-colors duration-200">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] py-1 cursor-pointer transition-colors ${
                isActive
                  ? 'text-[#4C0196] dark:text-purple-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More / Menu Drawer trigger */}
        <button
          onClick={onOpenMoreMenu}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] py-1 cursor-pointer transition-colors ${
            ['payables', 'products', 'ledger', 'reports', 'settings'].includes(activeTab)
              ? 'text-[#4C0196] dark:text-purple-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[10px] font-medium tracking-tight mt-1">More</span>
        </button>
      </div>
    </div>
  );
};
