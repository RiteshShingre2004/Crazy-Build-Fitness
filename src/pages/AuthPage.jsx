import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/useApp.js';
import { sendOTP, verifyOTP, pingServer } from '../services/authService.js';
import {
  Zap, Mail, ArrowRight, Loader2, AlertCircle,
  RefreshCw, ArrowLeft, CheckCircle2, ServerCrash, ShieldCheck,
} from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeSlide = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.22 } },
};

// ── Inline error pill ─────────────────────────────────────────────────────────
function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="auth-error"
    >
      <AlertCircle size={14} className="auth-error-icon" />
      <span>{msg}</span>
    </motion.div>
  );
}

// ── Success pill ──────────────────────────────────────────────────────────────
function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="auth-success"
    >
      <CheckCircle2 size={14} className="auth-success-icon" />
      <span>{msg}</span>
    </motion.div>
  );
}

// ── Server offline banner ─────────────────────────────────────────────────────
function OfflineBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="auth-offline-banner"
    >
      <ServerCrash size={15} className="auth-offline-icon" />
      <div>
        <strong>Auth server offline</strong>
        <span> — start it with: </span>
        <code>cd server &amp;&amp; npm run dev</code>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const { login } = useApp();

  // 'email' | 'otp'
  const [screen, setScreen]       = useState('email');
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);

  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [countdown, setCountdown]     = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);

  // null = unknown, true = online, false = offline
  const [serverOnline, setServerOnline] = useState(null);

  const otpRefs  = useRef([]);
  const timerRef = useRef(null);

  // ── Ping backend on mount ────────────────────────────────────────────────────
  useEffect(() => {
    pingServer().then(setServerOnline);
  }, []);

  // ── Countdown ticker ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  // ── Auto-submit when all 6 digits filled ─────────────────────────────────────
  useEffect(() => {
    if (screen === 'otp' && otp.every((d) => d !== '')) {
      handleVerifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // ── Complete login helper ────────────────────────────────────────────────────
  const completeLogin = useCallback((userEmail, userName) => {
    const userData = {
      name:           userName || userEmail.split('@')[0],
      email:          userEmail,
      age:            25,
      gender:         'male',
      weight:         75,
      height:         175,
      activityLevel:  'moderate',
      goal:           'muscle_gain',
      dietPreference: 'non_veg',
    };
    login(userData);
  }, [login]);

  // ── Dev bypass ───────────────────────────────────────────────────────────────
  const handleDevBypass = async () => {
    localStorage.setItem('session_token', 'dev_bypass_token');
    setIsRestoring(true);
    await completeLogin('developer@crazybuildfitness.com', 'Developer');
    setIsRestoring(false);
  };

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOTP = useCallback(async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendOTP(email);
      setServerOnline(true);
      setSuccess('Code sent! Check your inbox.');
      setScreen('otp');
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 420);
    } catch (err) {
      if (err.isNetworkError) setServerOnline(false);
      setError(err.message);
      if (err.retryAfter) setCountdown(err.retryAfter);
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Resend OTP ────────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await sendOTP(email);
      setServerOnline(true);
      setSuccess('New code sent!');
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      if (err.isNetworkError) setServerOnline(false);
      setError(err.message);
      if (err.retryAfter) setCountdown(err.retryAfter);
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Verify OTP ────────────────────────────────────────────────────────────────
  const handleVerifyOTP = useCallback(async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }

    setError('');
    setLoading(true);
    try {
      const { token, email: verifiedEmail } = await verifyOTP(email, code);
      localStorage.setItem('session_token', token);
      setLoading(false);
      setIsRestoring(true);
      await completeLogin(verifiedEmail);
      setIsRestoring(false);
    } catch (err) {
      if (err.isNetworkError) setServerOnline(false);
      setError(err.message);
      setLoading(false);
      setIsRestoring(false);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  }, [email, otp, completeLogin]);

  // ── OTP helpers ───────────────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft'  && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  // Restoring overlay — shown while Supabase fetch runs after OTP/bypass
  if (isRestoring) {
    return (
      <div className="auth-root">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <motion.div
          className="auth-restoring"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="auth-logo-icon" style={{ width: 56, height: 56, borderRadius: 18, marginBottom: '1.25rem' }}>
            <Zap size={30} color="#ffffff" strokeWidth={2.5} />
          </div>
          <Loader2 size={28} className="auth-spin auth-restoring-spinner" />
          <p className="auth-restoring-text">Restoring your data…</p>
          <p className="auth-restoring-sub">Loading your plans and progress</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <motion.div
        className="auth-card-wrap"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo + server status dot */}
        <div className="auth-logo-row">
          <div className="auth-logo-icon">
            <Zap size={26} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span className="auth-logo-text">CRAZY BUILD</span>
          {serverOnline !== null && (
            <span
              className={`auth-server-dot ${serverOnline ? 'auth-server-dot--on' : 'auth-server-dot--off'}`}
              title={serverOnline ? 'Auth server online' : 'Auth server offline'}
            />
          )}
        </div>

        {/* Offline banner */}
        <AnimatePresence>
          {serverOnline === false && <OfflineBanner key="offline" />}
        </AnimatePresence>

        {/* Card */}
        <div className="auth-card">
          <AnimatePresence mode="wait">

            {/* ── EMAIL SCREEN ──────────────────────────────────────────── */}
            {screen === 'email' && (
              <motion.div key="email" {...fadeSlide}>
                <div className="auth-screen-header">
                  <h1 className="auth-title">Welcome back</h1>
                  <p className="auth-subtitle">Enter your email to receive a secure login code</p>
                </div>

                <form onSubmit={handleSendOTP} className="auth-form">
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="auth-email">Email Address</label>
                    <div className="auth-input-wrap">
                      <Mail size={17} className="auth-input-icon" />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        placeholder="athlete@example.com"
                        className="auth-input"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    <ErrorMsg   msg={error}   key="err" />
                    <SuccessMsg msg={success} key="suc" />
                  </AnimatePresence>

                  <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={loading || !email.trim()}
                    id="send-otp-btn"
                  >
                    {loading
                      ? <Loader2 size={18} className="auth-spin" />
                      : <><span>Send Code</span><ArrowRight size={17} /></>
                    }
                  </button>
                </form>

                {/* Dev bypass */}
                <div className="auth-divider">
                  <span>or</span>
                </div>
                <button
                  type="button"
                  className="auth-btn-bypass"
                  onClick={handleDevBypass}
                  id="dev-bypass-btn"
                >
                  <ShieldCheck size={15} />
                  Skip auth &amp; enter as developer
                </button>

                <p className="auth-footer-note">
                  🔒 We'll never share your email.
                </p>
              </motion.div>
            )}

            {/* ── OTP SCREEN ────────────────────────────────────────────── */}
            {screen === 'otp' && (
              <motion.div key="otp" {...fadeSlide}>
                <button
                  className="auth-back-btn"
                  onClick={() => { setScreen('email'); setError(''); setSuccess(''); }}
                  aria-label="Back to email"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <div className="auth-screen-header">
                  <h1 className="auth-title">Check your inbox</h1>
                  <p className="auth-subtitle">
                    We sent a 6-digit code to<br />
                    <span className="auth-email-highlight">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="auth-form">
                  <div className="otp-grid" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-digit-${i}`}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        disabled={loading}
                        className={`otp-box${digit ? ' otp-box--filled' : ''}`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  <AnimatePresence>
                    <ErrorMsg   msg={error}   key="err" />
                    <SuccessMsg msg={success} key="suc" />
                  </AnimatePresence>

                  <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={loading || otp.join('').length < 6}
                    id="verify-otp-btn"
                  >
                    {loading
                      ? <Loader2 size={18} className="auth-spin" />
                      : <><span>Verify &amp; Sign In</span><ArrowRight size={17} /></>
                    }
                  </button>
                </form>

                <div className="auth-resend-row">
                  {countdown > 0 ? (
                    <span className="auth-resend-timer">
                      Resend code in <strong>{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="auth-resend-btn"
                      onClick={handleResend}
                      disabled={loading}
                      id="resend-otp-btn"
                    >
                      <RefreshCw size={13} />
                      Resend code
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="auth-bottom-note">Crazy Build Fitness — Level up every day ⚡</p>
      </motion.div>
    </div>
  );
}
