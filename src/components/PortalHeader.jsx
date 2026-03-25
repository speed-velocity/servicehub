import React from 'react';
import ThemeToggle from './ThemeToggle';

const PortalHeader = ({ activePath, showWorkerDashboard = false, theme = 'dark', onToggleTheme }) => {
  const normalizedPath = activePath === '/' ? '/' : activePath.replace(/\/$/, '');
  const portalLinks = [
    { href: '/', label: 'Home' },
    ...(showWorkerDashboard ? [{ href: '/worker/dashboard', label: 'Worker Dashboard' }] : []),
    { href: '/signup', label: 'Sign Up / Login' },
  ];

  return (
    <header className="portal-header">
      <div className="portal-header-inner">
        <a href="/" className="portal-brand">
          <span className="portal-brand-mark">S</span>
          <span>ServX</span>
        </a>

        <div className="portal-header-actions">
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
          <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
