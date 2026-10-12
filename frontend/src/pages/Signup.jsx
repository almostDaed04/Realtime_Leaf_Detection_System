import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const { register } = useAuth();
const navigate = useNavigate();

const calculateStrength = (pass) => {
  let score = 0;
  if (!pass) return { score, text: '', color: 'bg-slate-700' };
  
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
  if (score === 3 || score === 4) return { score, text: 'Good', color: 'bg-amber-500' };
  return { score, text: 'Strong', color: 'bg-emerald-500' };
};

const strength = calculateStrength(password);

const handleSubmit = async (e) => {
e.preventDefault();
setError('');


// Check whether passwords match
if (password !== confirmPassword) {
  setError('Passwords do not match.');
  return;
}

// Check password strength
if (strength.score < 5) {
  setError('Please choose a stronger password (must meet all criteria).');
  return;
}

setLoading(true);

try {
  // Register user and send verification code
  const data = await register(
    username,
    email,
    password
  );

  // Go to OTP verification page
  navigate('/verify', {
    state: {
      email: data.email,
    },
  });

} catch (err) {

  const message =
    err.response?.data?.error ||
    err.response?.data?.details?.[0]?.message ||
    'Registration failed. Please try again.';

  setError(message);

} finally {

  setLoading(false);

}


};

return ( <div className="min-h-screen flex items-center justify-center px-4 py-12">


  {/* Background orbs */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">

    <div className="absolute top-1/3 -right-20 w-60 h-60 bg-emerald-500/8 rounded-full blur-3xl"></div>

    <div className="absolute bottom-1/3 -left-20 w-60 h-60 bg-amber-500/8 rounded-full blur-3xl"></div>

  </div>

  <div className="relative w-full max-w-md animate-slide-up">

    <div className="glass-card p-8 sm:p-10">

      {/* Header */}
      <div className="text-center mb-8">

        <span className="text-4xl">🌿</span>

        <h1 className="text-2xl font-bold text-slate-200 mt-3">
          Create Account
        </h1>

        <p className="text-slate-400 mt-1">
          Join LeafScan to start identifying leaves
        </p>

      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-6 animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Signup Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* Username */}
        <div>

          <label
            htmlFor="username"
            className="input-label"
          >
            Username
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="leaflover42"
            required
            minLength={3}
            maxLength={30}
            className="input"
            autoComplete="username"
          />

        </div>

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
            onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase, lowercase, numbers, symbols"
              required
              minLength={8}
              className="input pr-11"
              autoComplete="new-password"
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

          {password && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-400">Password strength:</span>
                <span className={`text-xs font-semibold ${strength.text === 'Weak' ? 'text-red-400' : strength.text === 'Good' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {strength.text}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden flex gap-1">
                <div className={`h-full flex-1 rounded-l-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`}></div>
                <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`}></div>
                <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`}></div>
                <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-transparent'}`}></div>
                <div className={`h-full flex-1 rounded-r-full transition-all duration-300 ${strength.score >= 5 ? strength.color : 'bg-transparent'}`}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Must contain 8+ characters, uppercase, lowercase, numbers, and symbols.
              </p>
            </div>
          )}

        </div>

        {/* Confirm Password */}
        <div>

          <label
            htmlFor="confirmPassword"
            className="input-label"
          >
            Confirm Password
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Repeat your password"
              required
              className={`input pr-11 ${
                password &&
                confirmPassword &&
                password !== confirmPassword
                  ? 'input-error'
                  : ''
              }`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
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

          {password &&
            confirmPassword &&
            password !== confirmPassword && (
              <p className="error-text">
                Passwords do not match
              </p>
            )}

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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}

        </button>

      </form>

      {/* Footer */}
      <p className="text-center text-sm text-slate-400 mt-6">

        Already have an account?{' '}

        <Link
          to="/login"
          className="text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Sign in
        </Link>

      </p>

    </div>

  </div>

</div>


);
};

export default Signup;
