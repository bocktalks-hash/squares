import { useSignIn } from '@clerk/clerk-react';

export default function SignInPromptModal({ onClose, action = 'do this' }) {
  const { signIn } = useSignIn();

  const handleGoogle = () => {
    signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a2744',
          border: '1px solid rgba(51,102,204,0.4)',
          borderRadius: 14,
          padding: '32px 28px',
          maxWidth: 360, width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <h2 style={{
          fontFamily: 'sans-serif', fontSize: 20, fontWeight: 700,
          color: '#fff', margin: '0 0 8px',
        }}>Sign in required</h2>
        <p style={{
          fontFamily: 'sans-serif', fontSize: 14, color: '#7aa3e8',
          margin: '0 0 24px', lineHeight: 1.5,
        }}>
          You need an account to {action}. It's free and takes seconds.
        </p>

        <button onClick={handleGoogle} style={{
          width: '100%', padding: '13px 20px',
          background: '#fff', color: '#1a1a2e',
          border: 'none', borderRadius: 8,
          fontSize: 15, fontWeight: 600, fontFamily: 'sans-serif',
          cursor: 'pointer', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button onClick={onClose} style={{
          width: '100%', padding: '11px 20px',
          background: 'transparent', color: '#5577aa',
          border: '1px solid rgba(51,102,204,0.25)',
          borderRadius: 8, fontSize: 14,
          fontFamily: 'sans-serif', cursor: 'pointer',
        }}>
          Maybe later
        </button>

        <p style={{ marginTop: 16, color: '#2a3a5a', fontFamily: 'sans-serif', fontSize: 11 }}>
          <a href="/privacy" style={{ color: '#3a5080' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
