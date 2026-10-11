import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowIcon, BizFlowLogo } from '../common/BizFlowLogo';
import { api } from '../../services/api';
import { User, UserRole, ProductService } from '../../types';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  Package,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  BookOpen,
  ShoppingBag,
  CreditCard,
  Briefcase,
  HelpCircle,
  Lightbulb,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useRouter, Link } from '../../context/RouterContext';

export interface PendingUserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
}

interface OnboardingFlowProps {
  pendingUser?: PendingUserData | null;
  initialStep?: 1 | 2 | 3 | 4;
  onCancel?: () => void;
  onComplete?: (user: User, business: any) => void;
}

interface StarterItem {
  name: string;
  category: string;
  type: 'product' | 'service';
  price: number;
  cost: number;
  stock: number;
}

const INDUSTRY_PRESETS: Record<
  string,
  {
    label: string;
    icon: any;
    description: string;
    starterItems: StarterItem[];
    aiTip: string;
  }
> = {
  'ICT & Digital Training': {
    label: 'ICT & Digital Training',
    icon: BookOpen,
    description: 'Computer training, coding academies, design bootcamps, and certification centers.',
    starterItems: [
      {
        name: 'Computer Appreciation & Office Automation',
        category: 'Foundations',
        type: 'service',
        price: 35000,
        cost: 5000,
        stock: 999,
      },
      {
        name: 'Full-Stack Web Development Bootcamp',
        category: 'Programming',
        type: 'service',
        price: 150000,
        cost: 20000,
        stock: 999,
      },
      {
        name: 'Graphic & UI/UX Design Masterclass',
        category: 'Creative Design',
        type: 'service',
        price: 65000,
        cost: 10000,
        stock: 999,
      },
      {
        name: 'Data Analysis & Python Course',
        category: 'Data Science',
        type: 'service',
        price: 120000,
        cost: 15000,
        stock: 999,
      },
    ],
    aiTip:
      'Smart AI Recommendation: Training programs act as services with zero physical stock depreciation. BizFlow tracks student fees, partial enrollments, and course receivables seamlessly.',
  },
  'Retail & Supermarket': {
    label: 'Retail & Supermarket',
    icon: ShoppingBag,
    description: 'Groceries, electronics, consumer goods, minimarts, and convenience stores.',
    starterItems: [
      {
        name: 'Wireless Optical Mouse',
        category: 'Accessories',
        type: 'product',
        price: 4500,
        cost: 2800,
        stock: 24,
      },
      {
        name: 'USB Fast Charging Cable (Type-C)',
        category: 'Accessories',
        type: 'product',
        price: 2500,
        cost: 1400,
        stock: 50,
      },
      {
        name: 'Premium A4 Copy Paper (Ream)',
        category: 'Stationery',
        type: 'product',
        price: 5200,
        cost: 4100,
        stock: 30,
      },
    ],
    aiTip:
      'Smart AI Recommendation: Physical goods benefit from stock reorder warnings. BizFlow automatically flags items when inventory dips below minimum safety thresholds.',
  },
  'Professional Services': {
    label: 'Professional Services & Consulting',
    icon: Briefcase,
    description: 'Tech agencies, accounting, legal, advisory, and creative design studios.',
    starterItems: [
      {
        name: 'Corporate Brand Identity Package',
        category: 'Branding',
        type: 'service',
        price: 95000,
        cost: 15000,
        stock: 999,
      },
      {
        name: 'Website Audit & Performance Optimization',
        category: 'Consulting',
        type: 'service',
        price: 75000,
        cost: 10000,
        stock: 999,
      },
      {
        name: 'Monthly IT Retainer & Support',
        category: 'Support',
        type: 'service',
        price: 120000,
        cost: 25000,
        stock: 999,
      },
    ],
    aiTip:
      'Smart AI Recommendation: Set up milestone invoicing for service retainers. Unpaid milestone invoices are automatically logged in your client accounts ledger.',
  },
  'Wholesale & Distribution': {
    label: 'Wholesale & Distribution',
    icon: Layers,
    description: 'Bulk supply, B2B wholesale trade, FMCG distribution, and merchant supply.',
    starterItems: [
      {
        name: 'Wholesale Carton Pack (24 Units)',
        category: 'Bulk Goods',
        type: 'product',
        price: 48000,
        cost: 38000,
        stock: 60,
      },
      {
        name: 'Merchant Starter Bundle',
        category: 'Bundles',
        type: 'product',
        price: 85000,
        cost: 67000,
        stock: 20,
      },
    ],
    aiTip:
      'Smart AI Recommendation: Wholesale transactions frequently involve deferred payments. Use the Customer Debt Ledger to track credit limits and aging receivables.',
  },
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  pendingUser,
  initialStep = 1,
  onCancel,
  onComplete,
}) => {
  const { handleAuthSuccess } = useBusiness();
  const { navigate, path, getSafeReturnUrl } = useRouter();

  // Derive active step from URL if matched (/onboarding/step-X)
  const getStepFromPath = (): 1 | 2 | 3 | 4 => {
    if (path === '/onboarding/step-2') return 2;
    if (path === '/onboarding/step-3') return 3;
    if (path === '/onboarding/step-4') return 4;
    return initialStep;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(getStepFromPath());

  // Step 1: Workspace Profile State
  const [bizName, setBizName] = useState(
    pendingUser?.name ? `${pendingUser.name}'s Business` : 'Smartcore ICT Centre'
  );
  const [bizCategory, setBizCategory] = useState('ICT & Digital Training');
  const [bizPhone, setBizPhone] = useState(pendingUser?.phone || '+234 8148483687');
  const [bizEmail, setBizEmail] = useState(pendingUser?.email || 'info@smartcoreict.online');
  const [bizAddress, setBizAddress] = useState(
    '12 RN Okonkwo Street, Off Okpanam, Asaba, Delta State, Nigeria'
  );
  const [bizCurrency, setBizCurrency] = useState('NGN');
  const [bizCurrencySymbol, setBizCurrencySymbol] = useState('₦');
  const [bizTaxRate, setBizTaxRate] = useState(7.5);

  // Step 2: Operations & Scale State
  const [teamSize, setTeamSize] = useState<'1' | '2-5' | '6-20' | '20+'>('2-5');
  const [salesModel, setSalesModel] = useState<
    'pos' | 'services' | 'invoicing' | 'omnichannel'
  >('services');
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>([
    'Cash',
    'Bank Transfer',
    'POS / Card',
    'Customer Debt / Credit',
  ]);

  // Step 3: Catalog & Inventory Items
  const [catalogItems, setCatalogItems] = useState<StarterItem[]>(
    INDUSTRY_PRESETS['ICT & Digital Training'].starterItems
  );
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'product' | 'service'>('service');
  const [newItemCategory, setNewItemCategory] = useState('General');
  const [newItemPrice, setNewItemPrice] = useState<number>(25000);
  const [newItemCost, setNewItemCost] = useState<number>(5000);
  const [newItemStock, setNewItemStock] = useState<number>(50);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);

  // Step 4: First Customer State
  const [addCustomerOption, setAddCustomerOption] = useState<'yes' | 'skip'>('yes');
  const [firstCustName, setFirstCustName] = useState('Chidi Okafor');
  const [firstCustPhone, setFirstCustPhone] = useState('+234 803 123 4567');
  const [firstCustEmail, setFirstCustEmail] = useState('chidi.student@example.com');
  const [firstCustDebt, setFirstCustDebt] = useState<number>(0);

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAiCopilot, setShowAiCopilot] = useState(true);

  // Handle URL synchronisation
  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
    navigate(`/onboarding/step-${step}`, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When industry changes, optionally preload starter items
  const handleSelectIndustry = (category: string) => {
    setBizCategory(category);
    if (INDUSTRY_PRESETS[category]) {
      setCatalogItems(INDUSTRY_PRESETS[category].starterItems);
      if (category === 'ICT & Digital Training') {
        setSalesModel('services');
      } else if (category === 'Retail & Supermarket') {
        setSalesModel('pos');
      }
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const item: StarterItem = {
      name: newItemName.trim(),
      category: newItemCategory.trim() || 'General',
      type: newItemType,
      price: Number(newItemPrice) || 0,
      cost: Number(newItemCost) || 0,
      stock: newItemType === 'service' ? 999 : Number(newItemStock) || 0,
    };
    setCatalogItems(prev => [item, ...prev]);
    setNewItemName('');
    setShowCustomItemModal(false);
  };

  const handleRemoveCatalogItem = (index: number) => {
    setCatalogItems(prev => prev.filter((_, i) => i !== index));
  };

  const togglePaymentMethod = (method: string) => {
    setEnabledPaymentMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  // Final Action: Create Tenant Workspace & Seed initial data
  const handleLaunchWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const ownerName = pendingUser?.name || 'Administrator';
      const ownerEmail = pendingUser?.email || 'admin@bizflow.app';
      const ownerPassword = pendingUser?.password || 'smartcore123';
      const ownerPhone = pendingUser?.phone || bizPhone;

      // 1. Register Owner & Create Workspace
      const res = await api.register({
        name: ownerName,
        email: ownerEmail,
        password: ownerPassword,
        phone: ownerPhone,
        role: 'owner',
        businessName: bizName.trim(),
        businessCategory: bizCategory,
        businessPhone: bizPhone.trim() || undefined,
        businessEmail: bizEmail.trim() || undefined,
        businessAddress: bizAddress.trim() || undefined,
        businessCurrency: bizCurrency,
        businessCurrencySymbol: bizCurrencySymbol,
        businessTaxRate: bizTaxRate,
      });

      if (!res || !res.user) {
        throw new Error('Workspace initialization did not return a valid user session.');
      }

      // 2. Seed starter catalog items if added
      if (catalogItems.length > 0) {
        for (const item of catalogItems.slice(0, 10)) {
          try {
            await api.createProduct({
              name: item.name,
              category: item.category,
              type: item.type,
              sellingPrice: item.price,
              costPrice: item.cost,
              openingStock: item.stock,
              currentStock: item.stock,
              minStockLevel: item.type === 'product' ? 5 : undefined,
              active: true,
            });
          } catch (seedErr) {
            console.warn('Catalog item seed non-fatal:', seedErr);
          }
        }
      }

      // 3. Seed initial customer if specified
      if (addCustomerOption === 'yes' && firstCustName.trim()) {
        try {
          await api.createCustomer({
            name: firstCustName.trim(),
            phone: firstCustPhone.trim() || '',
            email: firstCustEmail.trim() || '',
            outstandingDebt: Number(firstCustDebt) || 0,
            notes: 'Initial customer registered during onboarding.',
          });
        } catch (custErr) {
          console.warn('Customer seed non-fatal:', custErr);
        }
      }

      setSuccessMsg(`Workspace "${bizName}" initialized successfully! Loading your dashboard...`);

      if (onComplete) {
        onComplete(res.user, res.business);
      } else {
        handleAuthSuccess(res.user, res.business);
        setTimeout(() => {
          navigate(getSafeReturnUrl() || '/app');
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete workspace creation. Please verify your details.');
      setLoading(false);
    }
  };

  // Steps definition for header
  const stepsMeta = [
    { num: 1, title: 'Workspace', subtitle: 'Profile & Currency' },
    { num: 2, title: 'Operations', subtitle: 'Scale & Sales Model' },
    { num: 3, title: 'Catalog', subtitle: 'Products & Services' },
    { num: 4, title: 'Launch', subtitle: 'Review & First Client' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 selection:bg-purple-100 dark:selection:bg-purple-900 selection:text-purple-900 dark:selection:text-purple-100 transition-colors">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200/70 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-2.5 focus:outline-hidden group">
          <BizFlowLogo size="md" />
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAiCopilot(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              showAiCopilot
                ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800 text-[#6D28D9] dark:text-purple-300 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
            title="Toggle Smart AI Assistant guidance"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
            <span>Smart AI</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      {/* Main Stepper Container */}
      <main className="max-w-3xl w-full mx-auto my-6">
        {/* Step Progress Indicators */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-3">
            {stepsMeta.map(s => {
              const isPassed = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div
                  key={s.num}
                  onClick={() => {
                    if (isPassed) goToStep(s.num as any);
                  }}
                  className={`flex flex-col items-center sm:items-start text-center sm:text-left transition-all ${
                    isPassed ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#6D28D9] text-white ring-4 ring-purple-100 dark:ring-purple-950'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                    </span>
                    <span
                      className={`hidden sm:inline text-xs font-semibold ${
                        isCurrent
                          ? 'text-[#0F172A] dark:text-white'
                          : isPassed
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 pl-8 truncate">
                    {s.subtitle}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#6D28D9] to-purple-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Floating Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
          {/* Smart AI Contextual Advisory Pill / Banner */}
          {showAiCopilot && (
            <div className="mb-6 p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs shadow-purple-600/30">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Smart AI Assistant
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded-sm bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    Contextual Guidance
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentStep === 1 &&
                    (INDUSTRY_PRESETS[bizCategory]?.aiTip ||
                      'Standardizing currency to NGN and VAT to 7.5% complies with local Nigerian regulations for training centres and businesses.')}
                  {currentStep === 2 &&
                    'Selecting the right sales model configures your default receipt layouts, POS cashier view, and whether partial student installment plans are tracked.'}
                  {currentStep === 3 &&
                    'You have loaded recommended starter catalog items. You can customize them now or seamlessly update them anytime in the Products module.'}
                  {currentStep === 4 &&
                    'Your new workspace will be fully isolated in PostgreSQL with real-time audit logging and bank-grade data security.'}
                </p>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: WORKSPACE PROFILE & REGIONAL SETTINGS */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                  Name your business workspace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Tell us about your organization and configure your official currency.
                </p>
              </div>

              <div className="space-y-4">
                {/* Business Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Business / Organization Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={bizName}
                      onChange={e => setBizName(e.target.value)}
                      placeholder="e.g. Smartcore ICT Centre"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Industry / Category Preset Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Industry or Sector *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(INDUSTRY_PRESETS).map(([key, data]) => {
                      const Icon = data.icon;
                      const isSelected = bizCategory === key;
                      return (
                        <div
                          key={key}
                          onClick={() => handleSelectIndustry(key)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-[#6D28D9] bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-[#6D28D9]'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                              {data.label}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {data.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Business Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={bizPhone}
                        onChange={e => setBizPhone(e.target.value)}
                        placeholder="+234 8148483687"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={bizEmail}
                        onChange={e => setBizEmail(e.target.value)}
                        placeholder="info@smartcoreict.online"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Address */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Physical Operating Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={bizAddress}
                      onChange={e => setBizAddress(e.target.value)}
                      placeholder="12 RN Okonkwo Street, Off Okpanam, Asaba, Delta State, Nigeria"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Currency & Tax Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Operational Currency
                    </label>
                    <select
                      value={bizCurrency}
                      onChange={e => {
                        const cur = e.target.value;
                        setBizCurrency(cur);
                        setBizCurrencySymbol(
                          cur === 'USD' ? '$' : cur === 'GBP' ? '£' : cur === 'EUR' ? '€' : '₦'
                        );
                      }}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9]"
                    >
                      <option value="NGN">Nigerian Naira (₦ NGN)</option>
                      <option value="USD">United States Dollar ($ USD)</option>
                      <option value="GBP">British Pound (£ GBP)</option>
                      <option value="EUR">Euro (€ EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Standard VAT / Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={bizTaxRate}
                      onChange={e => setBizTaxRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/signup"
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  ← Back to Account
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (!bizName.trim()) {
                      setError('Please enter your business or organization name.');
                      return;
                    }
                    setError(null);
                    goToStep(2);
                  }}
                  className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: BUSINESS OPERATIONS & TEAM SCALE */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                  How does your team operate?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  We'll adapt your cashier terminal, user roles, and receipt formats.
                </p>
              </div>

              {/* Team Scale */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  What is your team size?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: '1', title: 'Solo Operator', desc: 'Just me (1 user)' },
                    { id: '2-5', title: 'Small Team', desc: '2 - 5 staff members' },
                    { id: '6-20', title: 'Growing Enterprise', desc: '6 - 20 employees' },
                    { id: '20+', title: 'Large Scale', desc: '20+ employees' },
                  ].map(scale => {
                    const isSelected = teamSize === scale.id;
                    return (
                      <div
                        key={scale.id}
                        onClick={() => setTeamSize(scale.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#6D28D9] bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-[#6D28D9]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {scale.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                          {scale.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Primary Sales Model */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Primary Sales & Transaction Flow
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'services',
                      title: 'Training, Courses & Services',
                      desc: 'Enrollments, student fees, installment payments, and completion tracking.',
                    },
                    {
                      id: 'pos',
                      title: 'Direct Point of Sale (POS)',
                      desc: 'Fast walk-in counter sales, barcode scanning, and instant thermal receipts.',
                    },
                    {
                      id: 'invoicing',
                      title: 'B2B Client Invoicing',
                      desc: 'Formal invoice quotes, delivery notes, purchase orders, and net-30 terms.',
                    },
                    {
                      id: 'omnichannel',
                      title: 'Omnichannel & WhatsApp Sales',
                      desc: 'Social commerce, catalog sharing, WhatsApp pay links, and in-store pick-up.',
                    },
                  ].map(m => {
                    const isSelected = salesModel === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSalesModel(m.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-[#6D28D9] bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-[#6D28D9]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-[#6D28D9] bg-[#6D28D9]'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {m.title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-normal">
                            {m.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Payment Channels Accepted
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    'Cash',
                    'Bank Transfer',
                    'POS / Card',
                    'Customer Debt / Credit',
                  ].map(method => {
                    const isChecked = enabledPaymentMethods.includes(method);
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => togglePaymentMethod(method)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-purple-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{method}</span>
                        {isChecked ? (
                          <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <span className="w-3.5 h-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  ← Back to Profile
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: STARTER CATALOG & INVENTORY */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                    Add initial Products or Services
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Pre-seeded for {bizCategory}. You can add, edit, or customize any item.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Item</span>
                </button>
              </div>

              {/* Catalog Items List */}
              <div className="space-y-2.5">
                {catalogItems.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      No items currently added.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultPreset = INDUSTRY_PRESETS[bizCategory] || INDUSTRY_PRESETS['ICT & Digital Training'];
                        setCatalogItems(defaultPreset.starterItems);
                      }}
                      className="mt-3 text-xs font-bold text-[#6D28D9] dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Reload Industry Starter Templates
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {catalogItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              item.type === 'service'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {item.type === 'service' ? (
                              <BookOpen className="w-4 h-4" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{item.category}</span>
                              <span>·</span>
                              <span className="capitalize">{item.type}</span>
                              {item.type === 'product' && (
                                <>
                                  <span>·</span>
                                  <span>Stock: {item.stock}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {bizCurrencySymbol}
                            {item.price.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCatalogItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Item Entry Form Modal / Inline Box */}
              {showCustomItemModal && (
                <form
                  onSubmit={handleAddCustomItem}
                  className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      Add Custom Course or Product
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomItemModal(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        placeholder="e.g. Cybersecurity Essentials"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Type
                      </label>
                      <select
                        value={newItemType}
                        onChange={e => setNewItemType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="service">Training / Service (Infinite Capacity)</option>
                        <option value="product">Physical Product (Tracks Inventory)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Selling Price ({bizCurrencySymbol})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItemPrice}
                        onChange={e => setNewItemPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Cost Price ({bizCurrencySymbol})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItemCost}
                        onChange={e => setNewItemCost(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={newItemType === 'service'}
                        value={newItemType === 'service' ? 999 : newItemStock}
                        onChange={e => setNewItemStock(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#6D28D9] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Save Item to Catalog
                  </button>
                </form>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  ← Back to Operations
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: FIRST CLIENT & WORKSPACE LAUNCH */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                  Launch your BizFlow Workspace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Optionally register your first customer or student, then initialize your dashboard.
                </p>
              </div>

              {/* Optional First Customer Section */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#6D28D9] dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      First Customer / Student Record
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAddCustomerOption('yes')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        addCustomerOption === 'yes'
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Add Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddCustomerOption('skip')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        addCustomerOption === 'skip'
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>

                {addCustomerOption === 'yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={firstCustName}
                        onChange={e => setFirstCustName(e.target.value)}
                        placeholder="e.g. Chidi Okafor"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={firstCustPhone}
                        onChange={e => setFirstCustPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={firstCustEmail}
                        onChange={e => setFirstCustEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Opening Debt / Receivable ({bizCurrencySymbol})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={firstCustDebt}
                        onChange={e => setFirstCustDebt(Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace Review Summary Card */}
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Summary Workspace Configuration
                </span>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Organization
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {bizName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Industry
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {bizCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Currency & VAT
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {bizCurrency} ({bizTaxRate}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Initial Catalog
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {catalogItems.length} items preloaded
                    </span>
                  </div>
                </div>
              </div>

              {/* Launch CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  disabled={loading}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  ← Back to Catalog
                </button>

                <button
                  type="button"
                  onClick={handleLaunchWorkspace}
                  disabled={loading}
                  className="py-3 px-6 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Initializing Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Workspace Now</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="max-w-3xl w-full mx-auto text-center pt-4">
        <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>PostgreSQL Multi-Tenant Architecture · ISO 27001 Grade Data Protection</span>
        </div>
      </footer>
    </div>
  );
};
