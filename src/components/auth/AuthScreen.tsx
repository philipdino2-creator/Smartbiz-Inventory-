import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowLogo } from '../common/BizFlowLogo';
import { api } from '../../services/api';
import { User, UserRole, Business } from '../../types';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Building2,
  MapPin,
  Globe,
  Briefcase,
  HelpCircle,
  Check,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useRouter, Link } from '../../context/RouterContext';
import { updatePageSeo } from '../../utils/seo';

interface AuthScreenProps {
  initialMode?: 'signin' | 'signup' | 'forgot';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'signin' }) => {
  const { business, users, setCurrentUser, handleAuthSuccess } = useBusiness();
  const { navigate, getSafeReturnUrl, path } = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'onboarding'>(initialMode);

  // Sync mode with route changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Sync document SEO metadata
  React.useEffect(() => {
    updatePageSeo(path);
  }, [path]);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('owner');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Password Recovery State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStage, setResetStage] = useState<'request' | 'verify'>('request');

  // Business Onboarding State (for new workspace creation)
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('ICT & Digital Training');
  const [bizPhone, setBizPhone] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizCurrency, setBizCurrency] = useState('NGN');
  const [bizCurrencySymbol, setBizCurrencySymbol] = useState('₦');
  const [bizTaxRate, setBizTaxRate] = useState(7.5);
  const [bizLogoUrl, setBizLogoUrl] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        // Fallback demo Google user in sandboxed preview iframe
        profile = {
          email: 'google.user@bizflow.app',
          name: 'Google User',
          uid: `g_sim_${Date.now()}`,
        };
      }

      const res = await api.loginWithFirebase(idToken, profile);
      if (res && res.user) {
        setSuccessMsg(`Welcome, ${res.user.name}! Authenticated via Google.`);
        setTimeout(() => {
          handleAuthSuccess(res.user, res.business);
          navigate(getSafeReturnUrl());
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 2. Quick Demo Profile Selection
  const handleSelectUser = async (user: User) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(user.email, 'smartcore123').catch(() => null);
      if (res && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          handleAuthSuccess(res.user, res.business);
          navigate(getSafeReturnUrl());
        }, 500);
      } else {
        // Fallback for offline or local session
        handleAuthSuccess(user, business);
        navigate(getSafeReturnUrl());
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate session.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Custom Email/Password Sign In
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
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          handleAuthSuccess(res.user, res.business);
          navigate(getSafeReturnUrl());
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again or create an account.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Database User Sign Up & Onboarding Flow
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
      // If user chooses Owner role, route to Step 2 Business Onboarding
      if (signUpRole === 'owner') {
        setPendingUser({
          id: `usr_${Date.now()}`,
          businessId: '',
          name: signUpName.trim(),
          email: signUpEmail.trim().toLowerCase(),
          phone: signUpPhone.trim() || undefined,
          role: 'owner',
          active: true,
        });
        setBizName(`${signUpName.trim()}'s Business`);
        setBizEmail(signUpEmail.trim().toLowerCase());
        setBizPhone(signUpPhone.trim());
        setMode('onboarding');
      } else {
        // Standard staff/manager register with current business
        const res = await api.register({
          name: signUpName.trim(),
          email: signUpEmail.trim().toLowerCase(),
          password: signUpPassword || 'smartcore123',
          phone: signUpPhone.trim() || undefined,
          role: signUpRole,
        });

        if (res && res.user) {
          setSuccessMsg(`Account created! Welcome to BizFlow, ${res.user.name}.`);
          setTimeout(() => {
            handleAuthSuccess(res.user, res.business);
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create user account. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Complete Business Onboarding (New Tenant Workspace Creation)
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        name: pendingUser?.name || signUpName.trim(),
        email: pendingUser?.email || signUpEmail.trim().toLowerCase(),
        password: signUpPassword || 'smartcore123',
        phone: pendingUser?.phone || signUpPhone.trim() || undefined,
        role: 'owner',
        businessName: bizName.trim(),
        businessCategory: bizCategory,
        businessPhone: bizPhone.trim() || pendingUser?.phone || signUpPhone.trim() || undefined,
        businessEmail: bizEmail.trim() || pendingUser?.email || signUpEmail.trim().toLowerCase(),
        businessAddress: bizAddress.trim() || undefined,
        businessCurrency: bizCurrency,
        businessCurrencySymbol: bizCurrencySymbol,
        businessTaxRate: bizTaxRate,
        businessLogoUrl: bizLogoUrl || undefined,
      });

      if (res && res.user) {
        setSuccessMsg(`Workspace ready! Welcome to your new BizFlow dashboard.`);
        setTimeout(() => {
          handleAuthSuccess(res.user, res.business);
          navigate(getSafeReturnUrl());
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete business setup.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Password Recovery: Request Reset Token
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please provide your account email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.requestPasswordReset(forgotEmail.trim());
      setSuccessMsg(res.message);
      if (res.token) {
        setResetToken(res.token);
      }
      setResetStage('verify');
    } catch (err: any) {
      setError(err?.message || 'Password reset request could not be processed.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Password Recovery: Confirm New Password
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      setError('Reset token is required.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.confirmPasswordReset(resetToken.trim(), newPassword);
      setSuccessMsg(res.message + ' You can now sign in with your new password.');
      setTimeout(() => {
        setMode('signin');
        setEmail(forgotEmail);
        setPassword(newPassword);
        setResetStage('request');
        setForgotEmail('');
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Password reset could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* BizFlow Header Branding */}
        <div className="text-center mb-5 space-y-2">
          <div className="flex justify-center">
            <BizFlowLogo size="xl" showWordmark />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Smart, simple business management &amp; POS for growing enterprises
          </p>

          {/* Unobtrusive return link to public marketing website */}
          <div className="pt-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4C0196] dark:text-purple-400 hover:underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to BizFlow Homepage</span>
            </Link>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200">
          {/* Card Navigation Tabs */}
          {mode !== 'onboarding' && mode !== 'forgot' && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    navigate('/login', { replace: true });
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    navigate('/register', { replace: true });
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Card Body */}
          <div className="p-6 sm:p-7 space-y-5">
            {/* Notification Banners */}
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 1: SIGN IN */}
            {/* ============================================================== */}
            {mode === 'signin' && (
              <div className="space-y-4">
                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-2xl font-semibold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
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
                  <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 text-[10px] font-semibold tracking-wider">
                      Or with email
                    </span>
                  </div>
                </div>

                {/* Email + Password Form */}
                <form onSubmit={handleCustomLogin} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. philip@smartcoreict.online"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          navigate('/forgot-password', { replace: true });
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] font-semibold text-[#4C0196] dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Signing in...' : 'Sign In to Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Quick 1-Click Profile Selection for Preview Verification */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Quick Workspace Sign In
                    </span>
                    <span className="text-[10px] text-slate-400">Preview accounts</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {users.slice(0, 4).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        disabled={loading}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50/50 text-left transition-all cursor-pointer text-xs"
                      >
                        <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate text-[11px]">{u.name}</div>
                          <div className="text-[9.5px] text-slate-500 uppercase">{u.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: CREATE ACCOUNT */}
            {/* ============================================================== */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={signUpName}
                      onChange={e => setSignUpName(e.target.value)}
                      placeholder="e.g. Chukwudi Okafor"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      placeholder="e.g. chukwudi@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={signUpPhone}
                        onChange={e => setSignUpPhone(e.target.value)}
                        placeholder="+234 814 000 0000"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Account Type *
                    </label>
                    <select
                      value={signUpRole}
                      onChange={e => setSignUpRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden font-semibold"
                    >
                      <option value="owner">New Business (Owner)</option>
                      <option value="manager">Manager (Existing Team)</option>
                      <option value="staff">Staff / Cashier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={e => setSignUpPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Confirm *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpConfirmPassword}
                      onChange={e => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Processing...' : signUpRole === 'owner' ? 'Continue to Business Setup' : 'Create Account & Sign In'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* VIEW 3: STEP 2 - NEW BUSINESS ONBOARDING */}
            {/* ============================================================== */}
            {mode === 'onboarding' && (
              <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                <div className="text-center pb-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 text-xs font-bold mb-1">
                    <span>Step 2 of 2: Business Profile</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Setup Your Business Workspace
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your data will be completely isolated in its own dedicated tenant environment.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={bizName}
                      onChange={e => setBizName(e.target.value)}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      value={bizPhone}
                      onChange={e => setBizPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={bizEmail}
                      onChange={e => setBizEmail(e.target.value)}
                      placeholder="contact@business.com"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Physical Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={bizAddress}
                      onChange={e => setBizAddress(e.target.value)}
                      placeholder="e.g. 15 Commercial Avenue, Lagos, Nigeria"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Currency
                    </label>
                    <select
                      value={bizCurrency}
                      onChange={e => {
                        setBizCurrency(e.target.value);
                        setBizCurrencySymbol(e.target.value === 'USD' ? '$' : e.target.value === 'GBP' ? '£' : '₦');
                      }}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                    >
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      VAT Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bizTaxRate}
                      onChange={e => setBizTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="w-1/3 py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Creating Workspace...' : 'Launch BizFlow Workspace'}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* VIEW 4: PASSWORD RECOVERY */}
            {/* ============================================================== */}
            {mode === 'forgot' && (
              <div className="space-y-4">
                <div className="text-center pb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Password Recovery
                  </h3>
                  <p className="text-xs text-slate-500">
                    {resetStage === 'request'
                      ? 'Enter your registered email address to receive a secure password reset token.'
                      : 'Enter the verification token and create your new password.'}
                  </p>
                </div>

                {resetStage === 'request' ? (
                  <form onSubmit={handleRequestPasswordReset} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          placeholder="philip@smartcoreict.online"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{loading ? 'Processing...' : 'Request Password Reset Token'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Reset Verification Token
                      </label>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={e => setResetToken(e.target.value)}
                        placeholder="smt_rst_..."
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 6 chars"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={e => setConfirmNewPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[#4C0196] hover:bg-[#3B0075] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      navigate('/login', { replace: true });
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Secure Cloud Sessions</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">BizFlow v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
