import { useState, useEffect, useRef, useCallback } from "react";

const TOUR_KEY = "bt_tour_done";

// ── Step definitions ──────────────────────────────────────────────────────────
// selector: CSS selector for the element to spotlight (null = centered modal)
// position: preferred tooltip position relative to spotlight
const STEPS = [
  {
    id: "welcome",
    selector: null,
    position: "center",
    icon: "🏆",
    title: "Welcome to Bock Talks!",
    body: "You're about to make game day a lot more fun. This quick tour will show you everything — takes about 30 seconds.",
    cta: "Let's go →",
  },
  {
    id: "squares-tab",
    selector: '[data-tour="tab-squares"]',
    position: "bottom",
    icon: "⬛",
    title: "Squares Game",
    body: "The classic squares pool. Set up a 5×5 grid, assign players to squares, and win when the score digits match your square at the end of each quarter.",
  },
  {
    id: "squares-grid",
    selector: '[data-tour="squares-grid"]',
    position: "right",
    icon: "🎯",
    title: "Your Grid",
    body: "Each square covers two possible last digits. Randomize the numbers before the game so every square has an equal shot at winning.",
  },
  {
    id: "timeout-tab",
    selector: '[data-tour="tab-timeout"]',
    position: "bottom",
    icon: "⏱",
    title: "Timeout Game",
    body: "10 players, 10 numbers (0–9). At each official TV timeout, add the last digits of both scores. The player with that number wins that timeout!",
  },
  {
    id: "score-bot",
    selector: '[data-tour="score-bot"]',
    position: "top",
    icon: "📺",
    title: "Live Score Bot",
    body: "Type any matchup and the bot pulls live ESPN scores automatically. It detects quarter endings and timeout moments so you never miss a winner.",
  },
  {
    id: "groups-tab",
    selector: '[data-tour="tab-groups"]',
    position: "bottom",
    icon: "👥",
    title: "Groups",
    body: "Create a group for your crew. Once you're in a group, you can assign squares to real members and share live boards — no more manual lists.",
  },
  {
    id: "session-tab",
    selector: '[data-tour="tab-session"]',
    position: "bottom",
    icon: "🔗",
    title: "Share & Invite",
    body: "Every game gets a shareable link. Send it to friends and they can view the live board on their phone — no sign-in required to watch.",
  },
  {
    id: "done",
    selector: null,
    position: "center",
    icon: "🎉",
    title: "You're all set!",
    body: "Start by setting up a Squares game for tonight's matchup. Hit Randomize, assign your players, and let the score bot handle the rest.",
    cta: "Start playing →",
  },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function TutorialTour({ onDone }) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState(null); // { top, left, width, height }
  const [tooltipPos, setTooltipPos] = useState({ top: "50%", left: "50%", transform: "translate(-50%,-50%)" });
  const [animDir, setAnimDir] = useState("forward"); // for slide animation
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(null);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  // ── Measure target element & compute positions ──────────────────────────────
  const measureStep = useCallback((stepIndex) => {
    const s = STEPS[stepIndex];
    if (!s.selector) {
      setSpotlight(null);
      setTooltipPos({ top: "50%", left: "50%", transform: "translate(-50%,-50%)" });
      return;
    }

    const el = document.querySelector(s.selector);
    if (!el) {
      setSpotlight(null);
      setTooltipPos({ top: "50%", left: "50%", transform: "translate(-50%,-50%)" });
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 10;
    const spot = {
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    };
    setSpotlight(spot);

    // Place tooltip
    const TW = Math.min(320, window.innerWidth - 32); // tooltip width
    const TH = 220; // approx tooltip height
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let pos = {};
    const pref = s.position;

    if (pref === "bottom") {
      const top = spot.top + spot.height + margin;
      const left = Math.min(
        Math.max(margin, spot.left + spot.width / 2 - TW / 2),
        vw - TW - margin
      );
      pos = top + TH < vh
        ? { top, left, transform: "none" }
        : { top: spot.top - TH - margin, left, transform: "none" };
    } else if (pref === "top") {
      const top = spot.top - TH - margin;
      const left = Math.min(
        Math.max(margin, spot.left + spot.width / 2 - TW / 2),
        vw - TW - margin
      );
      pos = top > 0
        ? { top, left, transform: "none" }
        : { top: spot.top + spot.height + margin, left, transform: "none" };
    } else if (pref === "right") {
      const left = spot.left + spot.width + margin;
      const top = Math.min(
        Math.max(margin, spot.top + spot.height / 2 - TH / 2),
        vh - TH - margin
      );
      pos = left + TW < vw
        ? { top, left, transform: "none" }
        : { top, left: spot.left - TW - margin, transform: "none" };
    } else {
      pos = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
    }

    setTooltipPos(pos);
  }, []);

  // Re-measure on resize
  useEffect(() => {
    const onResize = () => measureStep(step);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [step, measureStep]);

  // Measure whenever step changes
  useEffect(() => {
    // Small delay to let any tab-switch renders settle
    const t = setTimeout(() => {
      measureStep(step);
      setVisible(true);
    }, 80);
    return () => clearTimeout(t);
  }, [step, measureStep]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goTo = (nextStep, dir = "forward") => {
    setVisible(false);
    setAnimDir(dir);
    setTimeout(() => {
      setStep(nextStep);
      // visible will be set true by the step useEffect above
    }, 180);
  };

  const next = () => {
    if (isLast) finish();
    else goTo(step + 1, "forward");
  };

  const prev = () => {
    if (!isFirst) goTo(step - 1, "backward");
  };

  const finish = () => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(TOUR_KEY, "true");
      onDone();
    }, 200);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{tourCSS}</style>

      {/* ── Overlay with spotlight cutout ── */}
      <div className="tour-overlay" onClick={(e) => e.stopPropagation()}>
        {spotlight ? (
          <svg
            className="tour-svg"
            style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          >
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  rx="10"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.75)"
              mask="url(#tour-mask)"
            />
            {/* Spotlight border glow */}
            <rect
              x={spotlight.left}
              y={spotlight.top}
              width={spotlight.width}
              height={spotlight.height}
              rx="10"
              fill="none"
              stroke="#3366cc"
              strokeWidth="2"
              opacity="0.8"
            />
          </svg>
        ) : (
          <div className="tour-solid-overlay" />
        )}
      </div>

      {/* ── Tooltip card ── */}
      <div
        className={`tour-card ${visible ? "tour-card-visible" : ""} tour-anim-${animDir}`}
        style={{
          position: "fixed",
          zIndex: 10001,
          width: "min(320px, calc(100vw - 32px))",
          ...tooltipPos,
        }}
      >
        {/* Progress dots */}
        <div className="tour-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`tour-dot ${i === step ? "active" : i < step ? "done" : ""}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="tour-icon">{current.icon}</div>

        {/* Text */}
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-body">{current.body}</p>

        {/* Buttons */}
        <div className="tour-actions">
          {!isFirst && (
            <button className="tour-btn-prev" onClick={prev}>← Back</button>
          )}
          <button className="tour-btn-next" onClick={next}>
            {isLast ? (current.cta || "Done") : (isFirst ? (current.cta || "Next →") : "Next →")}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button className="tour-skip" onClick={finish}>Skip tour</button>
        )}
      </div>
    </>
  );
}

// ── Static helpers ────────────────────────────────────────────────────────────
export function shouldShowTour() {
  return localStorage.getItem(TOUR_KEY) !== "true";
}

export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const tourCSS = `
  .tour-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    pointer-events: none;
  }

  .tour-solid-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(2px);
  }

  .tour-svg {
    transition: all 0.3s ease;
  }

  /* ── Card ── */
  .tour-card {
    background: #0d1829;
    border: 1px solid #1e3a5f;
    border-radius: 20px;
    padding: 24px 22px 18px;
    box-shadow:
      0 24px 64px rgba(0,0,0,0.7),
      0 0 0 1px rgba(51,102,204,0.15),
      inset 0 1px 0 rgba(255,255,255,0.05);
    z-index: 10001;
    opacity: 0;
    transform: translateY(8px) scale(0.97);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: all;
  }
  .tour-card-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  /* Progress dots */
  .tour-dots {
    display: flex;
    gap: 5px;
    justify-content: center;
    margin-bottom: 18px;
  }
  .tour-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1e3050;
    transition: all 0.25s ease;
  }
  .tour-dot.done {
    background: #2a5090;
  }
  .tour-dot.active {
    background: #3366cc;
    width: 20px;
    border-radius: 3px;
  }

  /* Icon */
  .tour-icon {
    font-size: 36px;
    text-align: center;
    margin-bottom: 12px;
    display: block;
    animation: tourIconBounce 0.4s ease;
  }
  @keyframes tourIconBounce {
    0% { transform: scale(0.5); opacity: 0; }
    70% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* Text */
  .tour-title {
    font-family: 'Barlow Condensed', 'DM Sans', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    text-align: center;
    margin: 0 0 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .tour-body {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #7b8fa6;
    text-align: center;
    line-height: 1.6;
    margin: 0 0 20px;
  }

  /* Actions */
  .tour-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .tour-btn-prev {
    background: transparent;
    border: 1px solid #1e3050;
    color: #7b8fa6;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .tour-btn-prev:hover {
    border-color: #2a4070;
    color: #a0b4cc;
  }
  .tour-btn-next {
    flex: 1;
    background: linear-gradient(135deg, #3366cc, #1a4aaa);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 11px 20px;
    font-size: 14px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(51,102,204,0.3);
  }
  .tour-btn-next:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(51,102,204,0.45);
  }
  .tour-btn-next:active { transform: translateY(0); }

  /* Skip */
  .tour-skip {
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: #3a4a5a;
    font-size: 12px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    text-align: center;
    padding: 10px 0 2px;
    transition: color 0.15s;
  }
  .tour-skip:hover { color: #7b8fa6; }

  /* Spotlight pulse animation */
  @keyframes spotlightPulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`;
