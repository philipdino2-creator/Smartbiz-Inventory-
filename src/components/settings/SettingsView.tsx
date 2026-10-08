import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { User, UserRole, Permission } from '../../types';
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  getUserPermissions,
  getPermissionSummary,
  validateOwnerProtection,
  DEFAULT_ROLE_PERMISSIONS,
} from '../../utils/permissionUtils';
import {
  Save,
  RotateCcw,
  Download,
  Shield,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  History,
  Building2,
  CreditCard,
  Sliders,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Lock,
  Info,
  Moon,
  Sun,
  Palette,
  Eye,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  LogOut,
} from 'lucide-react';
import { BizFlowLogo } from '../common/BizFlowLogo';
import { ThemeToggle } from '../common/ThemeToggle';

export const SettingsView: React.FC = () => {
  const {
    business,
    updateBusiness,
    users,
    addUser,
    updateUser,
    updateUserPermissions,
    changeUserRole,
    deleteUser,
    currentUser,
    setCurrentUser,
    expenseCategories,
    addExpenseCategory,
    auditLogs,
    resetToDemoData,
    resetLedgerToZero,
    exportAllDataJSON,
    hasPermission,
    isBackendConnected,
    migrateLegacyLocalStorageData,
    logout,
  } = useBusiness();

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  // Active settings tab
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'permissions' | 'categories' | 'audit'>('profile');

  // Business profile form state
  const [name, setName] = useState(business.name);
  const [tagline, setTagline] = useState(business.tagline);
  const [address, setAddress] = useState(business.address);
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email);
  const [website, setWebsite] = useState(business.website);
  const [currencySymbol, setCurrencySymbol] = useState(business.currencySymbol);
  const [enableTax, setEnableTax] = useState(business.enableTax);
  const [taxRate, setTaxRate] = useState(business.taxRate);
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '');
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state if business updates from server
  React.useEffect(() => {
    if (business.logoUrl !== undefined) {
      setLogoUrl(business.logoUrl || '');
    }
  }, [business.logoUrl]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoUploadError('Please select a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setLogoUploadError('Logo file size must be less than 3MB.');
      return;
    }

    setLogoUploadError(null);
    setIsUploadingLogo(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploadingLogo(false);
        return;
      }

      // If SVG, keep raw SVG data URL
      if (file.type === 'image/svg+xml') {
        setLogoUrl(dataUrl);
        setIsUploadingLogo(false);
        return;
      }

      // Optimize raster images using Canvas (max dimension 600px)
      const img = new Image();
      img.onload = () => {
        const maxDimension = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9);
          setLogoUrl(compressedDataUrl);
        } else {
          setLogoUrl(dataUrl);
        }
        setIsUploadingLogo(false);
      };
      img.onerror = () => {
        setLogoUrl(dataUrl);
        setIsUploadingLogo(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setLogoUploadError('Failed to read image file.');
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setLogoUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bank & Payment Details for debt reminders
  const [bankName, setBankName] = useState(business.bankName || 'Zenith Bank');
  const [accountName, setAccountName] = useState(business.accountName || 'Smartcore ICT Centre');
  const [accountNumber, setAccountNumber] = useState(business.accountNumber || '1014848368');
  const [paymentInstructions, setPaymentInstructions] = useState(
    business.paymentInstructions || 'Please include customer/student name or invoice reference in transfer narration.'
  );
  const [includeBankDetailsInReminders, setIncludeBankDetailsInReminders] = useState(
    business.includeBankDetailsInReminders ?? true
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // New category
  const [newCat, setNewCat] = useState('');

  // New user form modal state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');

  // Permission customization modal state
  const [permissionModalUser, setPermissionModalUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Permission[]>([]);
  const [permissionSaveMessage, setPermissionSaveMessage] = useState<string | null>(null);

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('manage_business')) {
      alert('Permission Denied: Only Business Owners and authorized managers can alter company settings.');
      return;
    }

    updateBusiness({
      name: name.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      currencySymbol: currencySymbol.trim(),
      enableTax,
      taxRate: Number(taxRate) || 0,
      logoUrl: logoUrl.trim(),
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      paymentInstructions: paymentInstructions.trim(),
      includeBankDetailsInReminders,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('manage_categories')) {
      alert('Permission Denied: You do not have permission to add expense categories.');
      return;
    }
    if (newCat.trim()) {
      addExpenseCategory(newCat.trim());
      setNewCat('');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('manage_users')) {
      alert('Permission Denied: You do not have permission to add new team members.');
      return;
    }
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const res = addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      active: true,
    });

    if (res.success) {
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserRole('staff');
      setIsAddingUser(false);
    }
  };

  const handleOpenCustomizePermissions = (targetUser: User) => {
    setPermissionModalUser(targetUser);
    setEditingPermissions(getUserPermissions(targetUser));
    setPermissionSaveMessage(null);
  };

  const handleTogglePermission = (perm: Permission) => {
    setEditingPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleResetToRoleDefaults = () => {
    if (!permissionModalUser) return;
    const defaults = DEFAULT_ROLE_PERMISSIONS[permissionModalUser.role] || DEFAULT_ROLE_PERMISSIONS.staff;
    setEditingPermissions([...defaults]);
  };

  const handleSelectAllPermissions = () => {
    const all = PERMISSION_GROUPS.flatMap(g => g.permissions);
    setEditingPermissions([...all]);
  };

  const handleClearAllPermissions = () => {
    setEditingPermissions([]);
  };

  const handleSavePermissions = () => {
    if (!permissionModalUser) return;
    const res = updateUserPermissions(permissionModalUser.id, editingPermissions);
    if (res.success) {
      setPermissionSaveMessage('Permissions saved successfully!');
      setTimeout(() => {
        setPermissionSaveMessage(null);
        setPermissionModalUser(null);
      }, 1000);
    } else {
      alert(res.message || 'Failed to update permissions.');
    }
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    const res = changeUserRole(userId, newRole);
    if (!res.success) {
      alert(res.message);
    }
  };

  const handleDeleteUser = (targetUser: User) => {
    const validation = validateOwnerProtection(users, targetUser.id, 'delete');
    if (!validation.allowed) {
      alert(validation.reason);
      return;
    }

    if (window.confirm(`Are you sure you want to remove team member "${targetUser.name}"?`)) {
      const res = deleteUser(targetUser.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const canManageBusiness = hasPermission('manage_business');
  const canManageTeam = hasPermission('manage_permissions') || hasPermission('manage_users');
  const canManageCategories = hasPermission('manage_categories') || canManageBusiness;
  const canViewAudit = hasPermission('view_audit_log');

  const handleDownloadBackup = () => {
    if (!canManageBusiness) {
      alert('Permission Denied: System database backups can only be exported by the Business Owner.');
      return;
    }
    const jsonStr = exportAllDataJSON();
    if (!jsonStr) return;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartcore_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user has zero settings permissions, show access restricted message
  if (!canManageBusiness && !canManageTeam && !canManageCategories && !canViewAudit) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-2xs">
        <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Administration Settings Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access to business profile, team permissions, system configurations, and data backups is restricted to authorized administrative roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Section Title */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Business Settings &amp; Administration</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-[#4C0196] dark:text-purple-300">
              {currentUser.role} session
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure company profile, bank payment details for WhatsApp reminders, theme appearance, and team access
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Quick Dark Mode Toggle (Switch & Segmented) */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <ThemeToggle variant="switch" showLabels />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <ThemeToggle variant="segmented" className="hidden sm:inline-flex" />
          </div>

          {/* Live Active Session Switcher for testing/demo */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#4C0196] dark:text-purple-400" />
              <span>Switch Role:</span>
            </span>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setCurrentUser(u)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  u.id === currentUser.id
                    ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs font-bold border border-purple-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Switch active session to ${u.name} (${u.role})`}
              >
                {u.name.split(' ')[0]} ({u.role})
              </button>
            ))}
          </div>

          <button
            onClick={() => logout()}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Sign out of current account and lock workspace"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-xl shadow-2xs gap-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-[#4C0196] text-[#4C0196] dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Business &amp; Bank Details</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'border-[#4C0196] text-[#4C0196] dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>Appearance &amp; Dark Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'border-[#4C0196] text-[#4C0196] dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Team &amp; Granular Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-[#4C0196] text-[#4C0196] dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Categories &amp; Data Backups</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[#4C0196] text-[#4C0196] dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Log</span>
        </button>
      </div>

      {/* TAB 1: Business Profile & Bank Details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveBusiness} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Organization Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Organization Profile</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official business information used on thermal receipts &amp; invoices</p>
                </div>
                {savedSuccess && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
              </div>

              <div className="space-y-4 text-xs">
                {/* Official Business Logo Upload Field */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white">
                        Official Business Logo
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upload your organization&apos;s brand logo for thermal receipts, invoices, and system navigation.
                      </p>
                    </div>
                    {logoUrl && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Logo Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Visual Preview Box */}
                    <div className="relative shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center p-2 overflow-hidden shadow-2xs group">
                      {logoUrl ? (
                        <>
                          <img
                            src={logoUrl}
                            alt="Uploaded Business Logo"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute inset-0 bg-slate-950/75 text-rose-300 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] font-bold cursor-pointer"
                            title="Remove this logo"
                          >
                            <Trash2 className="w-4 h-4 mb-0.5 text-rose-400" />
                            <span>Remove</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center p-1">
                          <ImageIcon className="w-8 h-8 mb-1 text-slate-300 dark:text-slate-600" />
                          <span className="text-[9px] font-medium leading-tight">No Logo</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls & Actions */}
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="business-logo-file-input"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="business-logo-file-input"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] transition-colors cursor-pointer shadow-xs active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{logoUrl ? 'Change Logo Image' : 'Upload Business Logo'}</span>
                        </label>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}

                        {isUploadingLogo && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 animate-pulse font-medium">
                            Processing image...
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Info className="w-3 h-3 text-[#4C0196] shrink-0" />
                        <span>PNG, JPG, WebP, or SVG (max 3MB). Scaled cleanly for print receipts &amp; web.</span>
                      </p>

                      {/* Optional Remote Image URL toggle */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-[11px] font-semibold text-[#4C0196] dark:text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>{showUrlInput ? 'Hide URL input' : 'Or paste online image URL'}</span>
                        </button>

                        {showUrlInput && (
                          <div className="mt-1.5 flex gap-2">
                            <input
                              type="url"
                              value={logoUrl}
                              onChange={e => {
                                setLogoUrl(e.target.value);
                                setLogoUploadError(null);
                              }}
                              placeholder="https://example.com/logo.png"
                              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-1 focus:ring-[#4C0196]"
                            />
                            {logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {logoUploadError && (
                        <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 pt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{logoUploadError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business / Training Centre Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Tagline / Slogan</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g. Quality IT Training & Digital Services"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Business Address *</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telephone Contact *</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                    <select
                      value={currencySymbol}
                      onChange={e => setCurrencySymbol(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="₦">Nigerian Naira (₦ NGN)</option>
                      <option value="$">US Dollar ($ USD)</option>
                      <option value="£">British Pound (£ GBP)</option>
                      <option value="€">Euro (€ EUR)</option>
                      <option value="GH₵">Ghanaian Cedi (GH₵)</option>
                      <option value="KSh">Kenyan Shilling (KSh)</option>
                    </select>
                  </div>
                </div>

                {/* VAT / Tax Configuration */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Value Added Tax (VAT)</span>
                      <p className="text-[11px] text-slate-500">Calculate VAT on thermal POS receipts and sales invoices</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableTax}
                      onChange={e => setEnableTax(e.target.checked)}
                      className="w-4 h-4 text-[#4C0196] rounded border-slate-300 focus:ring-[#4C0196] cursor-pointer"
                    />
                  </div>

                  {enableTax && (
                    <div className="pt-2 flex items-center gap-2">
                      <label className="text-slate-600 font-medium">VAT Rate (%):</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={taxRate}
                        onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded-md font-mono"
                      />
                      <span className="text-slate-500 text-[11px]">(Nigeria standard VAT is 7.5%)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Payment & Bank Details (For WhatsApp Reminders & Invoices) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Payment &amp; Bank Account Details</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Populates customer debt reminders and invoices automatically</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. Zenith Bank, Access Bank, OPay"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="e.g. Smartcore ICT Centre"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="e.g. 1014848368"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">POS &amp; Transfer Instructions</label>
                  <textarea
                    rows={2}
                    value={paymentInstructions}
                    onChange={e => setPaymentInstructions(e.target.value)}
                    placeholder="e.g. Include student or customer name in transfer narration for instant payment confirmation."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg leading-relaxed"
                  />
                </div>

                {/* Reminder Inclusion Toggle */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-emerald-900 text-xs">Include In WhatsApp Debt Reminders</span>
                      <p className="text-[11px] text-emerald-700 leading-snug">
                        When enabled, the bank account name, number, and instructions will be automatically included in customer balance notifications.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeBankDetailsInReminders}
                      onChange={e => setIncludeBankDetailsInReminders(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer shrink-0 ml-3"
                    />
                  </label>
                </div>
              </div>

              {/* Receipt Numbering Note */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#4C0196] dark:text-purple-400" />
                  <span>Unique Monotonic Receipt Sequence</span>
                </div>
                <p className="text-[11px] leading-relaxed text-purple-800 dark:text-purple-300/90">
                  Current invoice sequence is locked at #{business.lastInvoiceSequence || 105}. Receipts are strictly sequential and never reused even if transactions are removed.
                </p>
              </div>
            </div>

            {/* Display & Dark Mode Preferences Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xs col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#4C0196] dark:text-purple-300 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Display &amp; Dark Mode</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Night mode toggle with persistent browser storage</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('appearance')}
                  className="text-xs font-bold text-[#4C0196] dark:text-purple-400 hover:underline cursor-pointer"
                >
                  All Appearance Options &rarr;
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-[#4C0196] dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Dark Mode (Night Shift Eye Comfort)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Switch between crisp light mode and eye-comfort dark mode for evening business hours. Saved permanently across all sessions.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <ThemeToggle variant="switch" showLabels />
                  <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700" />
                  <ThemeToggle variant="segmented" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4C0196] text-white text-xs font-bold rounded-xl hover:bg-[#3b0075] transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Business &amp; Payment Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB: Appearance & Dark Mode */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Theme &amp; Display Appearance</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-900/50 text-[#4C0196] dark:text-purple-300">
                    Night Comfort
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your preferred color theme. Dark mode provides low glare and reduced eye fatigue for evening bookkeeping and dim counters.
                </p>
              </div>
            </div>

            {/* Primary Interactive Dark Mode Switch Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/40 to-slate-50 dark:from-slate-850 dark:via-purple-950/20 dark:to-slate-900 border border-purple-200/80 dark:border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4C0196] text-white flex items-center justify-center shadow-xs">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Dark Mode Night Toggle
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Instantly toggle between high-contrast daylight mode and deep slate night mode. Changes take effect across the entire app immediately and persist across browser reloads.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <ThemeToggle variant="switch" showLabels />
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <ThemeToggle variant="button" />
              </div>
            </div>

            {/* Visual Cards Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                Select Workspace Theme Mode
              </label>
              <ThemeToggle variant="cards" />
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#4C0196] dark:text-purple-300">
                  <Moon className="w-4 h-4" />
                  <span>Engineered for Late Hours &amp; Low Glare</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  BizFlow Dark Mode utilizes a deep slate background palette (`#0b0f19` / `#0f172a`) paired with crisp typography and subtle borders, reducing blue light emission and screen glare when reviewing sales receipts or managing expenses at night.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Session &amp; Browser Persistence</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Your theme preference is saved to your browser&apos;s persistent local storage. Whenever you reload, switch accounts, or reopen BizFlow on this device, your preferred dark or light appearance is automatically restored instantly with zero screen flash.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Team & Granular Permissions */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Authorized Team &amp; Granular Permissions</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {users.length} members
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure role defaults or customize fine-grained capability checks for Owners, Managers, and Staff
              </p>
            </div>

            {hasPermission('manage_users') && (
              <button
                onClick={() => setIsAddingUser(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team Member</span>
              </button>
            )}
          </div>

          {/* Users & Permissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-3">Team Member</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Effective Capabilities</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => {
                  const summary = getPermissionSummary(u);
                  const isCurrent = u.id === currentUser.id;
                  const isOwner = u.role === 'owner';
                  const activeOwnersCount = users.filter(o => o.role === 'owner' && o.active).length;
                  const isSoleOwner = isOwner && activeOwnersCount <= 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-purple-50 text-[#4C0196] px-1.5 py-0.5 rounded font-bold border border-purple-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                        {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                      </td>

                      <td className="py-3 px-3">
                        {currentUser.role === 'owner' && !isSoleOwner ? (
                          <select
                            value={u.role}
                            onChange={e => handleChangeRole(u.id, e.target.value as UserRole)}
                            className="text-xs px-2 py-1 border border-slate-200 rounded-md font-semibold bg-white capitalize cursor-pointer focus:ring-1 focus:ring-[#4C0196]"
                          >
                            <option value="owner">Owner (Full Control)</option>
                            <option value="manager">Manager (Operations &amp; P&amp;L)</option>
                            <option value="staff">Staff (Front-desk Cashier)</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'owner'
                                ? 'bg-purple-100 text-[#4C0196]'
                                : u.role === 'manager'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                        {isSoleOwner && (
                          <span className="block text-[9px] text-amber-600 font-medium mt-1">
                            Protected (Only Owner)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              summary.hasSales ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            Sales {summary.hasSales ? '✓' : '✕'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              summary.hasCustomers ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            Customers {summary.hasCustomers ? '✓' : '✕'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              summary.hasCatalog ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            Catalog {summary.hasCatalog ? '✓' : '✕'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              summary.hasReports ? 'bg-purple-50 text-[#4C0196] border border-purple-200 font-semibold' : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            Reports {summary.hasReports ? '✓' : '✕'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              summary.hasExpenses ? 'bg-purple-50 text-[#4C0196] border border-purple-200 font-semibold' : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            Expenses {summary.hasExpenses ? '✓' : '✕'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              summary.hasSettings ? 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold' : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            Settings {summary.hasSettings ? '✓' : '✕'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('manage_permissions') && (
                            <button
                              type="button"
                              onClick={() => handleOpenCustomizePermissions(u)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#4C0196] bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors cursor-pointer"
                              title="Customize granular capabilities"
                            >
                              Customize
                            </button>
                          )}

                          {hasPermission('manage_users') && !isSoleOwner && !isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Remove user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* RBAC Security & Owner Protection Overview Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4C0196]" />
              <span>BizFlow Role &amp; Permission Architecture:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600 pt-1">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-[#4C0196] uppercase text-[10px] tracking-wider block mb-1">
                  1. Business Owner
                </span>
                <p>Full system authority. Manages bank settings, tax parameters, user permissions, and has strict deletion protection.</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wider block mb-1">
                  2. Business Manager
                </span>
                <p>Operational &amp; financial management. Can record sales, log expenses, manage stock, view P&amp;L reports, but cannot remove the Owner.</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
                  3. Front-desk Staff
                </span>
                <p>High-speed cashier workflow. Enters sales, creates students, prints receipts. Private P&amp;L metrics and deletions are strictly locked.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Categories & Backups */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custom Expense Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Custom Operating Expense Categories</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tag operating expenditures (Generator Diesel, Internet, Facility Maintenance)</p>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Workshop Supplies, Diesel Fuel..."
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#4C0196]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#7B001C] text-white text-xs font-bold rounded-lg hover:bg-[#600016] cursor-pointer"
              >
                Add Category
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2 max-h-56 overflow-y-auto">
              {expenseCategories.map(cat => (
                <span
                  key={cat}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Data Backup & Factory Reset */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Management &amp; Database Architecture</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Authoritative Cloud SQL PostgreSQL persistence and backup exports</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>PostgreSQL Active</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {canManageBusiness ? (
                <>
                  {/* One-click LocalStorage Migration Button */}
                  <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">Browser LocalStorage Migration Tool</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Safe Import</span>
                    </div>
                    <p className="text-[11px] text-purple-900 leading-relaxed">
                      If this browser previously held offline records in localStorage, click below to migrate customers, catalog, sales, and expenses into Cloud SQL without deleting legacy data.
                    </p>
                    <button
                      type="button"
                      disabled={isMigrating}
                      onClick={async () => {
                        setIsMigrating(true);
                        setMigrationStatus('Migrating records to PostgreSQL...');
                        const res = await migrateLegacyLocalStorageData();
                        setIsMigrating(false);
                        setMigrationStatus(res.message);
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      {isMigrating ? 'Importing...' : 'Migrate Browser Records to PostgreSQL'}
                    </button>
                    {migrationStatus && (
                      <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                        ✓ {migrationStatus}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-700" />
                    <span>Export Full Ledger Backup (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to clear the dashboard and reset all sales, expenses, payables, and customer balances to zero for live operational usage? This action cannot be undone.')) {
                        const res = await resetLedgerToZero();
                        if (res.success) {
                          alert('Dashboard and ledger entries have been reset to zero!');
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-700" />
                    <span>Clear Dashboard &amp; Reset Entries to Zero (Live Usage)</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetToDemoData}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span>Restore Smartcore ICT Centre Demo Dataset</span>
                  </button>
                </>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Full database backup export and system restore are restricted to the Business Owner.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Immutable Audit Trail &amp; Activity Log</h2>
              <p className="text-xs text-slate-500">Records receipt prints, WhatsApp reminders, permission adjustments, and payments</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{auditLogs.length} logged actions</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.userRole}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] font-mono text-[#4C0196]">{log.action}</span>
                  </div>
                  <p className="text-slate-700 text-xs mt-0.5 leading-snug">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Customize User Permissions */}
      {permissionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden animate-in fade-in duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4C0196] flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Customize Capabilities: {permissionModalUser.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Role: <span className="font-semibold uppercase">{permissionModalUser.role}</span> · {editingPermissions.length} active permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">Quick Presets:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToRoleDefaults}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 font-semibold cursor-pointer"
                >
                  Role Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllPermissions}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 font-semibold cursor-pointer"
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllPermissions}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Body: Grouped Permissions */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5 text-xs">
              {permissionSaveMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{permissionSaveMessage}</span>
                </div>
              )}

              {PERMISSION_GROUPS.map(group => (
                <div key={group.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div>
                      <span className="font-bold text-slate-800 text-xs">{group.name}</span>
                      <p className="text-[11px] text-slate-500">{group.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {group.permissions.map(perm => {
                      const isChecked = editingPermissions.includes(perm);
                      const meta = PERMISSION_LABELS[perm];

                      return (
                        <label
                          key={perm}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-purple-50/60 border-purple-200 text-purple-950'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm)}
                            className="w-4 h-4 mt-0.5 text-[#4C0196] rounded border-slate-300 focus:ring-[#4C0196] cursor-pointer"
                          />
                          <div>
                            <span className="font-semibold text-xs block leading-tight">{meta.label}</span>
                            <span className="text-[10.5px] text-slate-500 leading-tight block mt-0.5">
                              {meta.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Team Member */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">+ Add Team Member</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Samuel Eze"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="samuel@smartcoreict.online"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+234 814 000 0000"
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="staff">Staff (Front Desk / Cashier)</option>
                  <option value="manager">Manager (Operations &amp; P&amp;L)</option>
                  <option value="owner">Owner (Full System Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4C0196] text-white font-bold rounded-lg hover:bg-[#3b0075]"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
