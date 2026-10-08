import React, { useState } from 'react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { Navbar } from './components/layout/Navbar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { MobileMoreDrawer } from './components/layout/MobileMoreDrawer';
import { DashboardView } from './components/dashboard/DashboardView';
import { SalesView } from './components/sales/SalesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CustomersView } from './components/customers/CustomersView';
import { PayablesView } from './components/payables/PayablesView';
import { ProductsView } from './components/products/ProductsView';
import { LedgerView } from './components/ledger/LedgerView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { RecurringExpensesView } from './components/expenses/RecurringExpensesView';

// Modals
import { RecordSaleModal } from './components/modals/RecordSaleModal';
import { RecordExpenseModal } from './components/modals/RecordExpenseModal';
import { RecordDebtPaymentModal } from './components/modals/RecordDebtPaymentModal';
import { SaleReceiptModal } from './components/modals/SaleReceiptModal';
import { WhatsAppReminderModal } from './components/modals/WhatsAppReminderModal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';

import { Sale, Customer, Payable } from './types';
import { Plus, Check } from 'lucide-react';
import { SplashScreen } from './components/common/SplashScreen';
import { LoginModal } from './components/auth/LoginModal';
import { AuthScreen } from './components/auth/AuthScreen';

const AppContent: React.FC = () => {
  const { business, customers, isAuthenticated, isAuthChecking } = useBusiness();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  // Modals state
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Debt Payment Modal config
  const [debtModalConfig, setDebtModalConfig] = useState<{
    isOpen: boolean;
    targetType: 'customer' | 'payable';
    targetItem: Customer | Payable | null;
  }>({
    isOpen: false,
    targetType: 'customer',
    targetItem: null,
  });

  // Receipt Modal config
  const [receiptModalConfig, setReceiptModalConfig] = useState<{
    isOpen: boolean;
    sale: Sale | null;
  }>({
    isOpen: false,
    sale: null,
  });

  // WhatsApp Debt Reminder Modal config
  const [whatsAppReminderConfig, setWhatsAppReminderConfig] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    sale?: Sale | null;
  }>({
    isOpen: false,
    customer: null,
    sale: null,
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenCollectDebt = (customer: Customer) => {
    setDebtModalConfig({
      isOpen: true,
      targetType: 'customer',
      targetItem: customer,
    });
  };

  const handleOpenPaySupplier = (payable: Payable) => {
    setDebtModalConfig({
      isOpen: true,
      targetType: 'payable',
      targetItem: payable,
    });
  };

  const handleViewReceipt = (sale: Sale) => {
    setReceiptModalConfig({
      isOpen: true,
      sale,
    });
  };

  const handleOpenWhatsAppReminder = (customer: Customer | null, sale?: Sale | null) => {
    let targetCustomer = customer;
    if (!targetCustomer && sale) {
      targetCustomer = customers.find(c => c.id === sale.customerId) || {
        id: sale.customerId || 'temp_cust',
        businessId: sale.businessId,
        name: sale.customerName,
        phone: sale.customerPhone || '',
        totalPurchases: sale.totalAmount,
        totalPaid: sale.amountPaid,
        outstandingDebt: sale.balanceDue,
        createdAt: sale.date,
        updatedAt: sale.date,
      };
    }
    setWhatsAppReminderConfig({
      isOpen: true,
      customer: targetCustomer,
      sale: sale || null,
    });
  };

  // Keyboard shortcut for quick global search: '/' or 'Ctrl+K' / 'Cmd+K'
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is already typing in an input/textarea/select
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if ((e.key === '/' && !isInput) || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // During initial auth session verification or startup splash, show clean splash screen
  if (isAuthChecking || showSplash) {
    return <SplashScreen businessName={business?.name || 'Smartcore ICT Centre'} />;
  }

  // When unauthenticated, show the AuthScreen. Dashboard and workspace are completely blocked!
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 selection:bg-purple-100 dark:selection:bg-purple-900 selection:text-purple-900 dark:selection:text-purple-100 transition-colors duration-200">
      {/* Top Bar Contract compliant Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRecordSale={() => setIsRecordSaleOpen(true)}
        onOpenRecordExpense={() => setIsRecordExpenseOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 lg:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenRecordSale={() => setIsRecordSaleOpen(true)}
            onOpenRecordExpense={() => setIsRecordExpenseOpen(true)}
            onOpenAddProduct={() => setActiveTab('products')}
            onViewSaleReceipt={handleViewReceipt}
            onOpenCollectDebt={handleOpenCollectDebt}
            onOpenPaySupplier={handleOpenPaySupplier}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'sales' && (
          <SalesView
            onOpenRecordSale={() => setIsRecordSaleOpen(true)}
            onViewReceipt={handleViewReceipt}
            onOpenCollectDebt={handleOpenCollectDebt}
            onOpenWhatsAppReminder={(customer, sale) => handleOpenWhatsAppReminder(customer, sale)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            onOpenRecordExpense={() => setIsRecordExpenseOpen(true)}
            onNavigateToRecurring={() => setActiveTab('recurring')}
            onOpenPaySupplier={handleOpenPaySupplier}
          />
        )}

        {activeTab === 'recurring' && (
          <ExpensesView
            initialSubTab="recurring"
            onOpenRecordExpense={() => setIsRecordExpenseOpen(true)}
            onOpenPaySupplier={handleOpenPaySupplier}
          />
        )}

        {activeTab === 'payables' && (
          <ExpensesView
            initialSubTab="payables"
            onOpenRecordExpense={() => setIsRecordExpenseOpen(true)}
            onOpenPaySupplier={handleOpenPaySupplier}
          />
        )}

        {activeTab === 'reconciliation' && (
          <ExpensesView
            initialSubTab="reconciliation"
            onOpenRecordExpense={() => setIsRecordExpenseOpen(true)}
            onOpenPaySupplier={handleOpenPaySupplier}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            onOpenCollectDebt={handleOpenCollectDebt}
            onViewSaleReceipt={handleViewReceipt}
            onOpenWhatsAppReminder={(customer, sale) => handleOpenWhatsAppReminder(customer, sale)}
          />
        )}

        {activeTab === 'products' && <ProductsView />}

        {activeTab === 'ledger' && <LedgerView />}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Floating Action Button (FAB) for Instant 1-Tap Entry on Phones */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30 flex flex-col gap-2 no-print">
        <button
          onClick={() => setIsRecordSaleOpen(true)}
          className="w-13 h-13 rounded-full bg-[#4C0196] text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer"
          title="Quick Sale"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMoreMenu={() => setIsMoreDrawerOpen(true)}
      />

      {/* Mobile More Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => {
          setIsMoreDrawerOpen(false);
          setIsLoginOpen(true);
        }}
      />

      {/* Modals */}
      <RecordSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => setIsRecordSaleOpen(false)}
        onSuccess={sale => {
          showToast(`Sale recorded successfully! Invoice #${sale.invoiceNumber}`);
          handleViewReceipt(sale);
        }}
      />

      <RecordExpenseModal
        isOpen={isRecordExpenseOpen}
        onClose={() => setIsRecordExpenseOpen(false)}
        onSuccess={() => {
          showToast('Expense recorded successfully.');
        }}
      />

      <RecordDebtPaymentModal
        isOpen={debtModalConfig.isOpen}
        onClose={() =>
          setDebtModalConfig({ isOpen: false, targetType: 'customer', targetItem: null })
        }
        targetType={debtModalConfig.targetType}
        targetItem={debtModalConfig.targetItem}
        onSuccess={() => {
          showToast(
            debtModalConfig.targetType === 'customer'
              ? 'Customer debt payment recorded & balance updated.'
              : 'Supplier payment recorded & expense logged.'
          );
        }}
      />

      <SaleReceiptModal
        isOpen={receiptModalConfig.isOpen}
        onClose={() => setReceiptModalConfig({ isOpen: false, sale: null })}
        sale={receiptModalConfig.sale}
        onOpenWhatsAppReminder={sale => handleOpenWhatsAppReminder(null, sale)}
      />

      {/* WhatsApp Customer Debt Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={whatsAppReminderConfig.isOpen}
        onClose={() => setWhatsAppReminderConfig({ isOpen: false, customer: null, sale: null })}
        customer={whatsAppReminderConfig.customer}
        sale={whatsAppReminderConfig.sale}
      />

      {/* Global Instant Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToTab={tab => {
          setActiveTab(tab);
          setIsSearchOpen(false);
        }}
        onViewSaleReceipt={sale => {
          setIsSearchOpen(false);
          handleViewReceipt(sale);
        }}
        onSelectCustomer={customer => {
          setIsSearchOpen(false);
          setActiveTab('customers');
          handleOpenCollectDebt(customer);
        }}
        onSelectPayable={payable => {
          setIsSearchOpen(false);
          setActiveTab('payables');
          handleOpenPaySupplier(payable);
        }}
      />

      {/* BizFlow Authentication & Session Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BusinessProvider>
      <AppContent />
    </BusinessProvider>
  );
}
