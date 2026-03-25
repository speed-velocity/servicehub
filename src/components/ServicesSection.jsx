import React, { useEffect, useRef, useState } from 'react';
import ServiceCard from './ServiceCard';

const icons = {
  electrician: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  plumber: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12M12 12C12 8.13 8.87 5 5 5H3v2h2c2.76 0 5 2.24 5 5" />
      <path d="M12 12c0-3.87 3.13-7 7-7h2v2h-2c-2.76 0-5 2.24-5 5" />
      <circle cx="12" cy="22" r="2" />
    </svg>
  ),
  cleaner: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 11 2-2-2-2" />
      <path d="M11 13h4" />
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    </svg>
  ),
  'ac-repair': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="8" rx="2" />
      <path d="M6 18h12M10 14v4M14 14v4" />
    </svg>
  ),
  painter: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 21.5c.8-4.5 8-4.5 8-9a4 4 0 0 0-8 0c0 4.5 7.2 4.5 8 9" />
      <path d="M14 9l8-8" />
      <path d="M17 6l-5.5 5.5" />
      <path d="M20 3l1 1" />
    </svg>
  ),
  carpenter: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12H3M21 6H3M21 18H3" />
    </svg>
  ),
  technician: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

const allServices = [
  { id: 'electrician', title: 'Electrician', iconKey: 'electrician' },
  { id: 'plumber', title: 'Plumber', iconKey: 'plumber' },
  { id: 'cleaner', title: 'Cleaner', iconKey: 'cleaner' },
  { id: 'ac-repair', title: 'AC Repair', iconKey: 'ac-repair' },
  { id: 'painter', title: 'Painter', iconKey: 'painter' },
  { id: 'carpenter', title: 'Carpenter', iconKey: 'carpenter' },
  { id: 'technician', title: 'Technician', iconKey: 'technician' },
];

const ServicesSection = ({ isLocked = false, onServiceSelect }) => {
  const carouselRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollState = () => {
    const node = carouselRef.current;

    if (!node) {
      return;
    }

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setCanScrollPrev(node.scrollLeft > 8);
    setCanScrollNext(node.scrollLeft < maxScrollLeft - 8);
  };

  useEffect(() => {
    updateScrollState();

    const node = carouselRef.current;

    if (!node) {
      return undefined;
    }

    const handleResize = () => updateScrollState();

    node.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      node.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCarouselMove = (direction) => {
    const node = carouselRef.current;

    if (!node) {
      return;
    }

    const scrollAmount = Math.max(node.clientWidth * 0.82, 280) * direction;

    node.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="services"
      style={{
        padding: '5rem 1.5rem 6rem',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="section-badge" style={{ justifyContent: 'center' }}>
          * Our Services
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: '800',
            letterSpacing: '-0.025em',
            lineHeight: '1.2',
            marginTop: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          What We Offer
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '1rem', maxWidth: '440px', margin: '0 auto' }}>
          Professional services at your fingertips, ready to book in seconds.
        </p>
      </div>

      <div className="services-carousel-shell">
        <button
          type="button"
          className="services-carousel-arrow"
          onClick={() => handleCarouselMove(-1)}
          disabled={!canScrollPrev}
          aria-label="Scroll services left"
        >
          &#8249;
        </button>

        <div className="services-carousel-track" ref={carouselRef}>
          {allServices.map((service) => (
            <div key={service.id} className="services-carousel-slide">
              <ServiceCard
                title={service.title}
                icon={icons[service.iconKey]}
                isLocked={isLocked}
                onClick={() => onServiceSelect?.(service.title)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="services-carousel-arrow"
          onClick={() => handleCarouselMove(1)}
          disabled={!canScrollNext}
          aria-label="Scroll services right"
        >
          &#8250;
        </button>
      </div>

      <div className="services-carousel-hint">
        <span>Slide through all services</span>
      </div>
    </section>
  );
};

export default ServicesSection;
