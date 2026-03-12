import { useEffect, useRef } from 'react';
import { useSignIn } from '@clerk/clerk-react';

export default function LandingPage({ onGuest, onContinueAsGuest }) {
  const { signIn } = useSignIn();
  const canvasRef = useRef(null);

  // Animated grid background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Grid lines
      const spacing = 60;
      ctx.strokeStyle = 'rgba(51,102,204,0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Floating score chips
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
        ctx.fillStyle = '#1a2744';
        ctx.strokeStyle = '#3366CC';
        ctx.lineWidth = 1;
        const w = 90, h = 28, r = 6;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
        ctx.fill(); ctx.stroke();

        ctx.globalAlpha = alpha * 2;
        ctx.fillStyle = '#7aa3e8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chip.label, cx, cy);
        ctx.restore();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const handleGoogleSignIn = () => {
    signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    });
  };

  const features = [
    { icon: '🎯', label: 'Squares Game' },
    { icon: '⏱', label: 'Timeout Game' },
    { icon: '📺', label: 'Live Scores' },
    { icon: '👥', label: 'Group Play' },
    { icon: '🏈', label: 'NFL & CFB' },
    { icon: '🏀', label: 'NBA & NCAA' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated canvas background */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(51,102,204,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480, width: '100%' }}>
        {/* Logo */}
        <div style={{
          margin: '0 auto 20px',
          width: 96, height: 96,
          borderRadius: '50%',
          boxShadow: '0 0 40px rgba(51,102,204,0.4)',
          overflow: 'hidden',
        }}>
          <img
            src="/logo.png"
            alt="Bock Talks"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => {
              // Fallback to B circle if logo not found
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
          fontSize: 'clamp(42px, 10vw, 72px)',
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 8px',
          letterSpacing: '-1px',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}>BOCK TALKS</h1>

        <p style={{
          color: '#7aa3e8',
          fontFamily: 'sans-serif',
          fontSize: 16,
          margin: '0 0 32px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>Sports Games · Live Scores</p>

        {/* Feature pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          justifyContent: 'center', marginBottom: 40,
        }}>
          {features.map(f => (
            <div key={f.label} style={{
              background: 'rgba(51,102,204,0.1)',
              border: '1px solid rgba(51,102,204,0.3)',
              borderRadius: 20, padding: '6px 14px',
              fontSize: 13, color: '#a0b8e8',
              fontFamily: 'sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{f.icon}</span>{f.label}
            </div>
          ))}
        </div>

        {/* Sign in buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={handleGoogleSignIn} style={{
            width: '100%', padding: '14px 24px',
            background: '#fff', color: '#1a1a2e',
            border: 'none', borderRadius: 10,
            fontSize: 16, fontWeight: 600,
            fontFamily: 'sans-serif',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button onClick={onGuest || onContinueAsGuest} style={{
            width: '100%', padding: '14px 24px',
            background: 'transparent', color: '#7aa3e8',
            border: '1px solid rgba(51,102,204,0.35)',
            borderRadius: 10, fontSize: 15,
            fontFamily: 'sans-serif', cursor: 'pointer',
          }}>
            Continue as Guest →
          </button>
        </div>

        <p style={{
          marginTop: 20, color: '#3a4a6b',
          fontFamily: 'sans-serif', fontSize: 12,
        }}>
          By signing in you agree to our{' '}
          <a href="/privacy" style={{ color: '#5577aa' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
