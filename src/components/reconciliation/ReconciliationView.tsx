import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  formatCurrency,
  formatDate,
  getTodayDateString,
  getCurrentTimeString,
  calculateExpectedCash,
  calculateReconciliationVariance,
  roundToKobo,
} from '../../utils/calculations';
import { DailyReconciliation } from '../../types';
import {
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Calendar,
  CreditCard,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  History,
  FileText,
  AlertCircle,
} from 'lucide-react';

const VARIANCE_REASONS = [
  'Cash drawer shortage / unverified discrepancy',
  'Customer paid cash but transaction entered after count',
  'Physical counting or small change rounding difference',
  'Cash expense voucher not yet entered in ledger',
  'Change issued incorrectly during high-rush hours',
  'Personal cash withdrawal / unrecorded owner draw',
  'Other reason (see reconciliation notes below)',
];

export const ReconciliationView: React.FC = () => {
  const {
    business,
    currentUser,
    reconciliations,
    openBusinessDay,
    closeBusinessDay,
    calculateSystemDayTotals,
    hasPermission,
  } = useBusiness();

  const today = getTodayDateString();
  const canManage = hasPermission('manage_reconciliation');
  const canView = hasPermission('view_reconciliation');

  // Form states for Opening
  const [openingFloat, setOpeningFloat] = useState<string>('20000');
  const [openingNotes, setOpeningNotes] = useState<string>('');
  const [isOpeningSubmitting, setIsOpeningSubmitting] = useState<boolean>(false);

  // Form states for Closing
  const [actualCashCounted, setActualCashCounted] = useState<string>('');
  const [actualPosSettlement, setActualPosSettlement] = useState<string>('');
  const [actualTransferSettlement, setActualTransferSettlement] = useState<string>('');
  const [cashDrop, setCashDrop] = useState<string>('0');
  const [varianceReason, setVarianceReason] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Selected date for viewing history
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(today);

  // Active or selected reconciliation record
  const currentRecon = useMemo(() => {
    return reconciliations.find(r => r.date === selectedHistoryDate);
  }, [reconciliations, selectedHistoryDate]);

  // Real-time system day totals for selected date
  const systemTotals = useMemo(() => {
    return calculateSystemDayTotals(selectedHistoryDate);
  }, [calculateSystemDayTotals, selectedHistoryDate]);

  // Real-time expected cash calculation
  const computedExpectedCash = useMemo(() => {
    const floatVal = currentRecon ? currentRecon.openingFloat : roundToKobo(Number(openingFloat) || 0);
    const dropVal = roundToKobo(Number(cashDrop) || (currentRecon?.cashDrop || 0));
    return calculateExpectedCash(
      floatVal,
      systemTotals.systemCashSales,
      systemTotals.systemDebtCashCollected,
      systemTotals.systemCashExpenses,
      dropVal
    );
  }, [currentRecon, openingFloat, cashDrop, systemTotals]);

  // Real-time variance calculation for closing form
  const realTimeVariance = useMemo(() => {
    const counted = Number(actualCashCounted) || 0;
    return calculateReconciliationVariance(counted, computedExpectedCash);
  }, [actualCashCounted, computedExpectedCash]);

  if (!canView) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-2xs">
        <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Reconciliation Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          You do not have permission to view daily register balancing (view_reconciliation). Please contact your administrator.
        </p>
      </div>
    );
  }

  // Handle Day Opening
  const handleOpenDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Permission Denied: Only Managers and Business Owners can open business days.');
      return;
    }

    const floatNum = Number(openingFloat);
    if (isNaN(floatNum) || floatNum < 0) {
      alert('Please enter a valid non-negative opening float amount.');
      return;
    }

    setIsOpeningSubmitting(true);
    const res = openBusinessDay(floatNum, openingNotes.trim());
    setIsOpeningSubmitting(false);

    if (res.success) {
      setSelectedHistoryDate(today);
      setOpeningNotes('');
    } else {
      alert(res.message);
    }
  };

  // Handle Day Closing
  const handleCloseDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Permission Denied: Only Managers and Business Owners can close registers.');
      return;
    }

    if (!currentRecon) return;

    const countedNum = Number(actualCashCounted);
    if (isNaN(countedNum) || countedNum < 0) {
      alert('Please enter a valid actual cash counted figure.');
      return;
    }

    const variance = roundToKobo(countedNum - computedExpectedCash);

    if (Math.abs(variance) > 0.01 && !varianceReason.trim()) {
      alert(
        `Discrepancy detected (${variance > 0 ? '+' : ''}${formatCurrency(variance, business.currencySymbol)}). A variance reason is required before locking the register.`
      );
      return;
    }

    const confirmMsg = `Are you sure you want to close and lock the register for ${currentRecon.date}?\n\nExpected Cash: ${formatCurrency(computedExpectedCash, business.currencySymbol)}\nActual Cash Counted: ${formatCurrency(countedNum, business.currencySymbol)}\nVariance: ${variance === 0 ? 'Balanced' : formatCurrency(variance, business.currencySymbol)}\n\nThis will record an audit trail and lock the day.`;

    if (!window.confirm(confirmMsg)) return;

    const res = closeBusinessDay(currentRecon.id, {
      actualCashCounted: countedNum,
      actualPosSettlement: Number(actualPosSettlement) || 0,
      actualTransferSettlement: Number(actualTransferSettlement) || 0,
      cashDrop: Number(cashDrop) || 0,
      varianceReason: varianceReason.trim() || undefined,
      reconciliationNotes: closingNotes.trim() || undefined,
    });

    if (res.success) {
      setActualCashCounted('');
      setActualPosSettlement('');
      setActualTransferSettlement('');
      setCashDrop('0');
      setVarianceReason('');
      setClosingNotes('');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Date Scope Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Business Reconciliation</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#4C0196]">
              {business.currency} Register
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Opening cash float, real-time transaction verification, POS settlement balancing, and end-of-day register closing
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <Calendar className="w-4 h-4 text-slate-500 ml-1" />
          <span className="text-[11px] font-semibold text-slate-600">Register Date:</span>
          <select
            value={selectedHistoryDate}
            onChange={e => setSelectedHistoryDate(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value={today}>Today ({formatDate(today)})</option>
            {reconciliations
              .filter(r => r.date !== today)
              .map(r => (
                <option key={r.id} value={r.date}>
                  {formatDate(r.date)} ({r.status.toUpperCase()})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* STATE 1: REGISTER NOT OPENED YET FOR SELECTED DATE */}
      {!currentRecon && selectedHistoryDate === today && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-xl mx-auto shadow-2xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#4C0196] flex items-center justify-center mx-auto shadow-2xs">
              <Unlock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Open Business Register for Today</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Record the physical opening cash float in the till before transactions are processed.
            </p>
          </div>

          <form onSubmit={handleOpenDay} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Cash Float ({business.currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">
                  {business.currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingFloat}
                  onChange={e => setOpeningFloat(e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full pl-8 pr-3 py-2.5 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:outline-hidden"
                  required
                  disabled={!canManage}
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Cash available in drawer for giving change at start of business.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Note (Optional)</label>
              <input
                type="text"
                value={openingNotes}
                onChange={e => setOpeningNotes(e.target.value)}
                placeholder="e.g. Handed over from morning cashier change box"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:outline-hidden"
                disabled={!canManage}
              />
            </div>

            <div className="pt-2">
              {canManage ? (
                <button
                  type="submit"
                  disabled={isOpeningSubmitting}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Start Business Day (Open Register)</span>
                </button>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-center">
                  Only Managers and Business Owners possess register opening authority (manage_reconciliation).
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* STATE 2: REGISTER NOT FOUND FOR PAST DATE */}
      {!currentRecon && selectedHistoryDate !== today && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto shadow-2xs space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Register Record for {formatDate(selectedHistoryDate)}</h3>
          <p className="text-xs text-slate-500">
            No formal reconciliation was opened or recorded for this specific date.
          </p>
          <button
            onClick={() => setSelectedHistoryDate(today)}
            className="mt-2 px-4 py-2 text-xs font-semibold text-[#4C0196] bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer"
          >
            Return to Today
          </button>
        </div>
      )}

      {/* STATE 3: ACTIVE OR CLOSED RECONCILIATION DETAIL */}
      {currentRecon && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              currentRecon.status === 'closed'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-purple-50/70 border-purple-200 text-purple-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  currentRecon.status === 'closed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#4C0196] text-white'
                }`}
              >
                {currentRecon.status === 'closed' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    Register Status: {currentRecon.status === 'closed' ? 'CLOSED & BALANCED' : 'OPEN & IN PROGRESS'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({currentRecon.date})</span>
                </div>
                <div className="text-xs opacity-80 flex flex-wrap items-center gap-3 mt-0.5">
                  <span>Opened by: <b>{currentRecon.openedByUserName}</b></span>
                  {currentRecon.closedAt && (
                    <span>· Closed by: <b>{currentRecon.closedByUserName}</b> at {currentRecon.closedAt.slice(11, 16)}</span>
                  )}
                </div>
              </div>
            </div>

            {currentRecon.status === 'closed' ? (
              <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Locked Archive</span>
              </span>
            ) : (
              <span className="self-start sm:self-auto px-3 py-1 bg-purple-100 text-[#4C0196] rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>Live Register Active</span>
              </span>
            )}
          </div>

          {/* GRID OF POSITION TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Opening Float */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                <span>Opening Cash Float</span>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {formatCurrency(currentRecon.openingFloat, business.currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Start of day till float</span>
            </div>

            {/* System Cash Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                <span>Cash Sales Recorded</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                {formatCurrency(
                  currentRecon.status === 'closed' ? currentRecon.systemCashSales : systemTotals.systemCashSales,
                  business.currencySymbol
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Cash paid at sales counter</span>
            </div>

            {/* Cash Expenses */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                <span>Cash Paid Out (Expenses)</span>
                <ArrowUpRight className="w-4 h-4 text-[#7B001C]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#7B001C] tabular-nums">
                {formatCurrency(
                  currentRecon.status === 'closed' ? currentRecon.systemCashExpenses : systemTotals.systemCashExpenses,
                  business.currencySymbol
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Generator, supplies, petty cash</span>
            </div>

            {/* Expected Cash In Hand */}
            <div className="bg-white p-4 rounded-xl border-2 border-purple-200 shadow-2xs bg-purple-50/20">
              <div className="flex items-center justify-between text-purple-900 mb-1 text-xs font-bold">
                <span>Expected Cash in Till</span>
                <ShieldCheck className="w-4 h-4 text-[#4C0196]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#4C0196] tabular-nums">
                {formatCurrency(
                  currentRecon.status === 'closed' ? currentRecon.expectedCashInHand : computedExpectedCash,
                  business.currencySymbol
                )}
              </div>
              <span className="text-[11px] text-purple-700 mt-1 block font-medium">Float + Inflows - Outflows</span>
            </div>
          </div>

          {/* SYSTEM CHANNEL BREAKDOWN TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's System Payment Channel Breakdown</h3>
                <p className="text-xs text-slate-500">Summary of all validated transactions by settlement method</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Date: {currentRecon.date}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Cash Transactions */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Physical Cash Drawer</span>
                  </span>
                  <span className="font-mono text-emerald-700">
                    {formatCurrency(
                      currentRecon.status === 'closed'
                        ? currentRecon.systemCashSales + currentRecon.systemDebtCashCollected
                        : systemTotals.systemCashSales + systemTotals.systemDebtCashCollected,
                      business.currencySymbol
                    )}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>Cash Sales:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(currentRecon.status === 'closed' ? currentRecon.systemCashSales : systemTotals.systemCashSales, business.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Debt Collected:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(currentRecon.status === 'closed' ? currentRecon.systemDebtCashCollected : systemTotals.systemDebtCashCollected, business.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* POS / Card Settlement */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>POS / Card Terminal</span>
                  </span>
                  <span className="font-mono text-blue-700">
                    {formatCurrency(
                      currentRecon.status === 'closed' ? currentRecon.systemPosSales : systemTotals.systemPosSales,
                      business.currencySymbol
                    )}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>System POS Billed:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(currentRecon.status === 'closed' ? currentRecon.systemPosSales : systemTotals.systemPosSales, business.currencySymbol)}
                    </span>
                  </div>
                  {currentRecon.status === 'closed' && (
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Counted POS Slip:</span>
                      <span className="font-mono">{formatCurrency(currentRecon.actualPosSettlement, business.currencySymbol)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Transfer Inflows */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span>Bank Transfer Credits</span>
                  </span>
                  <span className="font-mono text-purple-700">
                    {formatCurrency(
                      currentRecon.status === 'closed' ? currentRecon.systemTransferSales : systemTotals.systemTransferSales,
                      business.currencySymbol
                    )}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>System Direct Transfer:</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(currentRecon.status === 'closed' ? currentRecon.systemTransferSales : systemTotals.systemTransferSales, business.currencySymbol)}
                    </span>
                  </div>
                  {currentRecon.status === 'closed' && (
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Bank Statement Inflow:</span>
                      <span className="font-mono">{formatCurrency(currentRecon.actualTransferSettlement, business.currencySymbol)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CLOSING SECTION: ACTIVE FORM OR CLOSED RECORD */}
          {currentRecon.status === 'open' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">End-of-Day Physical Count &amp; Register Closing</h3>
                  <p className="text-xs text-slate-500">
                    Count all physical cash notes in the drawer and reconcile against POS terminal slips.
                  </p>
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                  Step 2 of 2: Closing
                </span>
              </div>

              <form onSubmit={handleCloseDay} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Actual Cash Counted */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Actual Physical Cash Counted *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                        {business.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={actualCashCounted}
                        onChange={e => setActualCashCounted(e.target.value)}
                        placeholder="e.g. 85000"
                        className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:outline-hidden"
                        required
                        disabled={!canManage}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Sum of all currency notes &amp; coins in till.
                    </span>
                  </div>

                  {/* POS Settlement Slip Total */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      POS Terminal Settlement EOD Slip
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                        {business.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={actualPosSettlement}
                        onChange={e => setActualPosSettlement(e.target.value)}
                        placeholder="e.g. 10000"
                        className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:outline-hidden"
                        disabled={!canManage}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Total from POS terminal End-of-Day printout.
                    </span>
                  </div>

                  {/* Cash Drop / Bank Deposit */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cash Drop / Banked Outflow
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                        {business.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashDrop}
                        onChange={e => setCashDrop(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:outline-hidden"
                        disabled={!canManage}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Cash removed to safe or deposited into bank.
                    </span>
                  </div>
                </div>

                {/* REAL-TIME VARIANCE DISPLAY */}
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    actualCashCounted === ''
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : realTimeVariance.isBalanced
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : realTimeVariance.status === 'surplus'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {actualCashCounted === ''
                        ? 'Cash Balancing Status'
                        : realTimeVariance.isBalanced
                        ? '✓ Drawer Perfectly Balanced'
                        : realTimeVariance.status === 'surplus'
                        ? '⚠ Cash Surplus (Overage)'
                        : '⚠ Cash Shortage (Deficit)'}
                    </span>
                    <div className="text-xs mt-0.5 opacity-90">
                      Expected in Till: <span className="font-mono font-bold">{formatCurrency(computedExpectedCash, business.currencySymbol)}</span>
                      {' · '}
                      Counted in Hand:{' '}
                      <span className="font-mono font-bold">
                        {actualCashCounted !== '' ? formatCurrency(Number(actualCashCounted) || 0, business.currencySymbol) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs opacity-75 block">Variance</span>
                    <span className="text-xl font-bold font-mono tabular-nums">
                      {actualCashCounted === ''
                        ? '—'
                        : realTimeVariance.variance === 0
                        ? `${business.currencySymbol}0.00`
                        : `${realTimeVariance.variance > 0 ? '+' : ''}${formatCurrency(realTimeVariance.variance, business.currencySymbol)}`}
                    </span>
                  </div>
                </div>

                {/* VARIANCE EXPLANATION IF NON-ZERO */}
                {!realTimeVariance.isBalanced && actualCashCounted !== '' && (
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Variance Explanation Mandatory Before Closing</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Select Reason for Discrepancy *
                      </label>
                      <select
                        value={varianceReason}
                        onChange={e => setVarianceReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-[#4C0196] focus:outline-hidden"
                        required
                        disabled={!canManage}
                      >
                        <option value="">-- Choose verified explanation --</option>
                        {VARIANCE_REASONS.map(reason => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reconciliation Notes &amp; Actions Taken
                      </label>
                      <textarea
                        rows={2}
                        value={closingNotes}
                        onChange={e => setClosingNotes(e.target.value)}
                        placeholder="Detail the cashier, shift handoff, or corrective investigation steps..."
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-[#4C0196] focus:outline-hidden"
                        disabled={!canManage}
                      />
                    </div>
                  </div>
                )}

                {/* Closing Action Button */}
                <div className="pt-2">
                  {canManage ? (
                    <button
                      type="submit"
                      disabled={actualCashCounted === ''}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Verify &amp; Close Business Day Register</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-center">
                      Only Managers and Business Owners possess register closing authority (manage_reconciliation).
                    </div>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* CLOSED REGISTER AUDIT SUMMARY */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Certified Register Closing Record</h3>
                  <p className="text-xs text-slate-500">Official archived numbers certified at end of business</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Audited Closing</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Expected Cash in Till</span>
                  <span className="text-lg font-bold font-mono text-slate-800">
                    {formatCurrency(currentRecon.expectedCashInHand, business.currencySymbol)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Actual Physical Count</span>
                  <span className="text-lg font-bold font-mono text-slate-800">
                    {formatCurrency(currentRecon.actualCashCounted, business.currencySymbol)}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    currentRecon.cashVariance === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : currentRecon.cashVariance > 0
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <span className="block mb-0.5 opacity-80">Closing Cash Variance</span>
                  <span className="text-lg font-bold font-mono">
                    {currentRecon.cashVariance === 0
                      ? 'Balanced (₦0.00)'
                      : `${currentRecon.cashVariance > 0 ? '+' : ''}${formatCurrency(currentRecon.cashVariance, business.currencySymbol)}`}
                  </span>
                </div>
              </div>

              {currentRecon.varianceReason && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Discrepancy Explanation Note:</span>
                  </span>
                  <p className="text-amber-800 pl-4">{currentRecon.varianceReason}</p>
                  {currentRecon.reconciliationNotes && (
                    <p className="text-amber-700 text-[11px] pl-4 italic">
                      "{currentRecon.reconciliationNotes}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* HISTORICAL RECONCILIATIONS LOG */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#4C0196]" />
                <h3 className="text-sm font-bold text-slate-900">Historical Register Closings</h3>
              </div>
              <span className="text-xs text-slate-400">{reconciliations.length} days recorded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Opened By</th>
                    <th className="py-2.5 px-3">Opening Float</th>
                    <th className="py-2.5 px-3">Cash Sales</th>
                    <th className="py-2.5 px-3">Expected</th>
                    <th className="py-2.5 px-3">Counted</th>
                    <th className="py-2.5 px-3">Variance</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciliations.map(rec => {
                    const isSelected = rec.date === selectedHistoryDate;
                    return (
                      <tr
                        key={rec.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-purple-50/40 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-800">{rec.date}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === 'closed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-[#4C0196]'
                            }`}
                          >
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{rec.openedByUserName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {formatCurrency(rec.openingFloat, business.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700">
                          {formatCurrency(rec.systemCashSales, business.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 font-bold">
                          {formatCurrency(rec.expectedCashInHand, business.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">
                          {rec.status === 'closed'
                            ? formatCurrency(rec.actualCashCounted, business.currencySymbol)
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {rec.status === 'closed' ? (
                            <span
                              className={
                                rec.cashVariance === 0
                                  ? 'text-emerald-600 font-semibold'
                                  : rec.cashVariance > 0
                                  ? 'text-amber-600 font-bold'
                                  : 'text-rose-600 font-bold'
                              }
                            >
                              {rec.cashVariance === 0
                                ? 'Balanced'
                                : `${rec.cashVariance > 0 ? '+' : ''}${formatCurrency(rec.cashVariance, business.currencySymbol)}`}
                            </span>
                          ) : (
                            <span className="text-slate-400">In Progress</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryDate(rec.date)}
                            className="text-xs font-semibold text-[#4C0196] hover:underline cursor-pointer"
                          >
                            {isSelected ? 'Viewing' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
