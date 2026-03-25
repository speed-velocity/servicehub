import React from 'react';

const Hero = ({ onBookNow, onExploreServices, theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <section
      id="home"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '8rem 1.5rem 5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="hero-orb" />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${isLight ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.02)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isLight ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.02)'} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px' }}>
        <div className="section-badge" style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.7rem' }}>*</span>
          Trusted by 10,000+ homeowners
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: '900',
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
          }}
          className="gradient-text"
        >
          Book Trusted Home Services Instantly
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: isLight ? '#475569' : '#9ca3af',
            fontWeight: '400',
            maxWidth: '540px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.7',
          }}
        >
          Find verified electricians, plumbers, cleaners and more near you. Quality service at your doorstep.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ fontSize: '1.05rem', padding: '0.9rem 2.5rem' }}
            onClick={onBookNow}
          >
            Book a Service
          </button>
          <button
            className="btn-outline"
            style={{ fontSize: '1.05rem', padding: '0.9rem 2.5rem' }}
            onClick={onExploreServices}
          >
            Explore Services
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '3rem',
            justifyContent: 'center',
            marginTop: '4rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '500+', label: 'Verified Pros' },
            { value: '4.9+', label: 'Avg. Rating' },
            { value: '10k+', label: 'Bookings Done' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: '800',
                  color: '#3b82f6',
                  lineHeight: '1',
                  marginBottom: '0.3rem',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '0.85rem', color: isLight ? '#64748b' : '#6b7280', fontWeight: '500' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
