import React, { useState } from 'react';

const serviceOptions = [
  'Electrician',
  'Plumber',
  'Cleaner',
  'AC Repair',
  'Painter',
  'Carpenter',
  'Technician',
];

const createInitialForm = (selectedService) => ({
  name: '',
  phone: '',
  service: selectedService || serviceOptions[0],
  location: '',
  available: true,
});

const WorkerRegistrationForm = ({
  selectedService,
  isSubmitting,
  error,
  onRegister,
}) => {
  const [formData, setFormData] = useState(() => createInitialForm(selectedService));
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: nextValue,
    }));

    setFormErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [name]: '',
      };
    });

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      service: formData.service.trim(),
      location: formData.location.trim(),
      available: Boolean(formData.available),
    };

    const nextErrors = {};

    if (!trimmedForm.name) {
      nextErrors.name = 'Please enter the worker name.';
    }

    if (!trimmedForm.phone) {
      nextErrors.phone = 'Please enter the worker phone number.';
    }

    if (!trimmedForm.service) {
      nextErrors.service = 'Please select a service.';
    }

    if (!trimmedForm.location) {
      nextErrors.location = 'Please enter the worker location.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    try {
      await onRegister(trimmedForm);
      setFormData(createInitialForm(selectedService));
      setFormErrors({});
      setSuccessMessage(`${trimmedForm.name} is now registered and syncing live.`);
    } catch {
      // Parent error state already captures the backend failure.
    }
  };

  return (
    <section className="worker-registration-card">
      <div className="worker-registration-header">
        <div>
          <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
            Worker Registration
          </div>
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              lineHeight: '1.2',
              marginBottom: '0.55rem',
            }}
          >
            Register a Worker
          </h3>
          <p style={{ color: '#9ca3af', maxWidth: '560px' }}>
            Submit a worker once and the live worker list will update instantly.
          </p>
        </div>
      </div>

      <form className="worker-registration-form" onSubmit={handleSubmit}>
        <label className="booking-field">
          <span>Name</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={formErrors.name ? 'has-error' : ''}
            placeholder="Worker full name"
          />
          {formErrors.name ? <small>{formErrors.name}</small> : null}
        </label>

        <label className="booking-field">
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={formErrors.phone ? 'has-error' : ''}
            placeholder="Worker phone number"
          />
          {formErrors.phone ? <small>{formErrors.phone}</small> : null}
        </label>

        <label className="booking-field">
          <span>Service</span>
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            className={formErrors.service ? 'has-error' : ''}
          >
            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          {formErrors.service ? <small>{formErrors.service}</small> : null}
        </label>

        <label className="booking-field worker-registration-wide">
          <span>Location</span>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={formErrors.location ? 'has-error' : ''}
            placeholder="City, area, or neighborhood"
          />
          {formErrors.location ? <small>{formErrors.location}</small> : null}
        </label>

        <label className="worker-availability-toggle">
          <input
            type="checkbox"
            name="available"
            checked={formData.available}
            onChange={handleChange}
          />
          <span>Available right now</span>
        </label>

        <button
          type="submit"
          className="btn-primary worker-registration-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register Worker'}
        </button>
      </form>

      {successMessage ? (
        <div className="worker-form-success" role="status">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
          {error}
        </div>
      ) : null}
    </section>
  );
};

export default WorkerRegistrationForm;
