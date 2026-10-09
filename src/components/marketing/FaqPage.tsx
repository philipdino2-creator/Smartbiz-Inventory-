import React, { useState } from 'react';
import { useRouter, Link } from '../../context/RouterContext';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const FaqPage: React.FC = () => {
  const { navigate } = useRouter();
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'general',
      question: 'What is BizFlow?',
      answer:
        'BizFlow is a business management and bookkeeping application designed to help small businesses, training academies, retail counters, and service providers manage sales, track expenses, monitor profitability, issue thermal receipts, and keep customer credit records organized in one central workspace.',
    },
    {
      id: 'faq-2',
      category: 'general',
      question: 'Who is BizFlow designed for?',
      answer:
        'BizFlow is tailored for small enterprises, computer institutes, training centres, retail shops, ICT academies, and service providers looking to replace fragmented paper receipts, manual Excel ledgers, and uncoordinated WhatsApp records with a reliable, structured system.',
    },
    {
      id: 'faq-3',
      category: 'account',
      question: 'How do I create an account?',
      answer:
        'Click "Get Started" on the homepage or navigation bar. Provide your full name, email address, and a secure password. If you register as a Business Owner, you will immediately be prompted to name your business workspace, configure your currency (e.g. ₦), and set up your initial bank information.',
    },
    {
      id: 'faq-4',
      category: 'features',
      question: 'What can I manage with BizFlow?',
      answer:
        'You can manage customer sales across multiple payment channels (Cash, Bank Transfer, POS Card, OPay), operating expenses with custom categories, net profit calculations, customer debt balances, installment histories, 58mm and 80mm thermal receipt printing, WhatsApp payment reminder notifications, and daily cash drawer reconciliation audits.',
    },
    {
      id: 'faq-5',
      category: 'access',
      question: 'Can I access BizFlow on a mobile phone?',
      answer:
        'Yes. BizFlow is designed with a responsive, mobile-first interface. You can access your workspace from any modern smartphone or tablet browser, record counter transactions on the go, view live profitability, and trigger thermal receipt printing.',
    },
    {
      id: 'faq-6',
      category: 'security',
      question: 'How does BizFlow protect business information?',
      answer:
        'BizFlow stores records in a persistent Cloud SQL PostgreSQL relational database with strict multi-tenant isolation. Passwords are encrypted using bcrypt hashing, authenticated sessions use 256-bit cryptographically secure session tokens, and every database query validates the user’s authorized tenant boundaries.',
    },
    {
      id: 'faq-7',
      category: 'team',
      question: 'Can multiple team members access a workspace?',
      answer:
        'Yes. Workspaces support Role-Based Access Control (RBAC) with Owner, Manager, and Staff roles. Staff members can be restricted to recording counter sales without accessing sensitive financial summaries or company settings. The Business Owner account is permanently protected against accidental deletion or role demotion.',
    },
    {
      id: 'faq-8',
      category: 'pricing',
      question: 'What does BizFlow cost?',
      answer:
        'Subscription plans and commercial packages are currently being finalized as we onboard early businesses. You can create an account and access the full suite of management tools today during our early adoption phase.',
    },
    {
      id: 'faq-9',
      category: 'support',
      question: 'How can I get help or support?',
      answer:
        'You can reach our team via email at info@smartcoreict.online or by phone/WhatsApp at +234 8148483687. Our office is located at 12 RN Okonkwo Street, Off Okpanam, Asaba, Delta State, Nigeria.',
    },
  ];

  const filteredFaqs = faqs.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAccordion = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#4C0196] dark:text-purple-300 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge &amp; Support</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Clear, verified answers about BizFlow capabilities, account setup, security architecture, and everyday operations.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. mobile, receipt, security, pricing)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#4C0196] shadow-xs"
            />
          </div>
        </div>
      </section>

      {/* Accordion List */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No questions found matching "{searchQuery}". Try another keyword or browse all questions.
            </div>
          ) : (
            filteredFaqs.map(item => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.question}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Support Contact Box */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Still have a question about BizFlow?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speak with our team directly for assistance or technical guidance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="mailto:info@smartcoreict.online"
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-purple-300"
            >
              <Mail className="w-3.5 h-3.5 text-[#4C0196]" />
              <span>Email Support</span>
            </a>
            <a
              href="https://wa.me/2348148483687"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
