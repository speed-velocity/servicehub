import React from 'react';

const ServiceCard = ({ icon, title, isMore = false, isLocked = false, onClick, isExpanded = false }) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`service-card ${isMore ? 'more-card' : ''}${isLocked && !isMore ? ' service-card-locked' : ''}`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      aria-expanded={isMore ? isExpanded : undefined}
      aria-label={isLocked && !isMore ? `${title} service requires login` : undefined}
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
              color: '#22c55e',
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
            color: isMore ? '#bbf7d0' : '#ffffff',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </span>
        {isLocked && !isMore ? (
          <p style={{ fontSize: '0.75rem', color: '#bbf7d0', marginTop: '0.25rem', fontWeight: '500' }}>
            Login required
          </p>
        ) : null}
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
