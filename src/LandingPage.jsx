import { SignInButton, useAuth } from "@clerk/react";
import { useEffect, useState } from "react";

export default function LandingPage({ onContinueAsGuest }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <>
      <style>{landingCSS}</style>
      <div className={`landing-root ${mounted ? "mounted" : ""}`}>
        <div className="grid-bg" />
        <div className="noise-overlay" />

        {/* Floating score chips */}
        <div className="chip chip-1">🏀 Lakers 98</div>
        <div className="chip chip-2">🏈 Chiefs 24</div>
        <div className="chip chip-3">🎯 #7 WINS</div>
        <div className="chip chip-4">⏱ Timeout!</div>

        <div className="landing-content">
          {/* Logo */}
          <div className="landing-logo-wrap">
            <img src="/logo.svg" alt="Bock Talks" className="landing-logo" />
          </div>

          {/* Headline */}
          <div className="landing-headline">
            <span className="headline-eyebrow">BOCK TALKS</span>
            <h1 className="headline-main">
              Game Day<br />
              <span className="headline-accent">Just Got</span><br />
              More Fun.
            </h1>
          </div>

          {/* Feature pills */}
          <div className="feature-pills">
            <span className="pill">⬛ Squares</span>
            <span className="pill">⏱ Timeout Game</span>
            <span className="pill">📺 Live Scores</span>
          </div>

          {/* CTA */}
          <div className="cta-wrap">
            <SignInButton mode="modal">
              <button className="cta-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </SignInButton>

            <button className="guest-btn" onClick={onContinueAsGuest}>
              Continue as Guest →
            </button>

            <p className="cta-sub">
              Guests can play local games · Sign in to create groups & invite friends
            </p>
          </div>
        </div>

        {/* Bottom scoreboard ticker */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[
              "🏀 Lakers 108 · Celtics 97 · FINAL",
              "🏈 Chiefs 31 · Eagles 17 · Q4 2:14",
              "🏀 Nuggets 89 · Warriors 91 · Q3",
              "🏈 Cowboys 24 · Giants 10 · FINAL",
              "🏀 Heat 76 · Bucks 82 · Q2",
              "🏈 49ers 28 · Rams 21 · Q4",
              "🏀 Lakers 108 · Celtics 97 · FINAL",
              "🏈 Chiefs 31 · Eagles 17 · Q4 2:14",
              "🏀 Nuggets 89 · Warriors 91 · Q3",
            ].map((s, i) => (
              <span key={i} className="ticker-item">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const landingCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .landing-root {
    min-height: 100dvh;
    background: #060d1a;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: 'DM Sans', sans-serif;
  }
  .grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(51,102,204,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(51,102,204,0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridDrift 20s linear infinite;
  }
  @keyframes gridDrift {
    0% { transform: translate(0,0); }
    100% { transform: translate(40px,40px); }
  }
  .landing-root::before {
    content: '';
    position: absolute; top: -20%; left: 50%;
    transform: translateX(-50%);
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(51,102,204,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .noise-overlay {
    position: absolute; inset: 0; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 150px; pointer-events: none;
  }
  .chip {
    position: absolute;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    color: rgba(255,255,255,0.6);
    font-size: 12px; font-weight: 600;
    padding: 6px 14px; border-radius: 100px;
    white-space: nowrap;
    animation: floatChip 6s ease-in-out infinite;
  }
  .chip-1 { top: 15%; left: 8%; animation-delay: 0s; }
  .chip-2 { top: 22%; right: 10%; animation-delay: 1.5s; }
  .chip-3 { top: 65%; left: 6%; animation-delay: 3s; }
  .chip-4 { top: 58%; right: 8%; animation-delay: 4.5s; }
  @keyframes floatChip {
    0%,100% { transform: translateY(0); opacity: 0.6; }
    50% { transform: translateY(-10px); opacity: 0.9; }
  }
  .landing-content {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 24px; position: relative; z-index: 10;
    text-align: center;
    opacity: 0; transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .mounted .landing-content { opacity: 1; transform: translateY(0); }
  .landing-logo-wrap { margin-bottom: 28px; }
  .landing-logo {
    width: 72px; height: 72px; border-radius: 50%;
    box-shadow: 0 0 40px rgba(51,102,204,0.4);
    animation: logoPulse 3s ease-in-out infinite;
  }
  @keyframes logoPulse {
    0%,100% { box-shadow: 0 0 40px rgba(51,102,204,0.4); }
    50% { box-shadow: 0 0 60px rgba(51,102,204,0.7); }
  }
  .headline-eyebrow {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 5px;
    color: #3366cc; text-transform: uppercase;
    display: block; margin-bottom: 10px;
  }
  .headline-main {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: clamp(52px, 12vw, 96px);
    font-weight: 900; line-height: 0.92; color: #fff;
    margin: 0 0 6px; text-transform: uppercase; letter-spacing: -1px;
  }
  .headline-accent { color: #3366cc; }
  .feature-pills {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center; margin: 28px 0 36px;
  }
  .pill {
    background: rgba(51,102,204,0.12);
    border: 1px solid rgba(51,102,204,0.3);
    color: #a0b4cc; font-size: 13px; font-weight: 600;
    padding: 7px 16px; border-radius: 100px; transition: all 0.2s;
  }
  .pill:hover { background: rgba(51,102,204,0.22); color: #fff; }
  .cta-wrap {
    display: flex; flex-direction: column;
    align-items: center; gap: 12px;
  }
  .cta-btn {
    display: flex; align-items: center; gap: 12px;
    background: #fff; color: #1a1a1a; border: none;
    border-radius: 14px; padding: 14px 28px;
    font-size: 16px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    transition: all 0.2s; white-space: nowrap;
  }
  .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .guest-btn {
    background: transparent;
    color: #7b8fa6;
    border: 1px solid #1e3050;
    border-radius: 14px;
    padding: 12px 28px;
    font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
  }
  .guest-btn:hover { color: #a0b4cc; border-color: #2a4070; }
  .cta-sub {
    color: #3a4a5a; font-size: 12px; margin: 0;
    max-width: 280px; line-height: 1.5;
  }
  .ticker-wrap {
    position: relative; z-index: 10;
    overflow: hidden;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02);
    padding: 10px 0; flex-shrink: 0;
  }
  .ticker-track {
    display: flex; gap: 0;
    animation: ticker 30s linear infinite;
    width: max-content;
  }
  .ticker-item {
    color: #4a5a6b; font-size: 12px; font-weight: 600;
    padding: 0 32px; white-space: nowrap; letter-spacing: 0.5px;
  }
  .ticker-item::after { content: '·'; margin-left: 32px; color: #1a2535; }
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @media (max-width: 480px) {
    .chip-1, .chip-2 { display: none; }
    .chip-3 { top: auto; bottom: 100px; left: 12px; }
    .chip-4 { top: auto; bottom: 140px; right: 12px; }
  }
`;
