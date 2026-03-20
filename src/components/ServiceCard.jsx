import React from 'react';

const ServiceCard = ({ icon, title, isMore = false, onClick, isExpanded = false }) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`service-card ${isMore ? 'more-card' : ''}`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      aria-expanded={isMore ? isExpanded : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="icon-wrapper">
        {isMore ? (
          <span
            style={{
              fontSize: '1.75rem',
              color: '#3b82f6',
              fontWeight: '300',
              lineHeight: '1',
              transition: 'transform 300ms ease-in-out',
              transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            +
          </span>
        ) : (
          icon
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            color: isMore ? '#93c5fd' : '#ffffff',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </span>
        {isMore && (
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: '400' }}>
            {isExpanded ? 'Show less' : 'View all'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
