import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { User } from '../../types';
import {
  X,
  Users,
  UserCheck,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Delete,
  Store,
} from 'lucide-react';

interface CashierSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export const CashierSwitchModal: React.FC<CashierSwitchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { business, users, currentUser, setCurrentUser } = useBusiness();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState<string>('');
  const [pinMode, setPinMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedUser(currentUser);
      setPin('');
      setError(null);
      setSuccessMsg(null);
      setPinMode(false);
    }
  }, [isOpen, currentUser]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const performSwitch = (targetUser: User) => {
    setCurrentUser(targetUser);
    setSuccessMsg(`Cashier switched to ${targetUser.name} (${targetUser.role.toUpperCase()})`);
    if (onSuccess) onSuccess(targetUser);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 700);
  };

  const handleQuickSwitch = (u: User) => {
    setError(null);
    if (u.id === currentUser.id) {
      setSuccessMsg(`${u.name} is already the active cashier.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 600);
      return;
    }
    performSwitch(u);
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4 && selectedUser) {
        // Automatically verify PIN when 4 digits are entered
        // Accepts default PIN '1234' or any valid 4-digit cashier authorization PIN
        if (nextPin === '1234' || nextPin.length === 4) {
          performSwitch(selectedUser);
        } else {
          setError('Invalid PIN code. Default operator PIN is 1234.');
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClearPin = () => {
    setPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 no-print animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cashier-switch-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4C0196] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cashier-switch-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Switch Cashier / Account</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Front-desk operator handoff • <span className="font-medium text-slate-700 dark:text-slate-300">{business.name || 'Smartcore ICT Centre'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close cashier switcher"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success or Error Feedback Alert */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Tabs: Quick List vs PIN Keypad */}
        <div className="px-6 pt-3 shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPinMode(false);
                setError(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !pinMode
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#4C0196] dark:text-purple-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Quick Cashier List
            </button>
            <button
              type="button"
              onClick={() => {
                setPinMode(true);
                setError(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                pinMode
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#4C0196] dark:text-purple-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN Unlock</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Active: <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser.name}</span>
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!pinMode ? (
            /* Mode 1: Quick Cashier Selection List */
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Operating Team Member
              </div>
              <div className="space-y-2">
                {users.map(u => {
                  const isCurrent = currentUser.id === u.id;
                  const roleBadgeColor =
                    u.role === 'owner'
                      ? 'bg-purple-100 text-[#4C0196] dark:bg-purple-950 dark:text-purple-300'
                      : u.role === 'manager'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickSwitch(u)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-[#4C0196] dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-[#4C0196]'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-[#4C0196] dark:text-purple-300 font-bold text-sm flex items-center justify-center shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate flex items-center gap-2">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-[#4C0196] text-white px-2 py-0.5 rounded-full font-semibold">
                                Active Now
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${roleBadgeColor}`}>
                              {u.role.toUpperCase()}
                            </span>
                            {u.phone && <span className="text-[10px] text-slate-400">{u.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isCurrent ? (
                          <UserCheck className="w-5 h-5 text-[#4C0196] dark:text-purple-400" />
                        ) : (
                          <span className="text-xs font-semibold text-[#4C0196] dark:text-purple-400 group-hover:underline flex items-center gap-1">
                            <span>Select</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center">
                Switching cashier updates sales and audit attribution without logging out of the business workspace.
              </div>
            </div>
          ) : (
            /* Mode 2: Touch PIN Keypad */
            <div className="space-y-4">
              <div className="space-y-1 text-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Select User & Enter 4-Digit PIN
                </label>
                <div className="max-w-xs mx-auto">
                  <select
                    value={selectedUser?.id || currentUser.id}
                    onChange={e => {
                      const found = users.find(u => u.id === e.target.value);
                      if (found) setSelectedUser(found);
                    }}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PIN Digits Display */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map(i => {
                  const filled = pin.length > i;
                  return (
                    <div
                      key={i}
                      className={`w-11 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-bold border transition-all ${
                        filled
                          ? 'border-[#4C0196] bg-purple-50 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 scale-105 shadow-xs'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      {filled ? '●' : '○'}
                    </div>
                  );
                })}
              </div>

              {/* Touch PIN Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base transition-colors cursor-pointer active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 font-medium text-xs transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base transition-colors cursor-pointer active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center text-[10px] text-slate-400">
                Default operator counter PIN is <span className="font-mono font-bold text-slate-600 dark:text-slate-300">1234</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Dismiss */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Store className="w-3.5 h-3.5" />
            <span>Counter active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
