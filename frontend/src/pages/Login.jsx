import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deactivationInfo, setDeactivationInfo] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' | 'reactivate'

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isDeactivatedRedirect = searchParams.get('deactivated') === 'true';
  const bannerMessage = location.state?.deactivatedMessage || (isDeactivatedRedirect ? 'Your account is currently paused. Sign in or reactivate below.' : '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setDeactivationInfo(null);
    setLoading(true);

    try {
      const isReactivateMode = mode === 'reactivate';
      const res = await login(email, password, isReactivateMode);

      // If user is in login mode and account is temporarily deactivated, show interactive reactivation card
      if (res.isDeactivated) {
        setDeactivationInfo(res);
        return;
      }

      // Normal or auto-reactivated login -> verify OTP
      navigate('/verify', {
        state: {
          email,
          reactivated: res.reactivated || isReactivateMode,
        },
      });
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Authentication failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReactivate = async () => {
    setError('');
    setLoading(true);

    try {
      await login(email, password, true);

      navigate('/verify', {
        state: {
          email,
          reactivated: true,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Reactivation failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

return (
<div className="min-h-screen flex items-center justify-center px-4 py-12">

  {/* Background orbs */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">

    <div className="absolute top-1/4 -left-20 w-60 h-60 bg-emerald-500/8 rounded-full blur-3xl"></div>

    <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-amber-500/8 rounded-full blur-3xl"></div>

  </div>


  <div className="relative w-full max-w-md animate-slide-up">

    <div className="glass-card p-8 sm:p-10">

      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-4xl">
          {mode === 'reactivate' ? '⚡' : '🍃'}
        </span>
        <h1 className="text-2xl font-bold text-slate-200 mt-3">
          {mode === 'reactivate' ? 'Reactivate Account' : 'Welcome Back'}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {mode === 'reactivate'
            ? 'Wake up your paused account anytime on demand'
            : 'Sign in to your LeafScan account'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      {!deactivationInfo && (
        <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🍃</span>
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reactivate');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              mode === 'reactivate'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡</span>
            <span>Reactivate Account</span>
          </button>
        </div>
      )}

      {/* Account Deactivated Banner Notice */}
      {bannerMessage && !deactivationInfo && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3 animate-fade-in">
          <span className="text-xl">🍂</span>
          <div className="space-y-0.5">
            <span className="font-semibold block text-amber-200">Account Paused</span>
            <span>{bannerMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error mb-6 animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Early Reactivation Flow Card */}
      {deactivationInfo ? (
        <div className="space-y-5 animate-scale-up">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
            <span className="text-4xl inline-block">⏸️</span>
            <h2 className="text-lg font-bold text-slate-100">
              Account Is Temporarily Paused
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              This account was deactivated and is scheduled to remain paused until:
            </p>
            <div className="py-2.5 px-3 bg-slate-900/80 rounded-xl border border-amber-500/30 font-semibold text-amber-300 text-sm">
              {deactivationInfo.deactivatedUntil
                ? new Date(deactivationInfo.deactivatedUntil).toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Whenever you want (Paused on demand — Reactivate anytime)'}
            </div>
            {deactivationInfo.deactivationReason && (
              <p className="text-xs text-slate-400 italic">
                Reason: "{deactivationInfo.deactivationReason}"
              </p>
            )}
          </div>

          <div className="text-xs text-slate-300 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 space-y-1">
            <p className="font-semibold text-slate-200">Ready to come back early?</p>
            <p className="text-slate-400">
              Reactivating will immediately restore full access to your plant scans and history.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleConfirmReactivate}
              disabled={loading}
              className="btn w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Reactivating Account...</span>
                </>
              ) : (
                <>
                  <span>✨ Reactivate & Send Login Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setDeactivationInfo(null)}
              disabled={loading}
              className="btn btn-secondary w-full py-2.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel & Keep Paused
            </button>
          </div>
        </div>
      ) : (
        /* Login Form */
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

        {/* Email */}
        <div>

          <label
            htmlFor="email"
            className="input-label"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="you@example.com"
            required
            className="input"
            autoComplete="email"
          />

        </div>


        {/* Password */}
        <div>

          <label
            htmlFor="password"
            className="input-label"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              required
              className="input pr-11"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
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

        </div>

        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">Forgot password?</Link>
        </div>


        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`btn w-full py-3 font-semibold flex items-center justify-center gap-2 ${
            mode === 'reactivate'
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/30'
              : 'btn-primary'
          }`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>{mode === 'reactivate' ? 'Reactivating...' : 'Signing in...'}</span>
            </>
          ) : (
            <span>{mode === 'reactivate' ? '⚡ Reactivate & Sign In' : 'Sign In'}</span>
          )}
        </button>
      </form>
      )}


      {/* Signup Link */}
      <p className="text-center text-sm text-slate-400 mt-6">

        Don't have an account?{' '}

        <Link
          to="/signup"
          className="text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Sign up
        </Link>

      </p>

    </div>

  </div>

</div>

);
};

export default Login;
