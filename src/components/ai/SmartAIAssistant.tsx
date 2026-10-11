import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowIcon } from '../common/BizFlowLogo';
import {
  Sparkles,
  X,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Send,
  MessageSquare,
  DollarSign,
  Package,
  Users,
  Clock,
  CheckCircle2,
  Share2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  FileText,
} from 'lucide-react';
import { Customer, Sale, ProductService } from '../../types';

interface SmartAIAssistantProps {
  onOpenRecordSale?: () => void;
  onOpenRecordExpense?: () => void;
  onOpenCollectDebt?: (customer: Customer) => void;
  onOpenWhatsAppReminder?: (customer: Customer | null, sale?: Sale | null) => void;
  onNavigateTab?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const SmartAIAssistant: React.FC<SmartAIAssistantProps> = ({
  onOpenRecordSale,
  onOpenRecordExpense,
  onOpenCollectDebt,
  onOpenWhatsAppReminder,
  onNavigateTab,
}) => {
  const {
    business,
    currentUser,
    sales,
    customers,
    products,
    expenses,
  } = useBusiness();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'briefing' | 'ask' | 'actions'>('briefing');
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Compute live business intelligence metrics
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaySales = useMemo(
    () => sales.filter(s => s.date && s.date.startsWith(todayStr)),
    [sales, todayStr]
  );

  const todayRevenue = useMemo(
    () => todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0),
    [todaySales]
  );

  const totalOutstandingDebt = useMemo(
    () => customers.reduce((acc, c) => acc + (c.outstandingDebt || 0), 0),
    [customers]
  );

  const debtorCustomers = useMemo(
    () =>
      customers
        .filter(c => (c.outstandingDebt || 0) > 0)
        .sort((a, b) => (b.outstandingDebt || 0) - (a.outstandingDebt || 0)),
    [customers]
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        p => p.type === 'product' && typeof p.currentStock === 'number' && p.currentStock <= 5
      ),
    [products]
  );

  // Initial messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello ${currentUser.name}! I am Smart AI, your executive business copilot. I analyze your real-time sales, outstanding debts, and inventory movements. How can I assist you right now?`,
      timestamp: 'Just now',
    },
  ]);

  // Handle generative query grounded strictly in business data
  const handleSendQuery = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    setTimeout(() => {
      let responseText = '';
      let action: { label: string; onClick: () => void } | undefined = undefined;
      const lower = q.toLowerCase();

      if (lower.includes('debt') || lower.includes('owe') || lower.includes('unpaid') || lower.includes('receivable')) {
        if (debtorCustomers.length > 0) {
          const top = debtorCustomers[0];
          responseText = `Based on current verified ledger records, you have ${debtorCustomers.length} customer(s) with outstanding debt totaling ${business.currencySymbol}${totalOutstandingDebt.toLocaleString()}. The highest debtor is ${top.name} with an unpaid balance of ${business.currencySymbol}${top.outstandingDebt.toLocaleString()}.`;
          if (onOpenWhatsAppReminder) {
            action = {
              label: `Send WhatsApp Reminder to ${top.name}`,
              onClick: () => {
                onOpenWhatsAppReminder(top, null);
                setIsOpen(false);
              },
            };
          }
        } else {
          responseText = `Congratulations! All customer accounts are fully settled. There is currently ₦0 in outstanding debts across your workspace.`;
        }
      } else if (lower.includes('today') || lower.includes('revenue') || lower.includes('performance') || lower.includes('sales')) {
        responseText = `Today's operations record ${todaySales.length} transaction(s) generating ${business.currencySymbol}${todayRevenue.toLocaleString()} in total revenue. Across all time, you have recorded ${sales.length} sales with healthy ledger synchronization.`;
        if (onOpenRecordSale) {
          action = {
            label: 'Record New Sale',
            onClick: () => {
              onOpenRecordSale();
              setIsOpen(false);
            },
          };
        }
      } else if (lower.includes('stock') || lower.includes('product') || lower.includes('inventory')) {
        if (lowStockProducts.length > 0) {
          const names = lowStockProducts.map(p => `${p.name} (${p.currentStock ?? 0} left)`).join(', ');
          responseText = `Attention: ${lowStockProducts.length} product(s) are running critically low on inventory: ${names}. Restocking is recommended to avoid lost sales.`;
          if (onNavigateTab) {
            action = {
              label: 'View Products Catalog',
              onClick: () => {
                onNavigateTab('products');
                setIsOpen(false);
              },
            };
          }
        } else {
          responseText = `Inventory health is optimal. None of your tracked physical products are below minimum alert thresholds.`;
        }
      } else if (lower.includes('expense') || lower.includes('cost') || lower.includes('spend')) {
        const totalExp = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
        responseText = `Total expenses logged in this workspace stand at ${business.currencySymbol}${totalExp.toLocaleString()} across ${expenses.length} expense entry/entries. Smart AI recommends categorizing recurring utilities and rent for accurate margin tracking.`;
      } else if (lower.includes('smartcore') || lower.includes('academy') || lower.includes('training')) {
        responseText = `Smartcore ICT Centre is configured as your primary organization. Training offerings like Computer Appreciation, Web Development, and Graphic Design are tracked as high-margin digital programs.`;
      } else {
        responseText = `Smart AI analyzed your workspace data: You have ${sales.length} total sales, ${products.length} products & services, and ${customers.length} registered customers. Let me know if you would like me to summarize cash flow, list debtors, or inspect inventory!`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action,
        },
      ]);
      setIsThinking(false);
    }, 600);
  };

  const quickPrompts = [
    'Summarize today’s financial performance',
    'Who owes the most outstanding debt?',
    'Check low stock inventory alerts',
    'What are total business expenses?',
  ];

  const totalAlerts = (debtorCustomers.length > 0 ? 1 : 0) + (lowStockProducts.length > 0 ? 1 : 0);

  return (
    <>
      {/* Floating Persistent Dock Trigger Button */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-500/40 hover:border-purple-600 shadow-xl shadow-purple-600/20 hover:shadow-2xl hover:shadow-purple-600/30 transition-all duration-300 cursor-pointer active:scale-95"
          title="Open Smart AI Executive Copilot"
          aria-label="Open Smart AI Executive Copilot"
        >
          {/* Subtle animated halo */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#4C0196] to-[#7B001C] opacity-30 group-hover:opacity-75 blur-xs transition duration-300" />

          <div className="relative flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6D28D9] to-purple-600 flex items-center justify-center text-white shadow-xs shadow-purple-600/40">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold text-[#0F172A] dark:text-white tracking-tight flex items-center gap-1">
                Smart AI
                {totalAlerts > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </span>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold leading-none">
                {totalAlerts > 0 ? `${totalAlerts} Insights` : 'Copilot Ready'}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Slide-over Drawer / Modal Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div
            className="w-full max-w-md sm:max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-white dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white">
                      Smart AI
                    </h2>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                      Business Copilot
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live operational intelligence for {business.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Smart AI panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <button
                type="button"
                onClick={() => setActiveTab('briefing')}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'briefing'
                    ? 'border-[#6D28D9] text-[#6D28D9] dark:text-purple-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Executive Briefing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ask')}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'ask'
                    ? 'border-[#6D28D9] text-[#6D28D9] dark:text-purple-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Ask Smart AI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'actions'
                    ? 'border-[#6D28D9] text-[#6D28D9] dark:text-purple-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Quick Actions
              </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* TAB 1: EXECUTIVE BRIEFING */}
              {activeTab === 'briefing' && (
                <div className="space-y-4">
                  {/* Real-time KPIs grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50">
                      <span className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider block">
                        Today's Revenue
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {business.currencySymbol}
                        {todayRevenue.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                        {todaySales.length} transaction(s) logged
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
                      <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                        Pending Debts
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {business.currencySymbol}
                        {totalOutstandingDebt.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                        {debtorCustomers.length} debtor customer(s)
                      </span>
                    </div>
                  </div>

                  {/* Proactive Actionable Recommendations */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Proactive Business Alerts
                    </span>

                    {/* Alert 1: Overdue Debts */}
                    {debtorCustomers.length > 0 ? (
                      <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-rose-950 dark:text-rose-200 block">
                              Outstanding Receivables Alert
                            </span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                              {debtorCustomers[0].name} owes {business.currencySymbol}
                              {debtorCustomers[0].outstandingDebt.toLocaleString()}. Recovering this boosts your available cash reserves.
                            </p>
                          </div>
                        </div>

                        {onOpenWhatsAppReminder && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenWhatsAppReminder(debtorCustomers[0], null);
                              setIsOpen(false);
                            }}
                            className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Send WhatsApp Payment Reminder</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                          All customer accounts are settled with zero outstanding arrears.
                        </span>
                      </div>
                    )}

                    {/* Alert 2: Low Stock Warning */}
                    {lowStockProducts.length > 0 ? (
                      <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                              Low Inventory Warning ({lowStockProducts.length} items)
                            </span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                              {lowStockProducts[0].name} has only {lowStockProducts[0].currentStock ?? 0} unit(s) remaining.
                            </p>
                          </div>
                        </div>

                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateTab('products');
                              setIsOpen(false);
                            }}
                            className="w-full py-1.5 px-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <span>Open Inventory & Restock</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Inventory levels are healthy across catalog items.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE ASK SMART AI */}
              {activeTab === 'ask' && (
                <div className="flex flex-col h-full space-y-4">
                  {/* Messages Feed */}
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-[#6D28D9] text-white rounded-br-xs font-medium'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs border border-slate-200/60 dark:border-slate-700'
                          }`}
                        >
                          <p>{msg.text}</p>

                          {msg.action && (
                            <button
                              type="button"
                              onClick={msg.action.onClick}
                              className="mt-2.5 py-1 px-2.5 bg-white text-[#6D28D9] dark:bg-purple-900 dark:text-purple-200 font-bold text-[11px] rounded-md shadow-xs hover:bg-purple-50 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>{msg.action.label}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    ))}

                    {isThinking && (
                      <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium p-2">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Smart AI analyzing verified business records...</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Prompts */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Suggested Inquiries
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map(qp => (
                        <button
                          key={qp}
                          type="button"
                          onClick={() => handleSendQuery(qp)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950 dark:hover:text-purple-300 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
                        >
                          {qp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: QUICK ACTIONS */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Immediate Operational Shortcuts
                  </span>

                  <div className="grid grid-cols-1 gap-2.5">
                    {onOpenRecordSale && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenRecordSale();
                          setIsOpen(false);
                        }}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 bg-white dark:bg-slate-800/60 hover:bg-purple-50/50 flex items-center justify-between text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                            <PlusCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              Record New Sale / Enrollment
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Issue instant invoice and payment receipt
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    {onOpenRecordExpense && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenRecordExpense();
                          setIsOpen(false);
                        }}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 bg-white dark:bg-slate-800/60 hover:bg-rose-50/50 flex items-center justify-between text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                            <MinusCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              Record Outgoing Business Expense
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Track operational bills, utilities, and wages
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateTab('customers');
                          setIsOpen(false);
                        }}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 bg-white dark:bg-slate-800/60 hover:bg-purple-50/50 flex items-center justify-between text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              Manage Students & Debtors
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Inspect receivables ledger and WhatsApp logs
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateTab('reports');
                          setIsOpen(false);
                        }}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 bg-white dark:bg-slate-800/60 hover:bg-purple-50/50 flex items-center justify-between text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              Generate Financial Ledger Report
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Export verified P&L and statement to PDF / CSV
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar for Tab 2 */}
            {activeTab === 'ask' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendQuery(inputQuery);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={e => setInputQuery(e.target.value)}
                    placeholder="Ask Smart AI about sales, debts, margins..."
                    className="flex-1 px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isThinking}
                    className="w-10 h-10 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shrink-0 shadow-md shadow-purple-600/20"
                    title="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Grounded strictly in verified PostgreSQL records
              </span>
              <span>BizFlow Intelligence</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
