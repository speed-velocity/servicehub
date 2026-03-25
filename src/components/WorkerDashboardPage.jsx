import React, { useMemo } from 'react';
import WorkerSessionPanel from './WorkerSessionPanel';

const bookingDateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const WorkerDashboardPage = ({
  workerSession,
  sessionWorker,
  workersLoading,
  isUpdatingAvailability,
  locationShareState,
  bookings,
  bookingsLoading,
  bookingsError,
  onToggleAvailability,
  onLogout,
}) => {
  const stats = useMemo(() => {
    if (!sessionWorker) {
      return [];
    }

    return [
      {
        label: 'Assigned Customers',
        value: bookings.length,
      },
      {
        label: 'Current Status',
        value: sessionWorker.available ? 'Available' : 'Offline',
      },
      {
        label: 'Service',
        value: sessionWorker.service,
      },
    ];
  }, [bookings.length, sessionWorker]);

  if (workersLoading && !sessionWorker) {
    return (
      <main className="portal-page worker-dashboard-page">
        <section className="portal-panel-card auth-form-panel">
          <p className="portal-inline-copy">Loading your worker dashboard...</p>
        </section>
      </main>
    );
  }

  if (!sessionWorker) {
    return null;
  }

  return (
    <main className="portal-page worker-dashboard-page">
      <section className="worker-dashboard-hero">
        <div className="worker-dashboard-hero-copy">
          <div className="section-badge">Worker Dashboard</div>
          <h1 className="worker-dashboard-title">Welcome back, {sessionWorker.name}</h1>
          <p className="worker-dashboard-copy">
            Your profile, live availability, and assigned customer bookings are all managed from this workspace.
          </p>
        </div>

        <div className="worker-dashboard-actions">
          <a href="/" className="btn-outline worker-dashboard-link">
            Go To Home
          </a>
          <button type="button" className="btn-primary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className="worker-dashboard-stats">
        {stats.map((item) => (
          <article key={item.label} className="worker-dashboard-stat">
            <p className="worker-dashboard-stat-label">{item.label}</p>
            <p className="worker-dashboard-stat-value">{item.value}</p>
          </article>
        ))}
      </section>

      <WorkerSessionPanel
        sessionWorker={sessionWorker}
        sessionEmail={workerSession?.email || ''}
        isTogglingAvailability={isUpdatingAvailability}
        locationShareState={locationShareState}
        onLogout={onLogout}
        onToggleAvailability={onToggleAvailability}
      />

      <section className="portal-panel-card worker-bookings-panel">
        <div className="worker-bookings-header">
          <div>
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              Customer Bookings
            </div>
            <h2 className="portal-panel-title">Customers who booked you</h2>
            <p className="portal-inline-copy">
              Every booking assigned to your worker account will appear here with the customer contact details.
            </p>
          </div>
          <div className="worker-bookings-count">{bookings.length} total</div>
        </div>

        {bookingsLoading ? (
          <div className="workers-empty-state" style={{ marginBottom: 0 }}>
            Loading customer bookings...
          </div>
        ) : null}

        {!bookingsLoading && bookingsError ? (
          <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
            {bookingsError}
          </div>
        ) : null}

        {!bookingsLoading && !bookingsError && bookings.length === 0 ? (
          <div className="workers-empty-state" style={{ marginBottom: 0 }}>
            No customers have been assigned to you yet.
          </div>
        ) : null}

        {!bookingsLoading && !bookingsError && bookings.length > 0 ? (
          <div className="worker-bookings-grid">
            {bookings.map((booking) => (
              <article key={booking.id} className="worker-booking-card">
                <div className="worker-booking-card-top">
                  <div>
                    <p className="worker-name">{booking.customerName}</p>
                    <p className="worker-meta">{booking.service}</p>
                  </div>
                  <span className={`worker-status ${booking.status === 'assigned' ? 'available' : 'busy'}`}>
                    {booking.status === 'assigned' ? 'Assigned' : 'Pending'}
                  </span>
                </div>

                <div className="worker-booking-details">
                  <p>
                    <span>Phone:</span>{' '}
                    <a href={`tel:${booking.customerPhone.replace(/\s+/g, '')}`}>{booking.customerPhone}</a>
                  </p>
                  <p>
                    <span>Address:</span> {booking.customerAddress}
                  </p>
                  <p>
                    <span>Booked At:</span> {bookingDateFormatter.format(new Date(booking.createdAt))}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default WorkerDashboardPage;
