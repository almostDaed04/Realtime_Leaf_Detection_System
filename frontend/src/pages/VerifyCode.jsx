import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyCode, resendCode } = useAuth();
  const [email] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyCode(email, code);
      navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    try {
      await resendCode(email);
      setResendMsg('A new code has been sent.');
    } catch {
      setResendMsg('Could not resend code, try again shortly.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="glass-card p-8 sm:p-10">
          <div className="text-center mb-8">
            <span className="text-4xl">📧</span>
            <h1 className="text-2xl font-bold text-slate-200 mt-3">Verify Your Email</h1>
            <p className="text-slate-400 mt-1">Enter the 6-digit code sent to {email}</p>
          </div>

          {error && <div className="alert alert-error mb-6 animate-fade-in">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="code" className="input-label">Verification Code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="input tracking-widest text-center text-lg"
              />
            </div>

            <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary w-full py-3">
              {loading ? (<><span className="spinner"></span>Verifying...</>) : 'Verify'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Didn't get a code?{' '}
            <button onClick={handleResend} className="text-emerald-400 hover:text-emerald-300 font-medium">
              Resend
            </button>
          </p>
          {resendMsg && <p className="text-center text-sm text-emerald-400 mt-2">{resendMsg}</p>}
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;