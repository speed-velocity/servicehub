import React, { useEffect, useRef, useState } from 'react';
import IndiaLocationPicker from './IndiaLocationPicker';

const BookingModal = ({
  isOpen,
  selectedService,
  showServiceSelect,
  serviceOptions,
  formData,
  formErrors,
  confirmedBooking,
  matchedWorkers,
  submissionError,
  isSubmitting,
  isResolvingAddress,
  selectedLocation,
  onClose,
  onChange,
  onLocationPick,
  onSubmit,
}) => {
  const firstInputRef = useRef(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleClose = () => {
    setShowMapPicker(false);
    onClose();
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setShowMapPicker(false);
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && !confirmedBooking) {
      firstInputRef.current?.focus();
    }
  }, [isOpen, confirmedBooking]);

  return (
    <div
      className={`booking-modal-overlay${isOpen ? ' open' : ''}`}
      aria-hidden={!isOpen}
      onClick={handleClose}
    >
      <div
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="booking-modal-close"
          aria-label="Close booking form"
          onClick={handleClose}
        >
          &times;
        </button>

        {confirmedBooking ? (
          <div className="booking-confirmation">
            <div className="section-badge" style={{ marginBottom: '1rem' }}>
              Booking Confirmed
            </div>
            <h3
              id="booking-modal-title"
              style={{
                fontSize: '1.85rem',
                fontWeight: '800',
                lineHeight: '1.2',
                marginBottom: '0.85rem',
              }}
            >
              Booking confirmed for {confirmedBooking.service}
            </h3>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              {confirmedBooking.assignedWorkerName
                ? `${confirmedBooking.assignedWorkerName} has been assigned to this booking.`
                : 'Your booking is saved. We will assign a worker as soon as one is available.'}
            </p>

            <div className="booking-summary">
              <p><span>Name:</span> {confirmedBooking.name}</p>
              <p><span>Phone:</span> {confirmedBooking.phone}</p>
              <p><span>Address:</span> {confirmedBooking.address}</p>
              <p>
                <span>Status:</span> {confirmedBooking.status === 'assigned' ? 'Assigned to worker' : 'Pending'}
              </p>
            </div>

            <div className="booking-worker-results">
              <div className="booking-worker-results-header">
                <p className="booking-worker-results-title">Available workers for this booking</p>
                <p className="booking-worker-results-copy">
                  Showing available {confirmedBooking.service.toLowerCase()} workers sorted by location match.
                </p>
              </div>

              {matchedWorkers.length > 0 ? (
                <div className="booking-worker-results-grid">
                  {matchedWorkers.map((worker) => (
                    <article key={worker.id} className="booking-worker-card">
                      <div className="booking-worker-card-top">
                        <div>
                          <p className="worker-name">{worker.name}</p>
                          <p className="worker-meta">{worker.service}</p>
                        </div>
                        <div className="booking-worker-badges">
                          <span className={`worker-status ${worker.isNearest ? 'available' : 'busy'}`}>
                            {worker.isNearest ? 'Nearest' : 'Available'}
                          </span>
                          <span className="booking-distance-chip">{worker.distanceLabel}</span>
                        </div>
                      </div>

                      <p className="worker-location">{worker.location}</p>
                      {worker.currentLocation ? (
                        <p className="worker-live-location">Current area: {worker.currentLocation}</p>
                      ) : null}
                      {worker.phone ? <p className="worker-contact">{worker.phone}</p> : null}

                      {worker.phone ? (
                        <a className="btn-outline booking-worker-call" href={`tel:${worker.phone.replace(/\s+/g, '')}`}>
                          Call Worker
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="workers-empty-state" style={{ marginBottom: 0 }}>
                  No available workers match this service right now.
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="section-badge" style={{ marginBottom: '1rem' }}>
              Secure Booking
            </div>
            <h3
              id="booking-modal-title"
              style={{
                fontSize: '1.85rem',
                fontWeight: '800',
                lineHeight: '1.2',
                marginBottom: '0.7rem',
              }}
            >
              Complete Your Booking
            </h3>
            {!showServiceSelect ? (
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                Selected service: <span style={{ color: '#ffffff', fontWeight: '600' }}>{selectedService}</span>
              </p>
            ) : (
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                Choose the service you need and then fill in your details.
              </p>
            )}

            <form className="booking-form" onSubmit={onSubmit}>
              {showServiceSelect ? (
                <label className="booking-field">
                  <span>Which Service Do You Need?</span>
                  <select
                    ref={firstInputRef}
                    name="service"
                    value={selectedService}
                    onChange={onChange}
                    className={formErrors.service ? 'has-error' : ''}
                  >
                    <option value="">Select a service</option>
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  {formErrors.service && <small>{formErrors.service}</small>}
                </label>
              ) : null}

              <label className="booking-field">
                <span>Name</span>
                <input
                  ref={!showServiceSelect ? firstInputRef : null}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  className={formErrors.name ? 'has-error' : ''}
                  placeholder="Enter your full name"
                />
                {formErrors.name && <small>{formErrors.name}</small>}
              </label>

              <label className="booking-field">
                <span>Phone Number</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={onChange}
                  className={formErrors.phone ? 'has-error' : ''}
                  placeholder="Enter your phone number"
                />
                {formErrors.phone && <small>{formErrors.phone}</small>}
              </label>

              <label className="booking-field">
                <div className="booking-field-top">
                  <span>Address</span>
                  <button
                    type="button"
                    className="booking-map-toggle"
                    onClick={() => setShowMapPicker((currentValue) => !currentValue)}
                  >
                    {showMapPicker ? 'Hide India Map' : 'Choose from India Map'}
                  </button>
                </div>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={onChange}
                  className={formErrors.address ? 'has-error' : ''}
                  placeholder="Enter your service address"
                  rows="4"
                />
                {isResolvingAddress ? (
                  <p className="booking-address-status">Fetching locality details from your selected location...</p>
                ) : null}
                <div className={`booking-map-region${showMapPicker ? ' open' : ''}`}>
                  <IndiaLocationPicker
                    isVisible={showMapPicker}
                    selectedLocation={selectedLocation}
                    onPick={onLocationPick}
                  />
                </div>
                {formErrors.address && <small>{formErrors.address}</small>}
              </label>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Confirming Booking...' : 'Confirm Booking'}
              </button>

              {submissionError ? (
                <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
                  {submissionError}
                </div>
              ) : null}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
