import { useState, useEffect } from 'react';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  useUser,
  useClerk,
} from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import LandingPage from './LandingPage';
import PrivacyPolicy from './PrivacyPolicy';
import TutorialTour, { TourReplayButton } from './TutorialTour';
import SquaresGame from './games/squares/SquaresGame';
import TimeoutGame from './games/timeout/TimeoutGame';
import GroupsPage from './components/GroupsPage';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const GUEST_KEY = 'bt_guest_mode';

// ─── Loading Screen ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3366CC, #1a44aa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'sans-serif',
          margin: '0 auto 16px',
          boxShadow: '0 0 30px rgba(51,102,204,0.4)',
        }}>B</div>
        <div style={{
          color: '#3366CC', fontFamily: 'sans-serif', fontSize: 13,
          letterSpacing: '2px', textTransform: 'uppercase',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>Loading…</div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }`}</style>
    </div>
  );
}

// ─── Guest banner ─────────────────────────────────────────────────────────────
function GuestBanner({ onSignIn }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 8000,
      background: 'rgba(51,102,204,0.15)',
      borderBottom: '1px solid rgba(51,102,204,0.3)',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'sans-serif', fontSize: 13,
    }}>
      <span style={{ color: '#7aa3e8' }}>👤 Playing as guest</span>
      <button onClick={onSignIn} style={{
        background: '#3366CC', border: 'none', borderRadius: 6,
        color: '#fff', fontSize: 12, fontWeight: 600,
        padding: '5px 12px', cursor: 'pointer',
      }}>Sign in for groups & more</button>
    </div>
  );
}

// ─── Main App shell (shown after auth / guest mode) ───────────────────────────
function MainApp({ isGuest, onSignIn }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState('squares');
  const [showTour, setShowTour] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      paddingTop: isGuest ? 40 : 0,
      paddingBottom: 60,
    }}>
      {isGuest && <GuestBanner onSignIn={onSignIn} />}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1526, #1a2744)',
        borderBottom: '1px solid rgba(51,102,204,0.25)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#3366CC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'sans-serif',
          }}>B</div>
          <span style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 16 }}>
            Bock Talks
          </span>
        </div>
        {!isGuest && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#7aa3e8', fontFamily: 'sans-serif', fontSize: 13 }}>
              {user.firstName || user.emailAddresses?.[0]?.emailAddress}
            </span>
            <button onClick={() => signOut()} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: '#7aa3e8', fontSize: 12,
              padding: '4px 10px', cursor: 'pointer', fontFamily: 'sans-serif',
            }}>Sign out</button>
          </div>
        )}
      </div>

      {/* Tab content area */}
      <div style={{ padding: 16 }}>
        {activeTab === 'squares' && <SquaresGame />}
        {activeTab === 'timeout' && <TimeoutGame />}
        {activeTab === 'groups' && <GroupsPage isSignedIn={!isGuest} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0d1526',
        borderTop: '1px solid rgba(51,102,204,0.25)',
        display: 'flex',
        zIndex: 100,
      }}>
        {[
          { id: 'squares', icon: '🎯', label: 'Squares' },
          { id: 'timeout', icon: '⏱', label: 'Timeout' },
          { id: 'groups', icon: '👥', label: 'Groups' },
        ].map(tab => (
          <button
            key={tab.id}
            data-tour={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 8px', background: 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              borderTop: activeTab === tab.id ? '2px solid #3366CC' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{
              fontFamily: 'sans-serif', fontSize: 10,
              color: activeTab === tab.id ? '#3366CC' : '#5577aa',
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <TourReplayButton />
      {showTour && <TutorialTour onDone={() => setShowTour(false)} />}
    </div>
  );
}

// ─── Root router component ────────────────────────────────────────────────────
function AppRoutes() {
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isLoaded, isSignedIn } = useUser();
  const location = useLocation();

  // Check for public URL params (join links, etc.)
  const params = new URLSearchParams(location.search);
  const isPublicUrl = params.has('join') || params.has('pick') || params.has('invite') || params.has('session');

  useEffect(() => {
    if (isLoaded) setLoading(false);
    const saved = sessionStorage.getItem(GUEST_KEY);
    if (saved === '1') setGuestMode(true);
  }, [isLoaded]);

  const handleGuest = () => {
    sessionStorage.setItem(GUEST_KEY, '1');
    setGuestMode(true);
  };

  const handleSignIn = () => {
    sessionStorage.removeItem(GUEST_KEY);
    setGuestMode(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/sso-callback" element={<LoadingScreen />} />
      <Route path="*" element={
        isSignedIn || guestMode || isPublicUrl
          ? <MainApp isGuest={guestMode && !isSignedIn} onSignIn={handleSignIn} />
          : <LandingPage onGuest={handleGuest} />
      } />
    </Routes>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ClerkProvider>
  );
}
