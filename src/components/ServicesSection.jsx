import React, { useState, useRef } from 'react';
import ServiceCard from './ServiceCard';

// SVG Icons
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

const mainServices = [
  { id: 'electrician', title: 'Electrician', iconKey: 'electrician' },
  { id: 'plumber', title: 'Plumber', iconKey: 'plumber' },
  { id: 'cleaner', title: 'Cleaner', iconKey: 'cleaner' },
];

const hiddenServices = [
  { id: 'ac-repair', title: 'AC Repair', iconKey: 'ac-repair' },
  { id: 'painter', title: 'Painter', iconKey: 'painter' },
  { id: 'carpenter', title: 'Carpenter', iconKey: 'carpenter' },
  { id: 'technician', title: 'Technician', iconKey: 'technician' },
];

const ServicesSection = ({ isLocked = false, onServiceSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const hiddenRef = useRef(null);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
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
      {/* Section heading */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="section-badge" style={{ justifyContent: 'center' }}>
          🔧 Our Services
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

      {/* Main 4-card grid: 3 services + 1 More card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.25rem',
        }}
        className="services-grid"
      >
        {mainServices.map((service) => (
          <ServiceCard
            key={service.id}
            title={service.title}
            icon={icons[service.iconKey]}
            isLocked={isLocked}
            onClick={() => onServiceSelect?.(service.title)}
          />
        ))}
        {/* More card – always 4th in the row */}
        <ServiceCard
          title="More"
          isMore={true}
          isExpanded={expanded}
          onClick={toggleExpanded}
        />
      </div>

      {/* Hidden services section */}
      <div
        ref={hiddenRef}
        className={`hidden-services${expanded ? ' expanded' : ''}`}
        aria-hidden={!expanded}
      >
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: 'rgba(34, 197, 94, 0.04)',
            border: '1px solid rgba(34, 197, 94, 0.12)',
            borderRadius: '16px',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: '600',
              marginBottom: '1rem',
            }}
          >
            More Services
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.25rem',
            }}
            className="services-grid"
          >
            {hiddenServices.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                icon={icons[service.iconKey]}
                isLocked={isLocked}
                onClick={() => onServiceSelect?.(service.title)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Responsive grid CSS */}
      <style>{`
        .services-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 900px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default ServicesSection;
