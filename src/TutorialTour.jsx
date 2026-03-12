import { useState, useEffect, useCallback } from 'react';

const TOUR_KEY = 'bt_tour_done';

const STEPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to Bock Talks!',
    body: 'Your sports game hub. Let\'s take a quick tour so you know where everything is.',
    target: null,
  },
  {
    id: 'tab-squares',
    title: '🎯 Squares Game',
    body: 'The classic squares game tied to live ESPN scores. Set up a grid, assign players, and winners are decided at the end of each quarter.',
    target: '[data-tour="tab-squares"]',
  },
  {
    id: 'squares-grid',
    title: '🔢 The Grid',
    body: 'Each game gets its own 5×5 grid with randomized digit pairs. Click any square to assign a player.',
    target: '[data-tour="squares-grid"]',
  },
  {
    id: 'tab-timeout',
    title: '⏱ Timeout Game',
    body: 'A fast-paced game for basketball fans. 10 players each get a digit 0–9. Winners are decided at every official TV timeout.',
    target: '[data-tour="tab-timeout"]',
  },
  {
    id: 'score-bot',
    title: '🤖 Score Bot',
    body: 'Type in any matchup and the bot fetches live ESPN scores every 30 seconds. It auto-detects quarter endings and notifies you when a winner is decided.',
    target: '[data-tour="score-bot"]',
  },
  {
    id: 'tab-groups',
    title: '👥 Groups',
    body: 'Create a group for your friend circle. Share a link so everyone can join, view live boards, and see scores in real time.',
    target: '[data-tour="tab-groups"]',
  },
  {
    id: 'tab-session',
    title: '📡 Sessions',
    body: 'Start a live session and share it with friends. They can follow along on their own devices without being able to edit anything.',
    target: '[data-tour="tab-session"]',
  },
  {
    id: 'done',
    title: '🏆 You\'re all set!',
    body: 'Start by adding a game in the Squares or Timeout tab. Hit the ? button anytime to replay this tour.',
    target: null,
  },
];

export default function TutorialTour({ onDone }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Auto-launch after short delay on first visit
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      setTimeout(() => setVisible(true), 400);
    }
  }, []);

  const measureTarget = useCallback(() => {
    const current = STEPS[step];
    if (current.target) {
      const el = document.querySelector(current.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        return;
      }
    }
    setTargetRect(null);
  }, [step]);

  useEffect(() => {
    if (visible) measureTarget();
  }, [visible, step, measureTarget]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const finish = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
    onDone?.();
  };

  // Expose replay function
  useEffect(() => {
    window.__btReplayTour = () => { setStep(0); setVisible(true); };
    return () => { delete window.__btReplayTour; };
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const SPOTLIGHT_PAD = 8;

  // Tooltip position logic
  let tooltipStyle = {
    position: 'fixed',
    background: '#1a2744',
    border: '1px solid rgba(51,102,204,0.5)',
    borderRadius: 12,
    padding: '20px 24px',
    maxWidth: 320,
    width: 'calc(100vw - 48px)',
    zIndex: 10001,
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  };

  if (targetRect) {
    // Position below the target if there's room, else above
    const spaceBelow = window.innerHeight - targetRect.bottom;
    if (spaceBelow > 180) {
      tooltipStyle.top = targetRect.bottom + SPOTLIGHT_PAD + 12;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 336));
    } else {
      tooltipStyle.bottom = window.innerHeight - targetRect.top + SPOTLIGHT_PAD + 12;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 336));
    }
  } else {
    // Center for non-targeted steps
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        pointerEvents: 'none',
      }}>
        {targetRect ? (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - SPOTLIGHT_PAD}
                  y={targetRect.top - SPOTLIGHT_PAD}
                  width={targetRect.width + SPOTLIGHT_PAD * 2}
                  height={targetRect.height + SPOTLIGHT_PAD * 2}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
            <rect
              x={targetRect.left - SPOTLIGHT_PAD}
              y={targetRect.top - SPOTLIGHT_PAD}
              width={targetRect.width + SPOTLIGHT_PAD * 2}
              height={targetRect.height + SPOTLIGHT_PAD * 2}
              rx="8"
              fill="none"
              stroke="#3366CC"
              strokeWidth="2"
            />
          </svg>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)' }} />
        )}
      </div>

      {/* Tooltip */}
      <div style={tooltipStyle}>
        <div style={{
          fontFamily: 'sans-serif', fontSize: 18, fontWeight: 700,
          color: '#fff', marginBottom: 8,
        }}>{current.title}</div>
        <div style={{
          fontFamily: 'sans-serif', fontSize: 14, color: '#a0b8d8',
          lineHeight: 1.6, marginBottom: 20,
        }}>{current.body}</div>

        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 16 : 6, height: 6, borderRadius: 3,
                background: i === step ? '#3366CC' : 'rgba(51,102,204,0.3)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={finish} style={{
              background: 'transparent', border: 'none',
              color: '#5577aa', fontFamily: 'sans-serif', fontSize: 13,
              cursor: 'pointer', padding: '6px 8px',
            }}>Skip</button>
            <button onClick={next} style={{
              background: '#3366CC', border: 'none', borderRadius: 7,
              color: '#fff', fontFamily: 'sans-serif', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', padding: '8px 18px',
            }}>
              {step === STEPS.length - 1 ? "Let's go!" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Replay button — floating ? in corner
export function TourReplayButton() {
  return (
    <button
      onClick={() => window.__btReplayTour?.()}
      title="Replay tutorial"
      style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 9000,
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(51,102,204,0.2)',
        border: '1px solid rgba(51,102,204,0.4)',
        color: '#7aa3e8', fontSize: 16, fontFamily: 'sans-serif',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >?</button>
  );
}
