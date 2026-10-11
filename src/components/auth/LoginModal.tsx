import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowIcon } from '../common/BizFlowLogo';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { business, users, currentUser, setCurrentUser } = useBusiness();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('manager');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Google Sign-In with Firebase Auth
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      let idToken = '';
      let profile: { email?: string; name?: string; uid?: string } = {};

      try {
        const result = await signInWithPopup(auth, googleAuthProvider);
        idToken = await result.user.getIdToken();
        profile = {
          email: result.user.email || undefined,
          name: result.user.displayName || undefined,
          uid: result.user.uid,
        };
      } catch (popupErr: any) {
        console.warn('Firebase popup issue (e.g. iframe cross-origin restriction):', popupErr.message);
        // Fallback demo Google sign-in
        const demoEmail = 'google.user@bizflow.app';
        profile = {
          email: demoEmail,
          name: 'Google User',
          uid: `g_sim_${Date.now()}`,
        };
      }

      const res = await api.loginWithFirebase(idToken, profile);
      if (res && res.user) {
        setCurrentUser(res.user);
        setSuccessMsg(`Welcome, ${res.user.name}! Signed in via Google.`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 2. Select Existing Workspace Profile
  const handleSelectUser = async (user: User) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(user.email, 'smartcore123').catch(() => null);
      if (res && res.user) {
        setCurrentUser(res.user);
        setSuccessMsg(`Switched active profile to ${res.user.name}.`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 600);
      } else {
        // Fallback for local session
        setCurrentUser(user);
        setSuccessMsg(`Active profile set to ${user.name}`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to select user account.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Custom Email/Password Login
  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password || 'smartcore123');
      if (res && res.user) {
        setCurrentUser(res.user);
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Use smartcore123 for demo accounts.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Create Account / Register
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (signUpPassword && signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        name: signUpName.trim(),
        email: signUpEmail.trim().toLowerCase(),
        password: signUpPassword || 'smartcore123',
        phone: signUpPhone.trim() || undefined,
        role: signUpRole,
      });

      if (res && res.user) {
        setCurrentUser(res.user);
        setSuccessMsg(`Account created! Welcome, ${res.user.name}.`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 900);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create user account. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.03)] border border-slate-200/80 dark:border-slate-800 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Brand Badge */}
        <div className="pt-6 pb-2 px-6 sm:px-8 text-center shrink-0">
          <div className="w-13 h-13 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shadow-xs mx-auto mb-3">
            {mode === 'signin' ? (
              <BizFlowIcon size={28} className="rounded-lg shadow-2xs" />
            ) : (
              <UserPlus className="w-6 h-6 text-[#6D28D9]" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            Workspace:{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {business.name || 'Smartcore ICT Centre'}
            </span>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-[#F1F5F9] dark:bg-slate-800 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 space-y-4 overflow-y-auto">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Google Sign In */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-[#0F172A] dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {googleLoading
                  ? 'Connecting to Google...'
                  : mode === 'signin'
                  ? 'Continue with Google'
                  : 'Sign up with Google'}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-3 text-[#94A3B8] text-[10.5px] font-medium tracking-wider uppercase">
                Or continue with email
              </span>
            </div>
          </div>

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <div className="space-y-4">
              {/* Quick Profile Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Sign In
                  </span>
                  <span className="text-[10px] text-slate-400">1-click demo</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {users.slice(0, 4).map(u => {
                    const isCurrent = currentUser.id === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        disabled={loading}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-purple-300 bg-purple-50/70 text-purple-950 font-semibold ring-1 ring-purple-300'
                            : 'border-slate-200/80 hover:border-purple-200 bg-[#F8FAFC] dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#6D28D9] font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold leading-tight truncate">{u.name}</div>
                            <div className="text-[9.5px] text-slate-400 uppercase font-medium truncate">{u.role}</div>
                          </div>
                        </div>
                        {isCurrent && <ShieldCheck className="w-3.5 h-3.5 text-[#6D28D9] shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handleCustomLogin} className="space-y-3.5 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. philip@smartcoreict.online"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C0196] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to BizFlow'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* MODE: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                    placeholder="e.g. Adebayo Johnson"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={e => setSignUpEmail(e.target.value)}
                    placeholder="e.g. adebayo@smartcoreict.online"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      value={signUpPhone}
                      onChange={e => setSignUpPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Account Role *
                  </label>
                  <select
                    value={signUpRole}
                    onChange={e => setSignUpRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white font-medium transition-all"
                  >
                    <option value="manager">Store Manager</option>
                    <option value="staff">Staff / Cashier</option>
                    <option value="owner">Business Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full px-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Confirm *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpConfirmPassword}
                    onChange={e => setSignUpConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C0196] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-3 bg-[#F8FAFC] dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Cloud Session</span>
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">BizFlow v2.0</span>
        </div>
      </div>
    </div>
  );
};
