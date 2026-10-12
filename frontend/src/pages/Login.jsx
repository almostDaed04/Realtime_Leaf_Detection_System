import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e) => {
e.preventDefault();

setError('');
setLoading(true);

try {
  // Step 1:
  // Verify email and password.
  // Backend will send OTP to the user's email.
  await login(email, password);

  // Step 2:
  // Redirect user to OTP verification page.
  navigate('/verify', {
    state: {
      email,
    },
  });

} catch (err) {

  const message =
    err.response?.data?.error ||
    err.response?.data?.details?.[0]?.message ||
    'Login failed. Please try again.';

  setError(message);

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
      <div className="text-center mb-8">

        <span className="text-4xl">
          🍃
        </span>

        <h1 className="text-2xl font-bold text-slate-200 mt-3">
          Welcome Back
        </h1>

        <p className="text-slate-400 mt-1">
          Sign in to your LeafScan account
        </p>

      </div>


      {/* Error Message */}
      {error && (

        <div className="alert alert-error mb-6 animate-fade-in">

          ⚠️ {error}

        </div>

      )}


      {/* Login Form */}
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
          className="btn btn-primary w-full py-3"
        >

          {loading ? (

            <>
              <span className="spinner"></span>
              Signing in...
            </>

          ) : (

            'Sign In'

          )}

        </button>

      </form>


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
