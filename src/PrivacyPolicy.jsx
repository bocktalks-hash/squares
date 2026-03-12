export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      color: '#e8eaf0',
      fontFamily: "'Georgia', serif",
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1526 0%, #1a2744 100%)',
        borderBottom: '1px solid rgba(51,102,204,0.3)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#3366CC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif', fontWeight: 900, fontSize: 18, color: '#fff',
          }}>B</div>
          <span style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 18 }}>Bock Talks</span>
        </a>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(51,102,204,0.15)',
          border: '1px solid rgba(51,102,204,0.4)', borderRadius: 6,
          padding: '4px 12px', fontSize: 12, color: '#7aa3e8',
          fontFamily: 'sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20,
        }}>Legal</div>

        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.1 }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#7aa3e8', fontFamily: 'sans-serif', fontSize: 14, margin: '0 0 48px' }}>
          Last updated: March 11, 2026
        </p>

        <div style={{ lineHeight: 1.8, fontSize: 16 }}>
          <Section title="1. Introduction">
            Welcome to Bock Talks ("we," "our," or "us"). This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our web application and related
            services (collectively, the "Service"), including our sports games such as Squares and the
            Timeout Game.
            <br /><br />
            Please read this Privacy Policy carefully. By using the Service, you agree to the collection
            and use of information in accordance with this policy.
          </Section>

          <Section title="2. Information We Collect">
            <SubSection title="2.1 Information You Provide">
              <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and profile picture through your chosen sign-in provider (Google, Facebook, or Apple).</li>
                <li style={{ marginTop: 8 }}><strong>Game Data:</strong> Player names, game configurations, scores, and group information you enter while using our games.</li>
                <li style={{ marginTop: 8 }}><strong>Communications:</strong> Any feedback, support requests, or messages you send to us.</li>
              </ul>
            </SubSection>
            <SubSection title="2.2 Information Collected Automatically">
              <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service, and interactions within games.</li>
                <li style={{ marginTop: 8 }}><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address.</li>
                <li style={{ marginTop: 8 }}><strong>Local Storage:</strong> Game state and preferences are stored in your browser's local storage to preserve your session between visits.</li>
              </ul>
            </SubSection>
            <SubSection title="2.3 Information from Third Parties">
              When you sign in using Google, Facebook, or Apple, we receive basic profile information
              (name, email, profile photo) as permitted by your settings with those providers.
              We do not receive your passwords or payment information from these providers.
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            We use the information we collect to:
            <ul style={{ paddingLeft: 20, margin: '12px 0' }}>
              <li>Provide, operate, and maintain the Service</li>
              <li style={{ marginTop: 6 }}>Create and manage your account</li>
              <li style={{ marginTop: 6 }}>Enable multiplayer game features and group sharing</li>
              <li style={{ marginTop: 6 }}>Display live sports scores sourced from ESPN's public API</li>
              <li style={{ marginTop: 6 }}>Send notifications related to game events (with your permission)</li>
              <li style={{ marginTop: 6 }}>Improve and personalize your experience</li>
              <li style={{ marginTop: 6 }}>Respond to support requests and communications</li>
              <li style={{ marginTop: 6 }}>Monitor and analyze usage patterns to improve the Service</li>
              <li style={{ marginTop: 6 }}>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Sports Data">
            Our Service displays live sports scores and game data sourced from ESPN's publicly available
            API. We do not control or store ESPN's data beyond temporary caching for performance. This
            data is used solely to power game features and scoreboards within the Service.
          </Section>

          <Section title="5. Sharing Your Information">
            We do not sell, trade, or rent your personal information to third parties. We may share information in the following limited circumstances:
            <ul style={{ paddingLeft: 20, margin: '12px 0' }}>
              <li><strong>With Other Users:</strong> Game data, player names, and scores you enter may be visible to other members of groups you join or create.</li>
              <li style={{ marginTop: 8 }}><strong>Service Providers:</strong> We use Clerk (authentication), Railway (hosting), and Vercel (web hosting). These providers process data under their own privacy policies.</li>
              <li style={{ marginTop: 8 }}><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal process.</li>
              <li style={{ marginTop: 8 }}><strong>Business Transfers:</strong> If we merge with or are acquired by another company, your information may be transferred as part of that transaction.</li>
            </ul>
          </Section>

          <Section title="6. Third-Party Authentication Providers">
            We use the following sign-in providers governed by their own privacy policies:
            <ul style={{ paddingLeft: 20, margin: '12px 0' }}>
              <li><a href="https://policies.google.com/privacy" style={{ color: '#7aa3e8' }}>Google Privacy Policy</a></li>
              <li style={{ marginTop: 6 }}><a href="https://www.facebook.com/policy.php" style={{ color: '#7aa3e8' }}>Meta (Facebook) Privacy Policy</a></li>
              <li style={{ marginTop: 6 }}><a href="https://www.apple.com/legal/privacy/" style={{ color: '#7aa3e8' }}>Apple Privacy Policy</a></li>
            </ul>
            You can revoke our access through your account settings with each provider at any time.
          </Section>

          <Section title="7. Data Retention">
            We retain your account information and game data for as long as your account is active.
            You may request deletion at any time by contacting us at{' '}
            <a href="mailto:bocktalks@gmail.com" style={{ color: '#7aa3e8' }}>bocktalks@gmail.com</a>.
            <br /><br />
            Game data stored in your browser's local storage is controlled by you and can be cleared through your browser settings at any time.
          </Section>

          <Section title="8. Cookies and Local Storage">
            We use browser local storage and session storage to:
            <ul style={{ paddingLeft: 20, margin: '12px 0' }}>
              <li>Save your game state between sessions</li>
              <li style={{ marginTop: 6 }}>Remember your preferences (guest mode, tutorial completion)</li>
              <li style={{ marginTop: 6 }}>Maintain your authentication session</li>
            </ul>
            We do not use advertising cookies or track you across other websites.
          </Section>

          <Section title="9. Children's Privacy">
            The Service is not directed to children under the age of 13. We do not knowingly collect
            personal information from children under 13. If you believe a child under 13 has provided
            us with personal information, please contact us and we will delete it promptly.
          </Section>

          <Section title="10. Your Rights">
            Depending on your location, you may have rights to access, correct, delete, or export your data,
            and to opt out of push notifications. Contact us at{' '}
            <a href="mailto:bocktalks@gmail.com" style={{ color: '#7aa3e8' }}>bocktalks@gmail.com</a> to exercise these rights.
          </Section>

          <Section title="11. Security">
            We implement reasonable technical and organizational measures to protect your information.
            Authentication is handled by Clerk using encrypted connections. However, no method of
            internet transmission is 100% secure.
          </Section>

          <Section title="12. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by updating the "Last updated" date above. Continued use of the Service constitutes
            acceptance of the updated policy.
          </Section>

          <Section title="13. Contact Us">
            <div style={{
              marginTop: 16, padding: '20px 24px',
              background: 'rgba(51,102,204,0.1)', border: '1px solid rgba(51,102,204,0.25)',
              borderRadius: 8, fontFamily: 'sans-serif',
            }}>
              <strong style={{ color: '#fff' }}>Bock Talks</strong><br />
              <a href="mailto:bocktalks@gmail.com" style={{ color: '#7aa3e8' }}>bocktalks@gmail.com</a><br />
              <a href="https://bocktalks.app" style={{ color: '#7aa3e8' }}>bocktalks.app</a>
            </div>
          </Section>
        </div>

        <div style={{
          marginTop: 64, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'sans-serif', fontSize: 13, color: '#4a5568',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <span>© 2026 Bock Talks. All rights reserved.</span>
          <a href="/" style={{ color: '#7aa3e8', textDecoration: 'none' }}>← Back to app</a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'sans-serif',
        margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid rgba(51,102,204,0.25)',
      }}>{title}</h2>
      <div style={{ color: '#c0c8d8', lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e0e6f0', fontFamily: 'sans-serif', margin: '12px 0 6px' }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
