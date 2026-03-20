import React from 'react';

const WorkerSessionPanel = ({
  sessionWorker,
  sessionEmail,
  isTogglingAvailability,
  locationShareState,
  onLogout,
  onToggleAvailability,
}) => {
  if (!sessionWorker) {
    return null;
  }

  return (
    <section className="worker-session-card">
      <div className="worker-session-header">
        <div>
          <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
            Worker Session
          </div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              lineHeight: '1.2',
              marginBottom: '0.45rem',
            }}
          >
            {sessionWorker.name} is signed in
          </h2>
          <p style={{ color: '#9ca3af', maxWidth: '560px' }}>
            Current location becomes visible to users only while you stay available and logged in.
          </p>
        </div>
        <span className={`worker-status ${sessionWorker.available ? 'available' : 'busy'}`}>
          {sessionWorker.available ? 'Available' : 'Offline'}
        </span>
      </div>

      <div className="worker-session-grid">
        <div className="worker-session-info">
          <p><span>Email:</span> {sessionEmail || 'Signed in account'}</p>
          <p><span>Service:</span> {sessionWorker.service}</p>
          <p><span>Phone:</span> {sessionWorker.phone}</p>
          <p><span>Base location:</span> {sessionWorker.location}</p>
          <p><span>Live location:</span> {sessionWorker.currentLocation || 'Not shared yet'}</p>
        </div>

        <div className="worker-session-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onToggleAvailability(sessionWorker.id, sessionWorker.available)}
            disabled={isTogglingAvailability}
          >
            {isTogglingAvailability
              ? 'Updating...'
              : sessionWorker.available
                ? 'Go Offline'
                : 'Go Available'}
          </button>
          <button type="button" className="btn-outline" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className={`worker-share-status worker-share-status-${locationShareState.status}`}>
        {locationShareState.message}
      </div>
    </section>
  );
};

export default WorkerSessionPanel;
