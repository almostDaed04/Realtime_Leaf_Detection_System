import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DURATION_OPTIONS = [
  { id: 'indefinite', label: 'Whenever I Want', description: 'Reactivate anytime on demand', days: null, popular: true },
  { id: '1_day', label: '1 Day', description: '24 hours break', days: 1 },
  { id: '3_days', label: '3 Days', description: 'Weekend pause', days: 3 },
  { id: '7_days', label: '1 Week', description: '7 days pause', days: 7 },
  { id: '14_days', label: '2 Weeks', description: '14 days pause', days: 14 },
  { id: '30_days', label: '1 Month', description: '30 days detox', days: 30 },
  { id: 'custom', label: 'Custom', description: 'Pick days or date', days: null },
];

const REASONS = [
  'Taking a short digital break',
  'Not currently scanning or gardening',
  'Too busy right now',
  'Privacy / security check',
  'Platform testing completed',
  'Other reason',
];

const Settings = () => {
  const { user, deactivateAccount } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [duration, setDuration] = useState('indefinite');
  const [customDays, setCustomDays] = useState(5);
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Calculate reactivation target timestamp
  const targetReactivationDate = useMemo(() => {
    const now = new Date();
    if (duration === 'indefinite') return null;
    if (duration === '1_day') return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    if (duration === '3_days') return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (duration === '7_days') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (duration === '14_days') return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (duration === '30_days') return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (duration === 'custom') {
      if (customDate) {
        const d = new Date(customDate);
        if (!isNaN(d.getTime())) return d;
      }
      const days = parseInt(customDays, 10) || 1;
      return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
    return null;
  }, [duration, customDays, customDate]);

  const formattedTargetDate = useMemo(() => {
    if (!targetReactivationDate) {
      return 'Whenever you want (Reactivate on demand anytime)';
    }
    return targetReactivationDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [targetReactivationDate]);

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your current password to confirm deactivation.');
      return;
    }

    if (duration === 'custom') {
      if (!customDate && (!customDays || customDays < 1 || customDays > 365)) {
        setError('Please enter a valid number of days between 1 and 365.');
        return;
      }
      if (customDate) {
        const target = new Date(customDate);
        if (isNaN(target.getTime()) || target.getTime() <= Date.now()) {
          setError('Custom date must be a date in the future.');
          return;
        }
      }
    }

    setShowConfirmModal(true);
  };

  const handleDeactivate = async () => {
    setLoading(true);
    setError('');
    setShowConfirmModal(false);

    try {
      const finalReason = reason === 'Other reason' && customReason.trim()
        ? customReason.trim()
        : reason;

      const payload = {
        duration,
        reason: finalReason,
        password,
      };

      if (duration === 'custom') {
        if (customDate) {
          payload.customDate = new Date(customDate).toISOString();
        } else {
          payload.customDays = parseInt(customDays, 10);
        }
      }

      const res = await deactivateAccount(payload);
      setSuccessMsg(res.message || 'Account successfully deactivated.');

      // After 2 seconds, redirect to login page with deactivated message
      setTimeout(() => {
        navigate('/login', {
          state: {
            deactivatedMessage: `Your account is deactivated until ${formattedTargetDate}. You can sign back in at any time to reactivate early.`,
          },
        });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Failed to deactivate account. Please check your password and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const memberSince = user?.registrationDate
    ? new Date(user.registrationDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        day: 'numeric',
      })
    : 'Active member';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-96 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/50 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">⚙️</span>
              <h1 className="text-3xl font-bold text-slate-100">Account Settings</h1>
            </div>
            <p className="text-slate-400 mt-1">
              Manage your personal preferences, security, and account status.
            </p>
          </div>

          <Link
            to="/upload"
            className="btn btn-secondary text-sm py-2 px-4 self-start sm:self-auto flex items-center gap-2"
          >
            <span>🍃 Scan a Leaf</span>
          </Link>
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="alert alert-error animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-3 animate-slide-up">
            <span className="text-2xl">🍂</span>
            <div>
              <p className="font-semibold">{successMsg}</p>
              <p className="text-xs text-amber-400/80 mt-0.5">Signing you out and redirecting to login...</p>
            </div>
          </div>
        )}

        {/* Profile Overview Card */}
        <div className="glass-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <span>👤</span>
            <span>Profile Overview</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-500/20">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold text-slate-100">{user?.username}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                  {user?.role === 'admin' ? '⚡ Administrator' : '🌱 Member'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300">
                  Status: Active
                </span>
              </div>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <p className="text-xs text-slate-500">Joined {memberSince}</p>
            </div>
          </div>
        </div>

        {/* Temporary Account Deactivation Section (Primary Feature) */}
        <div className="glass-card p-6 sm:p-8 border border-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
              ⏸️
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Temporary Account Deactivation</span>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pause
                </span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Need some time off? You can temporarily pause your account instead of permanently deleting it.
              </p>
            </div>
          </div>

          {/* What Happens Informational Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
              <span className="text-emerald-400 text-lg">🔒</span>
              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-semibold block text-slate-200">Data Stays Safe</span>
                All your past leaf scans, predictions, and history remain safely saved and untouched.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
              <span className="text-amber-400 text-lg">⏰</span>
              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-semibold block text-slate-200">Automatic Reactivation</span>
                When your selected pause time expires, your account automatically awakens.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
              <span className="text-teal-400 text-lg">⚡</span>
              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-semibold block text-slate-200">Wake Up Early Anytime</span>
                Change your mind? Simply sign in with your email & password to reactivate immediately.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
              <span className="text-purple-400 text-lg">🚪</span>
              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-semibold block text-slate-200">Instant Sign-Out</span>
                You will be immediately logged out of all active devices once confirmed.
              </div>
            </div>
          </div>

          <form onSubmit={handleOpenConfirm} className="space-y-6">
            {/* Step 1: Duration Selection */}
            <div>
              <label className="input-label mb-2 flex items-center justify-between">
                <span>Select Pause Duration</span>
                <span className="text-xs text-slate-400 font-normal">How long do you want to step away?</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = duration === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDuration(opt.id)}
                      className={`
                        relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between
                        ${isSelected
                          ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-950/20 ring-1 ring-amber-400/50'
                          : 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-600'
                        }
                      `}
                    >
                      {opt.popular && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 uppercase tracking-tighter">
                          Popular
                        </span>
                      )}
                      <div className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                        {opt.label}
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 leading-tight">{opt.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Duration Fields (if Custom is chosen) */}
            {duration === 'custom' && (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-4 animate-fade-in">
                <span className="text-xs font-semibold text-slate-300 block">Custom Duration Options:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customDays" className="text-xs text-slate-400 block mb-1">
                      Number of Days (1 – 365)
                    </label>
                    <input
                      id="customDays"
                      type="number"
                      min={1}
                      max={365}
                      value={customDays}
                      onChange={(e) => {
                        setCustomDays(e.target.value);
                        setCustomDate('');
                      }}
                      className="input text-sm py-2"
                      placeholder="e.g. 10"
                    />
                  </div>

                  <div>
                    <label htmlFor="customDate" className="text-xs text-slate-400 block mb-1">
                      Or Specific Reactivation Date
                    </label>
                    <input
                      id="customDate"
                      type="datetime-local"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="input text-sm py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Calculated Target Preview Callout */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800/50 to-emerald-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-amber-300 font-medium block">Scheduled Reactivation</span>
                <span className="text-base font-bold text-slate-100 mt-0.5 block">
                  {formattedTargetDate}
                </span>
              </div>
              <span className="text-xs text-slate-400 sm:text-right">
                Account will automatically reactivate or sign in early anytime.
              </span>
            </div>

            {/* Step 2: Reason for Deactivation */}
            <div>
              <label htmlFor="reason" className="input-label mb-1">
                Reason for Leaving (Optional)
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input text-sm py-2.5"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-slate-200">
                    {r}
                  </option>
                ))}
              </select>

              {reason === 'Other reason' && (
                <input
                  type="text"
                  maxLength={200}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell us a little more (optional)..."
                  className="input text-sm mt-2 py-2"
                />
              )}
            </div>

            {/* Step 3: Password Confirmation */}
            <div>
              <label htmlFor="confirmPassword" className="input-label mb-1">
                Confirm Your Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="input text-sm py-2.5 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Required for security verification before deactivating.
              </span>
            </div>

            {/* Action Trigger */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !password}
                className="btn w-full sm:w-auto py-3 px-6 bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-950/40 hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>⏸️ Deactivate Account for Selected Time</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 sm:p-7 border border-amber-500/40 shadow-2xl animate-scale-up space-y-5">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-100">
                Confirm Temporary Deactivation
              </h3>
              <p className="text-sm text-slate-300">
                Are you sure you want to pause your account?
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-2">
              <div className="flex justify-between pb-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Scheduled wakeup:</span>
                <span className="font-semibold text-amber-300">{formattedTargetDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="text-slate-200">Immediate log out</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              💡 Remember, you can sign in anytime before then to reactivate early.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="btn btn-secondary flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={loading}
                className="btn flex-1 py-2.5 text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                {loading ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
