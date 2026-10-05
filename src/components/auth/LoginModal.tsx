import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowLogo } from '../common/BizFlowLogo';
import { api } from '../../services/api';
import { User } from '../../types';
import { X, Lock, Mail, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { business, users, currentUser, setCurrentUser } = useBusiness();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectUser = async (user: User) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(user.email, 'smartcore123').catch(() => null);
      setCurrentUser(user);
      setSuccessMsg(`Authenticated as ${user.name} (${user.role.toUpperCase()})`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate session');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password || 'smartcore123');
      if (res && res.user) {
        setCurrentUser(res.user);
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header with BizFlow Identity */}
        <div className="bg-gradient-to-b from-purple-50/80 to-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1">
            <BizFlowLogo size="lg" />
            <p className="text-xs text-slate-500 pt-1">
              Sign in to manage <span className="font-semibold text-slate-800">{business.name || 'Smartcore ICT Centre'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Switch Profiles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Quick Sign In ({business.name})
            </label>
            <div className="space-y-2">
              {users.map(u => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-purple-300 bg-purple-50/70 text-purple-950 font-semibold shadow-xs ring-1 ring-purple-300'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#4C0196] font-bold text-xs flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {u.role}
                      </span>
                      {isCurrent && <ShieldCheck className="w-4 h-4 text-[#4C0196]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 text-[10px] font-medium">Or Sign In with Email</span>
            </div>
          </div>

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@smartcoreict.online"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to BizFlow'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Enterprise Cloud Architecture</span>
          <span className="font-semibold text-slate-700">BizFlow v2.0</span>
        </div>
      </div>
    </div>
  );
};
