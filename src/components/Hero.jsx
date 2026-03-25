import React from 'react';

const heroStats = [
  { value: '500+', label: 'Verified Pros' },
  { value: '4.9+', label: 'Avg. Rating' },
  { value: '10k+', label: 'Bookings Done' },
];

const Hero = ({ onBookNow, onExploreServices }) => {
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
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="hero-content-shell" style={{ position: 'relative', zIndex: 1, maxWidth: '780px' }}>
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

        <div className="hero-render-copy" style={{ margin: '0 auto 2.5rem' }}>
          <span className="hero-render-line">Find verified electricians,</span>
          <span className="hero-render-line">plumbers, cleaners and more</span>
          <span className="hero-render-line hero-render-line-accent">near you.</span>
        </div>

        <p
          className="hero-render-caption"
          style={{
            maxWidth: '620px',
            margin: '0 auto 2.5rem',
          }}
        >
          Quality service at your doorstep.
        </p>

        <div className="hero-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
          className="hero-stats-row"
          style={{
            display: 'flex',
            gap: '3rem',
            justifyContent: 'center',
            marginTop: '4rem',
            flexWrap: 'wrap',
          }}
        >
          {heroStats.map((stat, index) => {
            const isEdgeCard = index === 0 || index === heroStats.length - 1;

            return (
              <div
                key={stat.label}
                className={`hero-stat-card ${isEdgeCard ? 'hero-stat-card-edge' : 'hero-stat-card-center'}`}
                style={{ textAlign: 'center' }}
              >
                <div
                  className="hero-stat-value"
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    color: '#22c55e',
                    lineHeight: '1',
                    marginBottom: '0.3rem',
                  }}
                >
                  {stat.value}
                </div>
                <div className="hero-stat-label" style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Hero;
