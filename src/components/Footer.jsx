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

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy Policy', href: '#' },
              { label: 'Terms of Service', href: '#' },
              { label: 'Support', href: '#' },
              { label: 'User Account', href: '/account' },
              { label: 'Worker Portal', href: '/worker' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={(event) => {
                  event.target.style.color = '#9ca3af';
                }}
                onMouseLeave={(event) => {
                  event.target.style.color = '#6b7280';
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.35rem', letterSpacing: '0.02em' }}>
            Contact
          </p>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <a
              href="mailto:panditshubhankar78@gmail.com"
              style={{
                color: '#dbeafe',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: '600',
              }}
            >
              panditshubhankar78@gmail.com
            </a>
            <a
              href="mailto:utkarshhhhh@gmail.com"
              style={{
                color: '#dbeafe',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: '600',
              }}
            >
              utkarshhhhh@gmail.com
            </a>
          </div>
        </div>

        <p style={{ color: '#4b5563', fontSize: '0.82rem' }}>
          &copy; {new Date().getFullYear()} ServiceHub. All rights reserved. Built with care for your home.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
