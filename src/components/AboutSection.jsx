import React from 'react';

const aboutHighlights = [
  {
    title: 'Verified Professionals',
    description: 'We connect homeowners with trusted workers across everyday home service categories.',
  },
  {
    title: 'Instant Booking Flow',
    description: 'Pick a service, fill your details, and confirm your request in a few quick steps.',
  },
  {
    title: 'Live Worker Updates',
    description: 'Worker availability updates in real time so the list always reflects current status.',
  },
];

const AboutSection = () => {
  return (
    <section
      id="about"
      style={{
        padding: '0 1.5rem 6rem',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <div className="about-section-shell">
        <div className="about-section-copy">
          <div className="section-badge" style={{ marginBottom: '1rem' }}>
            About ServiceHub
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: '800',
              letterSpacing: '-0.025em',
              lineHeight: '1.15',
              marginBottom: '1rem',
            }}
          >
            A faster way to book trusted help for your home
          </h2>
          <p
            style={{
              color: '#9ca3af',
              fontSize: '1rem',
              lineHeight: '1.8',
              maxWidth: '600px',
              marginBottom: '1.75rem',
            }}
          >
            ServiceHub is built to make home services feel simple. From electricians and plumbers to cleaners
            and technicians, the platform helps customers discover services quickly and see active workers in a
            single place.
          </p>
          <p
            style={{
              color: '#9ca3af',
              fontSize: '0.98rem',
              lineHeight: '1.8',
              maxWidth: '600px',
            }}
          >
            The experience is designed around speed, clarity, and confidence so users can move from browsing to
            booking without friction.
          </p>
        </div>

        <div className="about-highlights-grid">
          {aboutHighlights.map((item) => (
            <article key={item.title} className="about-highlight-card">
              <div className="about-highlight-dot" />
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  marginBottom: '0.65rem',
                  color: '#ffffff',
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  color: '#9ca3af',
                  lineHeight: '1.7',
                  fontSize: '0.95rem',
                }}
              >
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
