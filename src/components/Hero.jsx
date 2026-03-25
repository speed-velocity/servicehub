import React, { startTransition, useEffect, useState } from 'react';

const heroStats = [
  { value: '500+', label: 'Verified Pros' },
  { value: '4.9+', label: 'Avg. Rating' },
  { value: '10k+', label: 'Bookings Done' },
];

const heroServiceWords = ['electricians', 'plumbers', 'cleaners', 'painters'];
const heroSideGridDelaysLeft = [0, 780, 240, 1320, 420, 1160, 1820, 620, 1540, 320, 980, 1960];
const heroSideGridDelaysRight = [460, 1260, 180, 920, 1680, 540, 1380, 300, 1100, 1880, 720, 1520];

const Hero = ({ onBookNow, onExploreServices }) => {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [typedWord, setTypedWord] = useState('');
  const [isDeletingWord, setIsDeletingWord] = useState(false);
  const [displayedStats, setDisplayedStats] = useState(heroStats);
  const [isShufflingStats, setIsShufflingStats] = useState(false);

  useEffect(() => {
    const currentWord = heroServiceWords[activeWordIndex];
    let timeoutId;

    if (!isDeletingWord && typedWord === currentWord) {
      timeoutId = window.setTimeout(() => {
        setIsDeletingWord(true);
      }, 1100);
    } else if (isDeletingWord && typedWord.length === 0) {
      timeoutId = window.setTimeout(() => {
        setIsDeletingWord(false);
        setActiveWordIndex((activeWordIndex + 1) % heroServiceWords.length);
      }, 180);
    } else {
      timeoutId = window.setTimeout(() => {
        const nextWordSlice = isDeletingWord
          ? currentWord.slice(0, Math.max(typedWord.length - 1, 0))
          : currentWord.slice(0, typedWord.length + 1);

        setTypedWord(nextWordSlice);
      }, isDeletingWord ? 48 : 92);
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeWordIndex, isDeletingWord, typedWord]);

  useEffect(() => {
    let shuffleSwapTimeoutId;
    let shuffleResetTimeoutId;

    const shuffleStats = () => {
      setIsShufflingStats(true);

      shuffleSwapTimeoutId = window.setTimeout(() => {
        startTransition(() => {
          setDisplayedStats((currentStats) => {
            const [firstStat, ...restStats] = currentStats;

            return [...restStats, firstStat];
          });
        });
      }, 280);

      shuffleResetTimeoutId = window.setTimeout(() => {
        setIsShufflingStats(false);
      }, 820);
    };

    const shuffleIntervalId = window.setInterval(shuffleStats, 4200);

    return () => {
      window.clearInterval(shuffleIntervalId);
      window.clearTimeout(shuffleSwapTimeoutId);
      window.clearTimeout(shuffleResetTimeoutId);
    };
  }, []);

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

      <div className="hero-stage">
        <div className="hero-side-grid hero-side-grid-left" aria-hidden="true">
          {heroSideGridDelaysLeft.map((delay, index) => (
            <span
              key={`hero-left-cell-${index}`}
              className="hero-side-cell"
              style={{
                '--hero-grid-delay': `${delay}ms`,
                '--hero-grid-duration': `${3120 + (index % 4) * 160}ms`,
              }}
            />
          ))}
        </div>

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
            <span className="hero-render-line">Find verified</span>
            <span className="hero-render-line hero-render-line-dynamic">
              <span className={`hero-typeword ${isDeletingWord ? 'is-deleting' : ''}`}>
                {typedWord || '\u00A0'}
              </span>
            </span>
            <span className="hero-render-line">near you.</span>
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
            {displayedStats.map((stat, index) => {
              const isEdgeCard = index === 0 || index === displayedStats.length - 1;

              return (
                <div
                  key={stat.label}
                  className={`hero-stat-card ${isEdgeCard ? 'hero-stat-card-edge' : 'hero-stat-card-center'} ${isShufflingStats ? 'is-shuffling' : ''}`}
                  style={{ textAlign: 'center', '--hero-shuffle-delay': `${index * 90}ms` }}
                >
                  <div className="hero-stat-card-body">
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="hero-side-grid hero-side-grid-right" aria-hidden="true">
          {heroSideGridDelaysRight.map((delay, index) => (
            <span
              key={`hero-right-cell-${index}`}
              className="hero-side-cell"
              style={{
                '--hero-grid-delay': `${delay}ms`,
                '--hero-grid-duration': `${3040 + (index % 3) * 210}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
