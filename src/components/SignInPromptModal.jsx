import { SignInButton } from "@clerk/react";

/**
 * SignInPromptModal
 * 
 * Drop this anywhere and show it when a guest tries a protected action.
 * 
 * Usage:
 *   const [showSignIn, setShowSignIn] = useState(false);
 *   <button onClick={() => !isSignedIn ? setShowSignIn(true) : doThing()}>Create Group</button>
 *   {showSignIn && <SignInPromptModal onClose={() => setShowSignIn(false)} action="create a group" />}
 */
export default function SignInPromptModal({ onClose, action = "do this" }) {
  return (
    <>
      <style>{modalCSS}</style>
      <div className="sipm-backdrop" onClick={onClose}>
        <div className="sipm-card" onClick={e => e.stopPropagation()}>
          {/* Icon */}
          <div className="sipm-icon">🔒</div>

          {/* Text */}
          <h2 className="sipm-title">Sign in required</h2>
          <p className="sipm-body">
            You need to be signed in to {action}.<br />
            It's free and only takes a second.
          </p>

          {/* Buttons */}
          <div className="sipm-actions">
            <SignInButton mode="modal">
              <button className="sipm-signin-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </SignInButton>

            <button className="sipm-cancel-btn" onClick={onClose}>
              Maybe later
            </button>
          </div>

          {/* Guest note */}
          <p className="sipm-guest-note">
            You can still play local games as a guest
          </p>
        </div>
      </div>
    </>
  );
}

const modalCSS = `
  .sipm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: sipmFadeIn 0.15s ease;
  }
  @keyframes sipmFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .sipm-card {
    background: #0d1829;
    border: 1px solid #1e3050;
    border-radius: 20px;
    padding: 32px 28px;
    max-width: 360px;
    width: 100%;
    text-align: center;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    animation: sipmSlideUp 0.2s ease;
  }
  @keyframes sipmSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .sipm-icon {
    font-size: 40px;
    margin-bottom: 16px;
    display: block;
  }

  .sipm-title {
    font-family: 'Barlow Condensed', 'DM Sans', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .sipm-body {
    font-family: 'DM Sans', sans-serif;
    color: #7b8fa6;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 24px;
  }

  .sipm-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .sipm-signin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    background: #fff;
    color: #1a1a1a;
    border: none;
    border-radius: 12px;
    padding: 13px 20px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }
  .sipm-signin-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }

  .sipm-cancel-btn {
    width: 100%;
    background: transparent;
    color: #7b8fa6;
    border: 1px solid #1e3050;
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sipm-cancel-btn:hover {
    border-color: #2a4070;
    color: #a0b4cc;
  }

  .sipm-guest-note {
    font-size: 12px;
    color: #3a4a5a;
    margin: 0;
    font-family: 'DM Sans', sans-serif;
  }
`;
