import React, { useEffect, useRef } from 'react';

const BookingModal = ({
  isOpen,
  selectedService,
  showServiceSelect,
  serviceOptions,
  formData,
  formErrors,
  confirmedBooking,
  onClose,
  onChange,
  onSubmit,
}) => {
  const firstInputRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
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
      onClick={onClose}
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
          onClick={onClose}
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
              We have saved your details for this frontend demo flow.
            </p>

            <div className="booking-summary">
              <p><span>Name:</span> {confirmedBooking.name}</p>
              <p><span>Phone:</span> {confirmedBooking.phone}</p>
              <p><span>Address:</span> {confirmedBooking.address}</p>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={onClose}
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
                <span>Address</span>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={onChange}
                  className={formErrors.address ? 'has-error' : ''}
                  placeholder="Enter your service address"
                  rows="4"
                />
                {formErrors.address && <small>{formErrors.address}</small>}
              </label>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Confirm Booking
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
