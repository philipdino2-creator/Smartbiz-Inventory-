import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  FileText,
  Printer,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { business, sales, expenses, customers, payables, currentUser, hasPermission } = useBusiness();

  const canViewReports = hasPermission('view_reports');
  const canViewProfit = hasPermission('view_profit');
  const canExport = hasPermission('export_financial_data');

  const [reportType, setReportType] = useState<'pnl' | 'sales' | 'expenses' | 'debtors' | 'payables'>('pnl');
  const [dateRange, setDateRange] = useState<'this_month' | 'all_time'>('this_month');

  // Filter datasets by date range
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  const activeSales = useMemo(() => {
    if (dateRange === 'this_month') {
      return sales.filter(s => s.date.startsWith(currentMonthPrefix));
    }
    return sales;
  }, [sales, dateRange, currentMonthPrefix]);

  const activeExpenses = useMemo(() => {
    if (dateRange === 'this_month') {
      return expenses.filter(e => e.date.startsWith(currentMonthPrefix));
    }
    return expenses;
  }, [expenses, dateRange, currentMonthPrefix]);

  // P&L Calculations with strict VAT and Net Operating Revenue Separation
  // Gross Invoiced: Total billed to customers (includes statutory tax liability)
  const grossInvoiced = activeSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  // Total VAT: Tax collected on behalf of the tax authority (FIRS in Nigeria), excluded from turnover
  const totalVat = activeSales.reduce((sum, s) => sum + (Number(s.taxAmount) || 0), 0);
  // Net Operating Revenue: True business turnover
  const operatingRevenue = Math.max(0, grossInvoiced - totalVat);

  const totalCogs = activeSales.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);
  }, 0);
  const grossProfit = operatingRevenue - totalCogs;
  const grossMargin = operatingRevenue > 0 ? (grossProfit / operatingRevenue) * 100 : 0;

  const totalExpenses = activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const netMargin = operatingRevenue > 0 ? (netProfit / operatingRevenue) * 100 : 0;

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    activeExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [activeExpenses]);

  // Sales by payment channel
  const salesByChannel = useMemo(() => {
    const map: Record<string, number> = {};
    activeSales.forEach(s => {
      map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.amountPaid;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [activeSales]);

  // Debtor list
  const activeDebtors = useMemo(() => {
    return customers.filter(c => c.outstandingDebt > 0).sort((a, b) => b.outstandingDebt - a.outstandingDebt);
  }, [customers]);

  // Payables list
  const activePayables = useMemo(() => {
    return payables.filter(p => p.balanceDue > 0).sort((a, b) => b.balanceDue - a.balanceDue);
  }, [payables]);

  const handlePrint = () => {
    window.print();
  };

  const dateStamp = new Date().toISOString().slice(0, 10);
  const periodLabel = dateRange === 'this_month' ? 'This Month' : 'All Time';

  const handleExportCSV = () => {
    if (!canExport) {
      alert('Permission Denied: You do not have permission to export financial data (export_financial_data).');
      return;
    }

    if (reportType === 'pnl') {
      const headers = ['Line Item', 'Description / Details', 'Amount', 'Currency'];
      const rows = [
        ['1. Gross Invoiced Total', 'Customer Invoices Billed (Gross)', grossInvoiced, business.currency],
        ['2. Less: Statutory VAT (7.5%)', 'Tax Liability to FIRS (Excluded from Turnover)', -totalVat, business.currency],
        ['3. Net Operating Revenue', 'True Business Turnover', operatingRevenue, business.currency],
        ['4. Cost of Goods Sold (COGS)', 'Product Direct Costs', -totalCogs, business.currency],
        ['5. Gross Profit', `Margin: ${grossMargin.toFixed(2)}%`, grossProfit, business.currency],
        ...expenseByCategory.map(([cat, amt]) => ['Operating Expense', cat, -amt, business.currency]),
        ['6. Total Operating Expenses', 'Overheads & Running Costs', -totalExpenses, business.currency],
        ['7. Net Estimated Profit', `Net Margin: ${netMargin.toFixed(2)}%`, netProfit, business.currency],
      ];
      exportToCSV(`smartcore_pnl_report_${dateStamp}`, headers, rows);
    } else if (reportType === 'sales') {
      const headers = ['Invoice #', 'Date', 'Customer', 'Items', 'Total Amount', 'Amount Paid', 'Balance Due', 'Status', 'Method'];
      const rows = activeSales.map(s => [
        s.invoiceNumber,
        s.date,
        s.customerName,
        s.items.map(i => `${i.productName} (x${i.quantity})`).join('; '),
        s.totalAmount,
        s.amountPaid,
        s.balanceDue,
        s.paymentStatus.toUpperCase(),
        s.paymentMethod,
      ]);
      exportToCSV(`smartcore_sales_report_${dateStamp}`, headers, rows);
    } else if (reportType === 'expenses') {
      const headers = ['Date', 'Category', 'Description', 'Vendor / Payee', 'Amount', 'Payment Method', 'Reference #'];
      const rows = activeExpenses.map(e => [
        e.date,
        e.category,
        e.description,
        e.vendorName,
        e.amount,
        e.paymentMethod,
        e.referenceNumber || '',
      ]);
      exportToCSV(`smartcore_expenses_report_${dateStamp}`, headers, rows);
    } else if (reportType === 'debtors') {
      const headers = ['Customer Name', 'Phone', 'Total Purchases', 'Total Paid', 'Outstanding Debt', 'Status'];
      const rows = activeDebtors.map(c => [
        c.name,
        c.phone,
        c.totalPurchases,
        c.totalPaid,
        c.outstandingDebt,
        'OWES_MONEY',
      ]);
      exportToCSV(`smartcore_debtors_report_${dateStamp}`, headers, rows);
    } else {
      const headers = ['Vendor / Supplier', 'Phone', 'Description', 'Total Bill', 'Amount Paid', 'Remaining Balance', 'Due Date'];
      const rows = activePayables.map(p => [
        p.vendorName,
        p.vendorPhone || '',
        p.description,
        p.totalAmount,
        p.amountPaid,
        p.balanceDue,
        p.dueDate || '',
      ]);
      exportToCSV(`smartcore_payables_report_${dateStamp}`, headers, rows);
    }
  };

  const handleExportExcel = async () => {
    if (!canExport) {
      alert('Permission Denied: You do not have permission to export financial data (export_financial_data).');
      return;
    }

    if (reportType === 'pnl') {
      const headers = ['Line Item', 'Description / Details', 'Amount', 'Currency'];
      const rows = [
        ['1. Gross Invoiced Total', 'Customer Invoices Billed (Gross)', grossInvoiced, business.currency],
        ['2. Less: Statutory VAT (7.5%)', 'Tax Liability to FIRS (Excluded from Turnover)', -totalVat, business.currency],
        ['3. Net Operating Revenue', 'True Business Turnover', operatingRevenue, business.currency],
        ['4. Cost of Goods Sold (COGS)', 'Product Direct Costs', -totalCogs, business.currency],
        ['5. Gross Profit', `Margin: ${grossMargin.toFixed(2)}%`, grossProfit, business.currency],
        ...expenseByCategory.map(([cat, amt]) => ['Operating Expense', cat, -amt, business.currency]),
        ['6. Total Operating Expenses', 'Overheads & Running Costs', -totalExpenses, business.currency],
        ['7. Net Estimated Profit', `Net Margin: ${netMargin.toFixed(2)}%`, netProfit, business.currency],
      ];
      await exportToExcelXLSX(
        `smartcore_pnl_report_${dateStamp}`,
        'ProfitLossStatement',
        headers,
        rows,
        `${business.name} — Audited Profit & Loss Statement (${periodLabel})`
      );
    } else if (reportType === 'sales') {
      const headers = ['Invoice #', 'Date', 'Customer', 'Items', 'Total Amount', 'Amount Paid', 'Balance Due', 'Status', 'Method'];
      const rows = activeSales.map(s => [
        s.invoiceNumber,
        s.date,
        s.customerName,
        s.items.map(i => `${i.productName} (x${i.quantity})`).join('; '),
        s.totalAmount,
        s.amountPaid,
        s.balanceDue,
        s.paymentStatus.toUpperCase(),
        s.paymentMethod,
      ]);
      await exportToExcelXLSX(
        `smartcore_sales_report_${dateStamp}`,
        'SalesSummary',
        headers,
        rows,
        `${business.name} — Sales Revenue Report (${periodLabel})`
      );
    } else if (reportType === 'expenses') {
      const headers = ['Date', 'Category', 'Description', 'Vendor / Payee', 'Amount', 'Payment Method', 'Reference #'];
      const rows = activeExpenses.map(e => [
        e.date,
        e.category,
        e.description,
        e.vendorName,
        e.amount,
        e.paymentMethod,
        e.referenceNumber || '',
      ]);
      await exportToExcelXLSX(
        `smartcore_expenses_report_${dateStamp}`,
        'ExpensesSummary',
        headers,
        rows,
        `${business.name} — Expenses Breakdown Report (${periodLabel})`
      );
    } else if (reportType === 'debtors') {
      const headers = ['Customer Name', 'Phone', 'Total Purchases', 'Total Paid', 'Outstanding Debt', 'Status'];
      const rows = activeDebtors.map(c => [
        c.name,
        c.phone,
        c.totalPurchases,
        c.totalPaid,
        c.outstandingDebt,
        'OWES_MONEY',
      ]);
      await exportToExcelXLSX(
        `smartcore_debtors_report_${dateStamp}`,
        'DebtorBalances',
        headers,
        rows,
        `${business.name} — Customer Debt Balances & Receivables Aging`
      );
    } else {
      const headers = ['Vendor / Supplier', 'Phone', 'Description', 'Total Bill', 'Amount Paid', 'Remaining Balance', 'Due Date'];
      const rows = activePayables.map(p => [
        p.vendorName,
        p.vendorPhone || '',
        p.description,
        p.totalAmount,
        p.amountPaid,
        p.balanceDue,
        p.dueDate || '',
      ]);
      await exportToExcelXLSX(
        `smartcore_payables_report_${dateStamp}`,
        'SupplierPayables',
        headers,
        rows,
        `${business.name} — Supplier Payables & Liability Commitments`
      );
    }
  };

  const handleExportPDF = () => {
    if (!canExport) {
      alert('Permission Denied: You do not have permission to export financial data (export_financial_data).');
      return;
    }

    const bizInfo = {
      name: business.name,
      address: business.address,
      phone: business.phone,
      email: business.email,
    };

    if (reportType === 'pnl') {
      const pnlRows = [
        ['1. Gross Invoiced Total', 'Billed Customer Invoices', formatCurrency(grossInvoiced, business.currencySymbol)],
        ['2. Less: Statutory VAT (7.5%)', 'FIRS Tax Liability (Excluded from Turnover)', `(${formatCurrency(totalVat, business.currencySymbol)})`],
        ['3. Net Operating Revenue', 'True Business Turnover', formatCurrency(operatingRevenue, business.currencySymbol)],
        ['4. Cost of Goods Sold (COGS)', 'Product Direct Inventory Costs', `(${formatCurrency(totalCogs, business.currencySymbol)})`],
        ['5. GROSS PROFIT', `Gross Margin: ${grossMargin.toFixed(1)}%`, formatCurrency(grossProfit, business.currencySymbol)],
        ...expenseByCategory.map(([cat, amt]) => [
          `6. Operating Overhead: ${cat}`,
          'Recurring & Facility Expenses',
          `(${formatCurrency(amt, business.currencySymbol)})`,
        ]),
        ['7. Total Operating Expenses', 'Total Operational Costs', `(${formatCurrency(totalExpenses, business.currencySymbol)})`],
        ['8. NET ESTIMATED PROFIT', `Net Profit Margin: ${netMargin.toFixed(1)}%`, formatCurrency(netProfit, business.currencySymbol)],
      ];
      const totalsSummary = [
        { label: 'Gross Invoiced Total:', value: formatCurrency(grossInvoiced, business.currencySymbol) },
        { label: 'Statutory VAT (7.5%):', value: `(${formatCurrency(totalVat, business.currencySymbol)})` },
        { label: 'Net Operating Revenue:', value: formatCurrency(operatingRevenue, business.currencySymbol) },
        { label: 'Gross Profit:', value: formatCurrency(grossProfit, business.currencySymbol) },
        { label: 'Operating Expenses:', value: `(${formatCurrency(totalExpenses, business.currencySymbol)})` },
        { label: 'Net Profit:', value: formatCurrency(netProfit, business.currencySymbol) },
      ];
      exportToPDF(
        `smartcore_pnl_report_${dateStamp}`,
        'Profit & Loss Statement (P&L)',
        `Reporting Period: ${periodLabel} · Official Accounting Summary`,
        ['Accounting Line Item', 'Category / Details', 'Amount'],
        pnlRows,
        totalsSummary,
        bizInfo
      );
    } else if (reportType === 'sales') {
      const rows = activeSales.map(s => [
        s.invoiceNumber,
        s.date,
        s.customerName,
        formatCurrency(s.totalAmount, business.currencySymbol),
        formatCurrency(s.amountPaid, business.currencySymbol),
        s.paymentStatus.toUpperCase(),
      ]);
      exportToPDF(
        `smartcore_sales_report_${dateStamp}`,
        'Sales Revenue & Invoices Report',
        `Reporting Period: ${periodLabel} · ${activeSales.length} Invoices`,
        ['Invoice #', 'Date', 'Customer', 'Total', 'Paid', 'Status'],
        rows,
        [{ label: 'Total Invoiced:', value: formatCurrency(grossInvoiced, business.currencySymbol) }],
        bizInfo
      );
    } else if (reportType === 'expenses') {
      const rows = activeExpenses.map(e => [
        e.date,
        e.category,
        e.description,
        e.vendorName,
        formatCurrency(e.amount, business.currencySymbol),
      ]);
      exportToPDF(
        `smartcore_expenses_report_${dateStamp}`,
        'Operating Expenses Breakdown Report',
        `Reporting Period: ${periodLabel} · ${activeExpenses.length} Records`,
        ['Date', 'Category', 'Description', 'Vendor / Payee', 'Amount'],
        rows,
        [{ label: 'Total Expenses:', value: formatCurrency(totalExpenses, business.currencySymbol) }],
        bizInfo
      );
    } else if (reportType === 'debtors') {
      const rows = activeDebtors.map(c => [
        c.name,
        c.phone,
        formatCurrency(c.totalPurchases, business.currencySymbol),
        formatCurrency(c.totalPaid, business.currencySymbol),
        formatCurrency(c.outstandingDebt, business.currencySymbol),
      ]);
      const totalDebt = activeDebtors.reduce((s, c) => s + c.outstandingDebt, 0);
      exportToPDF(
        `smartcore_debtors_report_${dateStamp}`,
        'Customer Debt Aging & Receivables Report',
        `${activeDebtors.length} Customers with Unsettled Balances`,
        ['Customer', 'Phone', 'Purchases', 'Total Paid', 'Outstanding Debt'],
        rows,
        [{ label: 'Total Receivables:', value: formatCurrency(totalDebt, business.currencySymbol) }],
        bizInfo
      );
    } else {
      const rows = activePayables.map(p => [
        p.vendorName,
        p.description,
        formatCurrency(p.totalAmount, business.currencySymbol),
        formatCurrency(p.amountPaid, business.currencySymbol),
        formatCurrency(p.balanceDue, business.currencySymbol),
        p.dueDate ? formatDate(p.dueDate) : '—',
      ]);
      const totalPayableDebt = activePayables.reduce((s, p) => s + p.balanceDue, 0);
      exportToPDF(
        `smartcore_payables_report_${dateStamp}`,
        'Supplier Liabilities & Payables Report',
        `${activePayables.length} Unsettled Vendor Liabilities`,
        ['Vendor', 'Description', 'Total Owed', 'Paid', 'Balance Due', 'Due Date'],
        rows,
        [{ label: 'Total Liabilities:', value: formatCurrency(totalPayableDebt, business.currencySymbol) }],
        bizInfo
      );
    }
  };

  // General Report Permission Check: Users without view_reports cannot access ReportsView
  if (!canViewReports) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-2xs">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Reports Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          You do not have permission to access financial and operational reports (view_reports). Please contact your business owner.
        </p>
      </div>
    );
  }

  // Executive P&L Permission Check: Users without view_profit cannot access Profit & Loss
  if (!canViewProfit && reportType === 'pnl') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-2xs">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Restricted Executive Report</h2>
        <p className="text-xs text-slate-500 mt-1">
          Full business Profit &amp; Loss statements are restricted to Managers and Business Owners. Please select Sales, Expenses, or Debtors reports.
        </p>
        <button
          onClick={() => setReportType('sales')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-[#4C0196] bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer"
        >
          View Sales Report Instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Reports &amp; Financials</h1>
          <p className="text-xs text-slate-500">Audited Profit &amp; Loss statement, sales channels, and debt aging reports</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label="Export Report"
          />
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Type & Range Selectors */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        {/* Report Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setReportType('pnl')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              reportType === 'pnl' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profit &amp; Loss (P&amp;L)
          </button>
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              reportType === 'sales' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales by Channel
          </button>
          <button
            onClick={() => setReportType('debtors')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              reportType === 'debtors' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Debtors
          </button>
          <button
            onClick={() => setReportType('payables')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              reportType === 'payables' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supplier Payables
          </button>
        </div>

        {/* Date Scope */}
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value as any)}
          className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shrink-0"
        >
          <option value="this_month">This Month (Current)</option>
          <option value="all_time">All Time (Full History)</option>
        </select>
      </div>

      {/* REPORT CONTENT: PROFIT & LOSS STATEMENT */}
      {reportType === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-xs font-bold text-[#4C0196] uppercase tracking-wider">
                {business.name} · Official Statement
              </span>
              <h2 className="text-xl font-bold text-slate-900">Profit &amp; Loss Statement</h2>
              <p className="text-xs text-slate-500">
                Period: {dateRange === 'this_month' ? `This Month (${currentMonthPrefix})` : 'All Available Records'} · Africa/Lagos
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Generated: {formatDate(new Date().toISOString().slice(0, 10))}</span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="space-y-6 text-xs">
            {/* Revenue Section with VAT separation */}
            <div>
              <div className="flex justify-between py-2 border-b border-slate-200 font-bold text-slate-900 text-sm">
                <span>1. Net Operating Revenue (Turnover)</span>
                <span className="font-mono text-[#4C0196]">{formatCurrency(operatingRevenue, business.currencySymbol)}</span>
              </div>
              <div className="space-y-1 pt-1.5 pl-4">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Invoiced Sales ({activeSales.length} customer invoices)</span>
                  <span className="font-mono">{formatCurrency(grossInvoiced, business.currencySymbol)}</span>
                </div>
                {totalVat > 0 && (
                  <div className="flex justify-between text-purple-700 bg-purple-50/60 px-2 py-1 rounded">
                    <span>Less: 7.5% Statutory VAT Collected (FIRS Tax Liability)</span>
                    <span className="font-mono">-{formatCurrency(totalVat, business.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-100">
                  <span>Net Turnover Base (Excluding VAT Liability)</span>
                  <span className="font-mono text-[#4C0196]">{formatCurrency(operatingRevenue, business.currencySymbol)}</span>
                </div>
              </div>
            </div>

            {/* COGS */}
            <div>
              <div className="flex justify-between py-2 border-b border-slate-200 font-semibold text-slate-800">
                <span>2. Cost of Goods Sold (Direct Course Materials / Hardware Costs)</span>
                <span className="font-mono text-slate-700">-{formatCurrency(totalCogs, business.currencySymbol)}</span>
              </div>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 text-sm">GROSS PROFIT</span>
                <span className="text-[11px] text-purple-900 ml-2 font-medium">
                  (Gross Margin: {grossMargin.toFixed(1)}%)
                </span>
              </div>
              <span className="text-base font-bold font-mono text-[#4C0196] tabular-nums">
                {formatCurrency(grossProfit, business.currencySymbol)}
              </span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="flex justify-between py-2 border-b border-slate-200 font-bold text-slate-900 text-sm">
                <span>3. Operating Expenses (OPEX)</span>
                <span className="font-mono text-[#7B001C]">-{formatCurrency(totalExpenses, business.currencySymbol)}</span>
              </div>

              <div className="divide-y divide-slate-100 pl-4">
                {expenseByCategory.map(([cat, amount]) => (
                  <div key={cat} className="py-1.5 flex justify-between text-slate-600">
                    <span>{cat}</span>
                    <span className="font-mono">{formatCurrency(amount, business.currencySymbol)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NET ESTIMATED PROFIT */}
            <div className={`p-4 rounded-xl border-2 flex justify-between items-center ${
              netProfit >= 0
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                : 'bg-rose-50/80 border-rose-300 text-rose-900'
            }`}>
              <div>
                <div className="text-base font-bold">ESTIMATED NET OPERATING PROFIT</div>
                <div className="text-xs mt-0.5 opacity-80">
                  Revenue minus Direct COGS minus All Facility Operating Expenses (Net Margin: {netMargin.toFixed(1)}%)
                </div>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums">
                {formatCurrency(netProfit, business.currencySymbol)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: SALES BY CHANNEL */}
      {reportType === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900">Collections by Payment Method</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {salesByChannel.map(([channel, total]) => (
              <div key={channel} className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-slate-800">{channel}</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(total, business.currencySymbol)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT CONTENT: DEBTORS */}
      {reportType === 'debtors' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Customer Debts &amp; Receivables Aging</h2>
            <span className="font-mono font-bold text-[#7B001C] text-sm">
              Total: {formatCurrency(activeDebtors.reduce((sum, d) => sum + d.outstandingDebt, 0), business.currencySymbol)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Total Invoiced</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Debt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDebtors.map(debtor => (
                  <tr key={debtor.id}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{debtor.name}</td>
                    <td className="py-2 px-3 text-slate-600">{debtor.phone}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(debtor.totalPurchases, business.currencySymbol)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatCurrency(debtor.totalPaid, business.currencySymbol)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#7B001C]">{formatCurrency(debtor.outstandingDebt, business.currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: PAYABLES */}
      {reportType === 'payables' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Supplier Payables Aging &amp; Commitments</h2>
            <span className="font-mono font-bold text-[#7B001C] text-sm">
              Total: {formatCurrency(activePayables.reduce((sum, p) => sum + p.balanceDue, 0), business.currencySymbol)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Total Bill</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePayables.map(payable => (
                  <tr key={payable.id}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{payable.vendorName}</td>
                    <td className="py-2 px-3 text-slate-600">{payable.description}</td>
                    <td className="py-2 px-3 text-slate-600">{payable.dueDate ? formatDate(payable.dueDate) : 'N/A'}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(payable.totalAmount, business.currencySymbol)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatCurrency(payable.amountPaid, business.currencySymbol)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#7B001C]">{formatCurrency(payable.balanceDue, business.currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
