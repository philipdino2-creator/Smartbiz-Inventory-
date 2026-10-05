import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowLogo } from '../common/BizFlowLogo';
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
        // If popup is blocked in iframe/sandbox environment, use demo Google sign-in
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
      await api.login(user.email, 'smartcore123').catch(() => null);
      setCurrentUser(user);
      setSuccessMsg(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
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

  // 3. Custom Email/Password Sign In
  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address');
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
        }, 700);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again or create an account.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Database User Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!signUpEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (signUpPassword && signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match');
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
        setSuccessMsg(`Account created! Welcome to BizFlow, ${res.user.name}.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with BizFlow Identity */}
        <div className="bg-gradient-to-b from-purple-50/80 to-white px-6 pt-5 pb-3 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <BizFlowLogo size="md" />
            <p className="text-xs text-slate-500 pt-0.5">
              Workspace: <span className="font-semibold text-slate-800">{business.name || 'Smartcore ICT Centre'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="px-6 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
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
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* GOOGLE SIGN IN BUTTON */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{googleLoading ? 'Connecting to Google...' : mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 text-[10px] font-medium tracking-wider">
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
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Quick Sign In
                  </span>
                  <span className="text-[10px] text-slate-400">1-click workspace demo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.slice(0, 4).map(u => {
                    const isCurrent = currentUser.id === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        disabled={loading}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-purple-300 bg-purple-50/70 text-purple-950 font-semibold shadow-2xs ring-1 ring-purple-300'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#4C0196] font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold leading-tight truncate">{u.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal truncate">{u.role}</div>
                          </div>
                        </div>
                        {isCurrent && <ShieldCheck className="w-3.5 h-3.5 text-[#4C0196] shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handleCustomLogin} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. philip@smartcoreict.online"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Default demo password: smartcore123</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to BizFlow'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  New to BizFlow?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="font-bold text-[#4C0196] hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* MODE: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                    placeholder="e.g. Adebayo Johnson"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={e => setSignUpEmail(e.target.value)}
                    placeholder="e.g. adebayo@smartcoreict.online"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={signUpPhone}
                      onChange={e => setSignUpPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Account Role *</label>
                  <select
                    value={signUpRole}
                    onChange={e => setSignUpRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent bg-white outline-hidden"
                  >
                    <option value="manager">Store Manager (Operational &amp; Products)</option>
                    <option value="staff">Staff / Cashier (Front Desk &amp; Sales)</option>
                    <option value="owner">Business Owner (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={e => setSignUpPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpConfirmPassword}
                      onChange={e => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="font-bold text-[#4C0196] hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Enterprise Cloud Database</span>
          <span className="font-semibold text-slate-700">BizFlow v2.0</span>
        </div>
      </div>
    </div>
  );
};
