import React from 'react';
import WorkerRegistrationForm from './WorkerRegistrationForm';

const WorkersSection = ({
  selectedService,
  workers,
  isLoading,
  error,
  workerActionId,
  isRegisteringWorker,
  registrationError,
  highlightedWorkerId,
  onRegisterWorker,
  onToggleAvailability,
}) => {
  const heading = selectedService ? `${selectedService} Workers` : 'Available Workers';

  return (
    <section
      style={{
        padding: '0 1.5rem 6rem',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="section-badge" style={{ justifyContent: 'center' }}>
          Live Worker Status
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.7rem, 4vw, 2.3rem)',
            fontWeight: '800',
            letterSpacing: '-0.025em',
            lineHeight: '1.2',
            marginBottom: '0.75rem',
          }}
        >
          {heading}
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '1rem', maxWidth: '520px', margin: '0 auto' }}>
          The worker list updates instantly whenever a worker is added or updated.
        </p>
      </div>

      <WorkerRegistrationForm
        key={selectedService || 'all-services'}
        selectedService={selectedService}
        isSubmitting={isRegisteringWorker}
        error={registrationError}
        onRegister={onRegisterWorker}
      />

      {error ? (
        <div className="workers-feedback" role="alert">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="workers-loading-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="worker-card worker-card-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : null}

      {!isLoading && workers.length === 0 ? (
        <div className="workers-empty-state">
          {selectedService
            ? `No ${selectedService.toLowerCase()} workers are available in the live list yet.`
            : 'No workers found yet.'}
        </div>
      ) : null}

      {!isLoading && workers.length > 0 ? (
        <div className="workers-grid">
          {workers.map((worker) => (
            <article
              key={worker.id}
              className={`worker-card${highlightedWorkerId === worker.id ? ' worker-card-highlighted' : ''}`}
            >
              <div className="worker-card-top">
                <div>
                  <p className="worker-name">{worker.name}</p>
                  <p className="worker-meta">{worker.service}</p>
                </div>
                <span className={`worker-status ${worker.available ? 'available' : 'busy'}`}>
                  {worker.available ? 'Available' : 'Busy'}
                </span>
              </div>

              <p className="worker-location">{worker.location}</p>

              <button
                type="button"
                className="btn-outline worker-toggle-btn"
                onClick={() => onToggleAvailability(worker.id, worker.available)}
                disabled={workerActionId === worker.id}
              >
                {workerActionId === worker.id
                  ? 'Updating...'
                  : worker.available
                    ? 'Mark Busy'
                    : 'Mark Available'}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default WorkersSection;
