import React from 'react';

const Footer = () => {
  return (
    <footer
      id="contact"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span
              style={{
                fontWeight: '700',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #fff, #93c5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ServiceHub
            </span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'Support'].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#9ca3af')}
                onMouseLeave={(e) => (e.target.style.color = '#6b7280')}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <p style={{ color: '#4b5563', fontSize: '0.82rem' }}>
          © {new Date().getFullYear()} ServiceHub. All rights reserved. Built with ❤️ for your home.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
