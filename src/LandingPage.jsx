import { useEffect, useRef, useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';

const inputStyle = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(51,102,204,0.4)',
  borderRadius: 10, color: '#fff',
  fontSize: 16, fontFamily: 'sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

const btnPrimary = {
  width: '100%', padding: '14px 24px',
  background: '#3366CC', color: '#fff',
  border: 'none', borderRadius: 10,
  fontSize: 16, fontWeight: 600,
  fontFamily: 'sans-serif', cursor: 'pointer',
};

const btnGoogle = {
  width: '100%', padding: '14px 24px',
  background: '#fff', color: '#1a1a2e',
  border: 'none', borderRadius: 10,
  fontSize: 16, fontWeight: 600,
  fontFamily: 'sans-serif', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const btnGuest = {
  width: '100%', padding: '14px 24px',
  background: 'transparent', color: '#7aa3e8',
  border: '1px solid rgba(51,102,204,0.35)',
  borderRadius: 10, fontSize: 15,
  fontFamily: 'sans-serif', cursor: 'pointer',
};

const btnLink = {
  background: 'none', border: 'none', color: '#7aa3e8',
  fontSize: 13, fontFamily: 'sans-serif', cursor: 'pointer',
  textDecoration: 'underline', padding: 0,
};

const errorStyle = {
  color: '#ff6b6b', fontSize: 13,
  fontFamily: 'sans-serif', textAlign: 'center',
  marginTop: 4,
};

const successStyle = {
  color: '#4caf80', fontSize: 13,
  fontFamily: 'sans-serif', textAlign: 'center',
  marginTop: 4,
};

// steps: 'buttons' | 'signin' | 'signup' | 'verify' | 'forgot' | 'reset'
export default function LandingPage({ onGuest, onContinueAsGuest }) {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const canvasRef = useRef(null);

  const [step, setStep] = useState('buttons');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animated canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, t = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const spacing = 60;
      ctx.strokeStyle = 'rgba(51,102,204,0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      const chips = [
        { label: 'LAL 98', x: 0.15, y: 0.2, phase: 0 },
        { label: 'BOS 104', x: 0.75, y: 0.15, phase: 1.5 },
        { label: 'Q3 4:22', x: 0.55, y: 0.7, phase: 0.8 },
        { label: '🏆 #7', x: 0.25, y: 0.75, phase: 2.1 },
        { label: 'IOWA 72', x: 0.85, y: 0.55, phase: 1.2 },
      ];
      chips.forEach(chip => {
        const cy = chip.y * height + Math.sin(t * 0.5 + chip.phase) * 12;
        const cx = chip.x * width;
        const alpha = 0.25 + Math.sin(t * 0.3 + chip.phase) * 0.1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#1a2744'; ctx.strokeStyle = '#3366CC'; ctx.lineWidth = 1;
        const w = 90, h = 28, r = 6;
        ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = alpha * 2; ctx.fillStyle = '#7aa3e8';
        ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(chip.label, cx, cy); ctx.restore();
      });
      t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const reset = (nextStep) => {
    setError(''); setSuccess(''); setCode(''); setPassword(''); setConfirmPassword('');
    setStep(nextStep);
  };

  const handleGoogleSignIn = () => {
    signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    });
  };

  // ── SIGN IN with password ──────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setError(''); setLoading(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        window.location.href = '/';
      } else {
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err) {
      const code = err.errors?.[0]?.code || '';
      if (code.includes('form_password_incorrect')) {
        setError('Incorrect password. Try again or use Forgot Password.');
      } else if (code.includes('form_identifier_not_found')) {
        setError('No account found with that email. Sign up instead?');
      } else {
        setError(err.errors?.[0]?.message || 'Sign in failed. Please try again.');
      }
    }
    setLoading(false);
  };

  // ── SIGN UP with password ──────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err) {
      const errCode = err.errors?.[0]?.code || '';
      if (errCode.includes('form_identifier_exists')) {
        setError('An account with this email already exists. Sign in instead.');
      } else {
        setError(err.errors?.[0]?.message || 'Sign up failed. Please try again.');
      }
    }
    setLoading(false);
  };

  // ── VERIFY email after sign up ─────────────────────────────────────────────
  const handleVerify = async () => {
    if (!code.trim()) { setError('Please enter the verification code.'); return; }
    setError(''); setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
        window.location.href = '/';
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid code. Please try again.');
    }
    setLoading(false);
  };

  // ── FORGOT PASSWORD — send reset code (falls back to OTP for password-less accounts) ──
  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError(''); setLoading(true);
    try {
      const si = await signIn.create({ identifier: email.trim() });
      const hasPasswordReset = si.supportedFirstFactors?.some(f => f.strategy === 'reset_password_email_code');
      const hasEmailCode = si.supportedFirstFactors?.some(f => f.strategy === 'email_code');

      if (hasPasswordReset) {
        // Normal password reset flow
        await signIn.prepareFirstFactor({ strategy: 'reset_password_email_code' });
        setSuccess('Reset code sent! Check your email.');
        setStep('reset');
      } else if (hasEmailCode) {
        // Account has no password yet — sign in with OTP code instead
        const emailFactor = si.supportedFirstFactors.find(f => f.strategy === 'email_code');
        await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: emailFactor.emailAddressId });
        setSuccess("This account doesn't have a password yet — we sent a sign-in code instead.");
        setStep('otp');
      } else {
        setError('Could not send a reset email. Try signing in with Google.');
      }
    } catch (err) {
      const errCode = err.errors?.[0]?.code || '';
      if (errCode.includes('form_identifier_not_found')) {
        setError('No account found with that email.');
      } else {
        setError(err.errors?.[0]?.message || 'Could not send reset email. Please try again.');
      }
    }
    setLoading(false);
  };

  // ── RESET PASSWORD — verify code + set new password ───────────────────────
  const handleResetPassword = async () => {
    if (!code.trim() || !password) { setError('Please enter the code and your new password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        window.location.href = '/';
      } else {
        setError('Reset incomplete. Please try again.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid code or password. Please try again.');
    }
    setLoading(false);
  };

  // ── OTP sign-in (fallback for password-less accounts) ────────────────────
  const handleVerifyOTP = async () => {
    if (!code.trim()) { setError('Please enter the code.'); return; }
    setError(''); setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        window.location.href = '/';
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid code. Please try again.');
    }
    setLoading(false);
  };
    { icon: '🎯', label: 'Squares Game' },
    { icon: '⏱', label: 'Timeout Game' },
    { icon: '📺', label: 'Live Scores' },
    { icon: '👥', label: 'Group Play' },
    { icon: '🏈', label: 'NFL & CFB' },
    { icon: '🏀', label: 'NBA & NCAA' },
  ];

  const eyeIcon = showPassword ? '🙈' : '👁';

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e1a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(51,102,204,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480, width: '100%' }}>
        {/* Logo */}
        <div style={{ margin: '0 auto 20px', width: 96, height: 96, borderRadius: '50%', boxShadow: '0 0 40px rgba(51,102,204,0.4)', overflow: 'hidden' }}>
          <img src="/logo.png" alt="Bock Talks"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #3366CC, #1a44aa)';
              e.target.parentElement.style.display = 'flex';
              e.target.parentElement.style.alignItems = 'center';
              e.target.parentElement.style.justifyContent = 'center';
              e.target.parentElement.innerHTML = '<span style="font-family:sans-serif;font-weight:900;font-size:36px;color:#fff">B</span>';
            }}
          />
        </div>

        <h1 style={{
          fontFamily: "'Barlow Condensed', 'Impact', sans-serif",
          fontSize: 'clamp(42px, 10vw, 72px)', fontWeight: 700,
          color: '#fff', margin: '0 0 8px', letterSpacing: '-1px',
          lineHeight: 1, textTransform: 'uppercase',
        }}>BOCK TALKS</h1>

        <p style={{ color: '#7aa3e8', fontFamily: 'sans-serif', fontSize: 16, margin: '0 0 32px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Sports Games · Live Scores
        </p>

        {/* Feature pills */}
        {step === 'buttons' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
            {features.map(f => (
              <div key={f.label} style={{
                background: 'rgba(51,102,204,0.1)', border: '1px solid rgba(51,102,204,0.3)',
                borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#a0b8e8',
                fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{f.icon}</span>{f.label}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP: buttons ── */}
        {step === 'buttons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={handleGoogleSignIn} style={btnGoogle}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={() => reset('signin')} style={btnPrimary}>🔑 Sign In with Email</button>
            <button onClick={() => reset('signup')} style={{ ...btnPrimary, background: '#1a3a7a' }}>✉️ Create Account</button>
            <button onClick={onGuest || onContinueAsGuest} style={btnGuest}>Continue as Guest →</button>
          </div>
        )}

        {/* ── STEP: sign in ── */}
        {step === 'signin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            <div style={{ textAlign: 'center', color: '#a0b8e8', fontFamily: 'sans-serif', fontSize: 15, marginBottom: 4 }}>
              Sign in to your account
            </div>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              style={inputStyle} autoFocus />
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                style={{ ...inputStyle, paddingRight: 44 }} />
              <button onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {eyeIcon}
              </button>
            </div>
            {error && <p style={errorStyle}>{error}</p>}
            <button onClick={handleSignIn} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => reset('forgot')} style={btnLink}>Forgot password?</button>
              <button onClick={() => reset('signup')} style={btnLink}>Create account</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={async () => {
                if (!email.trim()) { setError('Enter your email above first.'); return; }
                setError(''); setLoading(true);
                try {
                  const si = await signIn.create({ identifier: email.trim() });
                  const emailFactor = si.supportedFirstFactors?.find(f => f.strategy === 'email_code');
                  if (emailFactor) {
                    await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: emailFactor.emailAddressId });
                    setStep('otp');
                  } else {
                    setError('Email code sign-in is not available for this account.');
                  }
                } catch (err) {
                  setError(err.errors?.[0]?.message || 'Could not send code.');
                }
                setLoading(false);
              }} style={btnLink}>
                Send me a sign-in code instead
              </button>
            </div>
            <button onClick={() => reset('buttons')} style={btnGuest}>← Back</button>
          </div>
        )}

        {/* ── STEP: sign up ── */}
        {step === 'signup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            <div style={{ textAlign: 'center', color: '#a0b8e8', fontFamily: 'sans-serif', fontSize: 15, marginBottom: 4 }}>
              Create your Bock Talks account
            </div>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} autoFocus />
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 characters)" value={password}
                onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 44 }} />
              <button onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {eyeIcon}
              </button>
            </div>
            <input type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignUp()}
              style={inputStyle} />
            {error && <p style={errorStyle}>{error}</p>}
            <button onClick={handleSignUp} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => reset('signin')} style={btnLink}>Already have an account? Sign in</button>
            </div>
            <button onClick={() => reset('buttons')} style={btnGuest}>← Back</button>
          </div>
        )}

        {/* ── STEP: verify email after sign up ── */}
        {step === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#a0b8e8', fontFamily: 'sans-serif', fontSize: 15, margin: '0 0 4px' }}>
              We sent a verification code to <strong style={{ color: '#fff' }}>{email}</strong>. Enter it below to activate your account.
            </p>
            <input type="text" inputMode="numeric" placeholder="123456" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 28, letterSpacing: 8 }} autoFocus />
            {error && <p style={errorStyle}>{error}</p>}
            <button onClick={handleVerify} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button onClick={() => reset('signup')} style={btnGuest}>← Back</button>
          </div>
        )}

        {/* ── STEP: forgot password ── */}
        {step === 'forgot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#a0b8e8', fontFamily: 'sans-serif', fontSize: 15, margin: '0 0 4px' }}>
              Enter your email and we'll send you a password reset code.
            </p>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
              style={inputStyle} autoFocus />
            {error && <p style={errorStyle}>{error}</p>}
            {success && <p style={successStyle}>{success}</p>}
            <button onClick={handleForgotPassword} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
            <button onClick={() => reset('signin')} style={btnGuest}>← Back to Sign In</button>
          </div>
        )}

        {/* ── STEP: reset password ── */}
        {step === 'reset' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#a0b8e8', fontFamily: 'sans-serif', fontSize: 15, margin: '0 0 4px' }}>
              Enter the reset code sent to <strong style={{ color: '#fff' }}>{email}</strong> and choose a new password.
            </p>
            <input type="text" inputMode="numeric" placeholder="Reset code" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 22, letterSpacing: 6 }} autoFocus />
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="New password (min 8 characters)" value={password}
                onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 44 }} />
              <button onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {eyeIcon}
              </button>
            </div>
            <input type={showPassword ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
              style={inputStyle} />
            {error && <p style={errorStyle}>{error}</p>}
            {success && <p style={successStyle}>{success}</p>}
            <button onClick={handleResetPassword} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Resetting…' : 'Reset Password & Sign In'}
            </button>
            <button onClick={() => reset('forgot')} style={btnGuest}>← Resend Code</button>
          </div>
        )}

        {/* ── STEP: OTP sign-in (password-less accounts) ── */}
        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#a0b8e8', fontFamily: 'sans-serif', fontSize: 15, margin: '0 0 4px' }}>
              {success
                ? success
                : <>We sent a 6-digit code to <strong style={{ color: '#fff' }}>{email}</strong>. Enter it below.</>}
            </p>
            <input type="text" inputMode="numeric" placeholder="123456" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 28, letterSpacing: 8 }} autoFocus />
            {error && <p style={errorStyle}>{error}</p>}
            <button onClick={handleVerifyOTP} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button onClick={() => reset('forgot')} style={btnGuest}>← Back</button>
          </div>
        )}

        <p style={{ marginTop: 20, color: '#3a4a6b', fontFamily: 'sans-serif', fontSize: 12 }}>
          By signing in you agree to our{' '}
          <a href="/privacy" style={{ color: '#5577aa' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
