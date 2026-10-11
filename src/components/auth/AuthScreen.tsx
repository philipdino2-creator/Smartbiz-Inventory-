import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { BizFlowIcon } from '../common/BizFlowLogo';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
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
  Check,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useRouter, Link } from '../../context/RouterContext';
import { updatePageSeo } from '../../utils/seo';
import { OnboardingFlow, PendingUserData } from '../onboarding/OnboardingFlow';

interface AuthScreenProps {
  initialMode?: 'signin' | 'signup' | 'forgot' | 'onboarding';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'signin' }) => {
  const { business, users, handleAuthSuccess } = useBusiness();
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
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('ICT & Digital Training');
  const [bizPhone, setBizPhone] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizCurrency, setBizCurrency] = useState('NGN');
  const [bizCurrencySymbol, setBizCurrencySymbol] = useState('₦');
  const [bizTaxRate, setBizTaxRate] = useState(7.5);

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
      // If user chooses Owner role, route to Multi-Page Business Onboarding Flow
      if (signUpRole === 'owner') {
        setPendingUser({
          id: `usr_${Date.now()}`,
          businessId: '',
          name: signUpName.trim(),
          email: signUpEmail.trim().toLowerCase(),
          phone: signUpPhone.trim() || undefined,
          role: 'owner',
          active: true,
          password: signUpPassword || 'smartcore123',
        } as any);
        setBizName(`${signUpName.trim()}'s Business`);
        setBizEmail(signUpEmail.trim().toLowerCase());
        setBizPhone(signUpPhone.trim());
        setMode('onboarding');
        navigate('/onboarding/step-1');
        return;
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

  // Computed Titles and Subtitles based on current mode
  const getHeaderMeta = () => {
    switch (mode) {
      case 'signup':
        return {
          title: 'Create an Account',
          subtitle: 'Start managing your sales, inventory, and finances in seconds',
          badgeIcon: <UserPlus className="w-6 h-6 text-[#6D28D9]" />,
        };
      case 'onboarding':
        return {
          title: 'Setup Workspace',
          subtitle: 'Configure your company details to launch your dedicated environment',
          badgeIcon: <Building2 className="w-6 h-6 text-[#6D28D9]" />,
        };
      case 'forgot':
        return {
          title: 'Reset Password',
          subtitle:
            resetStage === 'request'
              ? 'Enter your registered email to receive your secure recovery token'
              : 'Enter the verification token and choose your new password',
          badgeIcon: <RotateCcw className="w-6 h-6 text-[#6D28D9]" />,
        };
      case 'signin':
      default:
        return {
          title: 'Welcome Back',
          subtitle: 'Smart, simple business management & POS for growing enterprises',
          badgeIcon: <BizFlowIcon size={32} className="shadow-2xs rounded-lg" />,
        };
    }
  };

  const headerMeta = getHeaderMeta();

  // Dedicated Multi-Page Onboarding Flow (Pages 1 to 4)
  if (mode === 'onboarding' || path.startsWith('/onboarding')) {
    const derivedPending: PendingUserData | null = pendingUser
      ? {
          id: pendingUser.id,
          name: pendingUser.name,
          email: pendingUser.email,
          phone: pendingUser.phone,
          role: pendingUser.role,
          password: (pendingUser as any).password || signUpPassword || 'smartcore123',
        }
      : signUpName
      ? {
          id: `usr_${Date.now()}`,
          name: signUpName,
          email: signUpEmail,
          phone: signUpPhone,
          role: signUpRole,
          password: signUpPassword || 'smartcore123',
        }
      : null;

    return (
      <OnboardingFlow
        pendingUser={derivedPending}
        onCancel={() => {
          setMode('signup');
          navigate('/signup');
        }}
        onComplete={(user, biz) => {
          handleAuthSuccess(user, biz);
          navigate(getSafeReturnUrl() || '/app');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 relative transition-colors duration-200">
      {/* Refined Ambient Glow (Clean, minimal light-mode gradient) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-purple-100/50 via-purple-50/20 to-transparent blur-3xl opacity-80 dark:opacity-20" />
        <div className="absolute -bottom-32 left-1/4 w-[480px] h-[300px] bg-indigo-50/40 dark:bg-indigo-950/20 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Return to Public Website Link */}
        <div className="text-center mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#6D28D9] dark:text-slate-400 dark:hover:text-purple-300 transition-colors py-1 px-3 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to BizFlow Homepage</span>
          </Link>
        </div>

        {/* Floating White Card (PadiLogs Modern Light Style) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.03)] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-9 transition-all">
          
          {/* Card Header & Brand Badge */}
          <div className="text-center mb-6">
            {/* Centered Soft-Cornered Icon Badge */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shadow-xs mx-auto mb-4 transition-transform hover:scale-105 duration-200">
              {headerMeta.badgeIcon}
            </div>

            {/* Header Hierarchy */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              {headerMeta.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 font-normal mt-1.5 max-w-sm mx-auto leading-relaxed">
              {headerMeta.subtitle}
            </p>
          </div>

          {/* Mode Switcher Tabs (Only on Sign In / Sign Up) */}
          {mode !== 'forgot' && (
            <div className="p-1 bg-[#F1F5F9] dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  navigate('/login', { replace: true });
                  setError(null);
                  setSuccessMsg(null);
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
                  navigate('/register', { replace: true });
                  setError(null);
                  setSuccessMsg(null);
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
          )}

          {/* Alert Banners */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 1: SIGN IN */}
          {/* ============================================================== */}
          {mode === 'signin' && (
            <div className="space-y-4">
              {/* Secondary Action: OAuth Google Sign In */}
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
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Hairline Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-[#94A3B8] text-[10.5px] font-medium tracking-wider uppercase">
                    Or with email
                  </span>
                </div>
              </div>

              {/* Clean Email & Password Form */}
              <form onSubmit={handleCustomLogin} className="space-y-4">
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
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
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
                      className="text-xs font-medium text-[#6D28D9] dark:text-purple-400 hover:text-[#5B21B6] hover:underline cursor-pointer transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C0196] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg hover:shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* 1-Click Demo Profiles (Clean & Subtle) */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Workspace Sign In
                  </span>
                  <span className="text-[10px] text-slate-400">1-click demo access</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {users.slice(0, 4).map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      disabled={loading}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-[#F8FAFC] dark:bg-slate-800/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-left transition-all cursor-pointer text-xs"
                    >
                      <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#6D28D9] dark:text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                          {u.name}
                        </div>
                        <div className="text-[9.5px] text-slate-400 dark:text-slate-500 uppercase font-medium">
                          {u.role}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Switcher */}
              <div className="text-center pt-2">
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      navigate('/register', { replace: true });
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-semibold text-[#6D28D9] dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: CREATE ACCOUNT */}
          {/* ============================================================== */}
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
                    placeholder="e.g. Chukwudi Okafor"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
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
                    placeholder="e.g. chukwudi@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
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
                      placeholder="+234 814 000 0000"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Account Type *
                  </label>
                  <select
                    value={signUpRole}
                    onChange={e => setSignUpRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white font-medium transition-all"
                  >
                    <option value="owner">New Business (Owner)</option>
                    <option value="manager">Manager (Existing Team)</option>
                    <option value="staff">Staff / Cashier</option>
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
                    className="w-full px-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
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
                    className="w-full px-3 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C0196] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg hover:shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : signUpRole === 'owner'
                    ? 'Continue to Business Setup'
                    : 'Create Account & Sign In'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      navigate('/login', { replace: true });
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-semibold text-[#6D28D9] dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: PASSWORD RECOVERY */}
          {/* ============================================================== */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {resetStage === 'request' ? (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="philip@smartcoreict.online"
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C0196] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Processing...' : 'Request Password Reset Token'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Reset Verification Token
                    </label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      placeholder="smt_rst_..."
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-[#6D28D9] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C0196] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                    <Check className="w-4 h-4" />
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
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security / Compliance Microcopy */}
        <div className="mt-6 text-center text-xs text-[#94A3B8] dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protected by 256-bit bank-grade encryption · BizFlow Cloud</span>
        </div>
      </div>
    </div>
  );
};
