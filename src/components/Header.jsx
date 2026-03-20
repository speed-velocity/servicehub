import React, { useEffect, useState } from 'react';

const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

const Header = ({ onBookNow }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((leftEntry, rightEntry) => rightEntry.intersectionRatio - leftEntry.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveLink(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-35% 0px -45% 0px',
        threshold: [0.2, 0.45, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleNavClick = (sectionId) => {
    setActiveLink(sectionId);

    const target = document.getElementById(sectionId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <header
      className={`site-header${isScrolled ? ' is-scrolled' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <div
        className="site-header-inner"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '1.35rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #fff, #93c5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            ServiceHub
          </span>
        </div>

        {/* Desktop Nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
          }}
          className={`desktop-nav desktop-nav-glass${isScrolled ? ' is-scrolled' : ''}`}
        >
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`nav-link desktop-nav-link${activeLink === link.id ? ' desktop-nav-link-active' : ''}`}
              onClick={(event) => {
                event.preventDefault();
                handleNavClick(link.id);
              }}
            >
              {link.label}
            </a>
          ))}
          <button
            className="btn-primary desktop-book-btn"
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
            onClick={onBookNow}
          >
            Book Now
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundColor: 'rgba(11,11,11,0.96)',
          }}
          className={`mobile-nav${isScrolled ? ' is-scrolled' : ''}`}
        >
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`nav-link${activeLink === link.id ? ' mobile-nav-link-active' : ''}`}
              style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)' }}
              onClick={(event) => {
                event.preventDefault();
                setMobileMenuOpen(false);
                handleNavClick(link.id);
              }}
            >
              {link.label}
            </a>
          ))}
          <button
            className="btn-primary"
            style={{ marginTop: '0.5rem', width: '100%' }}
            onClick={() => {
              setMobileMenuOpen(false);
              onBookNow?.();
            }}
          >
            Book Now
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
