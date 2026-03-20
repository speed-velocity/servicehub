import React, { useState } from 'react';

const WorkerSessionPanel = ({
  sessionWorker,
  isLoggingIn,
  loginError,
  locationShareState,
  onLogin,
  onLogout,
  onToggleAvailability,
}) => {
  const [phone, setPhone] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!phone.trim()) {
      return;
    }

    await onLogin(phone);
  };

  if (sessionWorker) {
    return (
      <section className="worker-session-card">
        <div className="worker-session-header">
          <div>
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              Worker Login
            </div>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                lineHeight: '1.2',
                marginBottom: '0.45rem',
              }}
            >
              {sessionWorker.name} is signed in
            </h3>
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
            >
              {sessionWorker.available ? 'Go Offline' : 'Go Available'}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className={`worker-share-status worker-share-status-${locationShareState.status}`}>
          {locationShareState.message}
        </div>
      </section>
    );
  }

  return (
    <section className="worker-session-card">
      <div className="worker-registration-header">
        <div>
          <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
            Worker Login
          </div>
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              lineHeight: '1.2',
              marginBottom: '0.55rem',
            }}
          >
            Login to share live location
          </h3>
          <p style={{ color: '#9ca3af', maxWidth: '560px' }}>
            Existing workers can sign in with their phone number and go online to share accurate current location.
          </p>
        </div>
      </div>

      <form className="worker-session-form" onSubmit={handleSubmit}>
        <label className="booking-field">
          <span>Worker Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter registered worker phone"
          />
        </label>

        <button type="submit" className="btn-primary" disabled={isLoggingIn}>
          {isLoggingIn ? 'Signing In...' : 'Login Worker'}
        </button>
      </form>

      {loginError ? (
        <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
          {loginError}
        </div>
      ) : null}
    </section>
  );
};

export default WorkerSessionPanel;
