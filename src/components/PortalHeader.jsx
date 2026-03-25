import React from 'react';

const portalLinks = [
  { href: '/', label: 'Home' },
  { href: '/worker/dashboard', label: 'Worker Dashboard' },
  { href: '/signup', label: 'Sign Up / Login' },
];

const PortalHeader = ({ activePath }) => {
  const normalizedPath = activePath === '/' ? '/' : activePath.replace(/\/$/, '');

  return (
    <header className="portal-header">
      <div className="portal-header-inner">
        <a href="/" className="portal-brand">
          <span className="portal-brand-mark">S</span>
          <span>ServiceHub</span>
        </a>

        <nav className="portal-nav" aria-label="Portal navigation">
          {portalLinks.map((link) => {
            const linkPath = link.href === '/' ? '/' : link.href.replace(/\/$/, '');

            return (
              <a
                key={link.href}
                href={link.href}
                className={`portal-nav-link${normalizedPath === linkPath ? ' is-active' : ''}`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default PortalHeader;
