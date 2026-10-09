import React, { useState } from 'react';
import { Link, useRouter } from '../../context/RouterContext';
import {
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Printer,
  MessageCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Filter,
  Sparkles,
  Database,
  Lock,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  bullets: string[];
  realWorldScenario: string;
}

export const FeaturesPage: React.FC = () => {
  const { navigate } = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Capabilities' },
    { id: 'sales', label: 'Sales & Receipts' },
    { id: 'expenses', label: 'Expenses & Margins' },
    { id: 'customers', label: 'Customer Balances' },
    { id: 'operations', label: 'Security & Team' },
  ];

  const features: FeatureItem[] = [
    {
      id: 'sales-tracking',
      category: 'sales',
      title: 'Sales & Transaction Recording',
      subtitle: 'Fast, error-free capture of daily customer purchases and program enrollments',
      icon: Receipt,
      iconColor: 'text-[#4C0196] dark:text-purple-300',
      iconBg: 'bg-purple-100 dark:bg-purple-950/60',
      bullets: [
        'Multi-channel payment recording (Cash, Bank Transfer, POS Card, OPay)',
        'Itemized line items with dynamic quantity, unit price, and subtotal calculation',
        'Optional VAT/tax toggling with configurable rate per business',
        'Customer linkage for recurring buyers and debt history tracking',
      ],
      realWorldScenario:
        'A student registers for a 3-month Graphic Design course paying part via Bank Transfer: the cashier logs the transaction in 10 seconds, and an invoice is immediately generated.',
    },
    {
      id: 'expense-management',
      category: 'expenses',
      title: 'Expense Management & Cost Control',
      subtitle: 'Capture every naira spent on daily operations before cash vanishes',
      icon: TrendingDown,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 dark:bg-rose-950/60',
      bullets: [
        'Customizable expense categories (Generator Fuel, Rent, Stationery, Utilities)',
        'Support for operational payments and supplier payables',
        'Automatic tracking of payment source (Counter Drawer Cash vs Bank Account)',
        'Instant deduction from net profit summaries',
      ],
      realWorldScenario:
        'When ₦15,000 is taken from the counter drawer for generator fuel, the cashier logs the expense immediately so end-of-day drawer reconciliation balances perfectly.',
    },
    {
      id: 'financial-summaries',
      category: 'expenses',
      title: 'Real-Time Profitability & Financial Summaries',
      subtitle: 'Clear, transparent visibility into gross revenue, overhead costs, and net margins',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
      bullets: [
        'Authoritative calculation: Net Profit = Verified Sales Inflow - Operating Expenses',
        'Strict financial rule: Unpaid debts and pending transfers are NEVER counted as profit',
        'Configurable date filtering (Today, This Week, This Month, Year-to-Date)',
        'Cash vs Bank collection breakdown charts',
      ],
      realWorldScenario:
        'Business owners can open their dashboard at 8:00 PM and know exactly how much net cash was generated today across all branches.',
    },
    {
      id: 'customer-debts',
      category: 'customers',
      title: 'Customer Balances & Debt Ledgers',
      subtitle: 'Never lose track of installments, balance due, and credit customers',
      icon: Users,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-950/60',
      bullets: [
        'Individual customer ledger with lifetime purchases and total debt',
        'Multi-stage installment recording with balance auto-updating',
        'Searchable directory by customer name, phone number, and debt status',
        'Quick Debt Payment modal to record repayments in one tap',
      ],
      realWorldScenario:
        'A customer walks in to pay an outstanding ₦25,000 balance from last week: search their name, click Record Payment, choose Cash or Transfer, and the debt drops to ₦0.00.',
    },
    {
      id: 'thermal-receipts',
      category: 'sales',
      title: 'Receipts & Professional Invoices',
      subtitle: 'Clean 58mm & 80mm thermal roll printouts with your company identity',
      icon: Printer,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-100 dark:bg-cyan-950/60',
      bullets: [
        'Strict monotonic invoice sequence numbering (#101, #102...) preventing duplicates',
        'Displays business name, tagline, address, phone, and official logo',
        'Includes bank transfer account details for customer verification',
        'Browser-native thermal printing without proprietary printer drivers',
      ],
      realWorldScenario:
        'Connect any cheap USB or Bluetooth 58mm thermal receipt printer: click Print Receipt and hand an official slip to the customer immediately.',
    },
    {
      id: 'whatsapp-reminders',
      category: 'customers',
      title: 'WhatsApp Customer Debt Reminders',
      subtitle: 'One-click polite and formal payment follow-ups dispatched via WhatsApp',
      icon: MessageCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
      bullets: [
        'Auto-formatted messages with customer name, exact balance due, and invoice #',
        'Tone customization: choose between Friendly, Professional, or Urgent',
        'Embeds official bank name, account name, and number directly into the chat',
        'Opens directly in WhatsApp Web or mobile app without saving contacts first',
      ],
      realWorldScenario:
        'Instead of typing awkward payment reminders manually, click Send Reminder on the customer row and dispatch a formatted payment message to their WhatsApp.',
    },
    {
      id: 'cash-reconciliation',
      category: 'operations',
      title: 'Daily Cash Drawer Reconciliation',
      subtitle: 'Eliminate cashier shortfalls and end-of-day register discrepancies',
      icon: Clock,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-950/60',
      bullets: [
        'Tracks Opening Cash Float + Cash Sales Inflow - Cash Expenses Outflow',
        'Computes Expected Cash Count and compares with physical counted cash',
        'Identifies exact cash drawer variance (balanced, surplus, or deficit)',
        'Permanent audit record of who reconciled the drawer each day',
      ],
      realWorldScenario:
        'At closing time, the cashier counts ₦195,000 in the register. BizFlow confirms the expected amount was ₦195,000: Zero variance, audit locked.',
    },
    {
      id: 'team-permissions',
      category: 'operations',
      title: 'Team Roles & Granular Permissions',
      subtitle: 'Empower staff while safeguarding your financial records and settings',
      icon: ShieldCheck,
      iconColor: 'text-[#4C0196] dark:text-purple-300',
      iconBg: 'bg-purple-100 dark:bg-purple-950/60',
      bullets: [
        'Role-Based Access Control: Owner, Manager, and Staff roles',
        'Owner Protection Guarantee: Owners cannot be demoted, locked out, or deleted',
        'Granular permissions for sales recording, refunds, settings, and team management',
        'Quick Cashier Switch overlay for shared front-desk computers with PIN protection',
      ],
      realWorldScenario:
        'Front-desk cashiers can record sales and view inventory, but cannot tamper with historical profits, delete users, or modify company banking settings.',
    },
  ];

  const filteredFeatures =
    selectedCategory === 'all'
      ? features
      : features.filter(f => f.category === selectedCategory);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#4C0196] dark:text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete Feature Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Everything You Need to Run Your Business with Clarity
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Every capability below is genuine, tested, and actively functioning in BizFlow. No vapourware, no unbuilt placeholders.
        </p>

        {/* Filter Tabs */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#4C0196] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredFeatures.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-purple-200 dark:hover:border-purple-800/80 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center font-bold`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Bullet points */}
                  <ul className="space-y-2 pt-2">
                    {item.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Real-world application example box */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Real-World Workflow:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    "{item.realWorldScenario}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Architecture Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-900/60 text-purple-300 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">Cloud SQL PostgreSQL Persistence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every sale, expense, customer, and settings change is saved directly into relational PostgreSQL with ACID transaction guarantees.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-900/60 text-purple-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">Strict Tenant Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your business records belong strictly to your workspace. Organizations can never view or modify another company's records.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-900/60 text-purple-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">Cryptographic Sessions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sessions use 256-bit cryptographically hashed tokens with server-side revocation on logout, ensuring safe shared counter usage.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="text-center max-w-3xl mx-auto px-4 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Ready to put these features to work in your business?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Create Your Business Account &rarr;
          </button>
          <button
            onClick={() => navigate('/how-it-works')}
            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            See How It Works
          </button>
        </div>
      </section>
    </div>
  );
};
