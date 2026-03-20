import React, { useMemo, useState } from 'react';
import { serviceOptions } from '../constants/services';
import WorkerSessionPanel from './WorkerSessionPanel';

const createRegisterForm = () => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  service: serviceOptions[0],
  location: '',
  available: true,
});

const createLoginForm = () => ({
  email: '',
  password: '',
});

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const WorkerPortalPage = ({
  sessionWorker,
  workerSession,
  workersLoading,
  isRegisteringWorker,
  isLoggingInWorker,
  isUpdatingAvailability,
  registrationError,
  loginError,
  locationShareState,
  onRegisterWorker,
  onLoginWorker,
  onLogoutWorker,
  onToggleAvailability,
}) => {
  const [registerForm, setRegisterForm] = useState(createRegisterForm);
  const [loginForm, setLoginForm] = useState(createLoginForm);
  const [registerFormErrors, setRegisterFormErrors] = useState({});
  const [loginFormErrors, setLoginFormErrors] = useState({});
  const [registerSuccess, setRegisterSuccess] = useState('');

  const sessionEmail = workerSession?.email || '';
  const showSessionLoading = Boolean(workerSession) && workersLoading && !sessionWorker;

  const workerSummary = useMemo(() => {
    if (!sessionWorker) {
      return null;
    }

    return `${sessionWorker.name} can now switch availability and share live location while signed in.`;
  }, [sessionWorker]);

  const handleRegisterChange = (event) => {
    const { name, value, type, checked } = event.target;

    setRegisterForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setRegisterFormErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [name]: '',
      };
    });

    if (registerSuccess) {
      setRegisterSuccess('');
    }
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setLoginFormErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [name]: '',
      };
    });
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      name: registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
      password: registerForm.password.trim(),
      phone: registerForm.phone.trim(),
      service: registerForm.service.trim(),
      location: registerForm.location.trim(),
      available: Boolean(registerForm.available),
    };

    const nextErrors = {};

    if (!trimmedForm.name) {
      nextErrors.name = 'Please enter the worker name.';
    }

    if (!trimmedForm.email) {
      nextErrors.email = 'Please enter the worker email.';
    } else if (!validateEmail(trimmedForm.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!trimmedForm.password) {
      nextErrors.password = 'Please create a password.';
    } else if (trimmedForm.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!trimmedForm.phone) {
      nextErrors.phone = 'Please enter the worker phone number.';
    }

    if (!trimmedForm.location) {
      nextErrors.location = 'Please enter the base location.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setRegisterFormErrors(nextErrors);
      return;
    }

    try {
      await onRegisterWorker({
        email: trimmedForm.email,
        password: trimmedForm.password,
        workerProfile: {
          name: trimmedForm.name,
          phone: trimmedForm.phone,
          service: trimmedForm.service,
          location: trimmedForm.location,
          available: trimmedForm.available,
        },
      });

      setRegisterForm(createRegisterForm());
      setRegisterFormErrors({});
      setRegisterSuccess('Worker account created and signed in successfully.');
    } catch {
      // Parent state already captures the backend error.
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      email: loginForm.email.trim().toLowerCase(),
      password: loginForm.password.trim(),
    };

    const nextErrors = {};

    if (!trimmedForm.email) {
      nextErrors.email = 'Please enter the worker email.';
    } else if (!validateEmail(trimmedForm.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!trimmedForm.password) {
      nextErrors.password = 'Please enter the password.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setLoginFormErrors(nextErrors);
      return;
    }

    try {
      await onLoginWorker(trimmedForm);
      setLoginForm(createLoginForm());
      setLoginFormErrors({});
    } catch {
      // Parent state already captures the backend error.
    }
  };

  return (
    <main className="portal-page">
      <section className="portal-hero-card">
        <div className="section-badge" style={{ marginBottom: '1rem' }}>
          Worker Portal
        </div>
        <h1 className="portal-page-title">Manage worker availability with secure email login</h1>
        <p className="portal-page-copy">
          Worker registration and live location controls now stay off the public landing page. Only signed-in workers
          can share their current location while available.
        </p>
      </section>

      {showSessionLoading ? (
        <section className="portal-panel-card">
          <p className="portal-inline-copy">Loading your worker profile...</p>
        </section>
      ) : null}

      {sessionWorker ? (
        <section className="portal-stack">
          <WorkerSessionPanel
            sessionWorker={sessionWorker}
            sessionEmail={sessionEmail}
            isTogglingAvailability={isUpdatingAvailability}
            locationShareState={locationShareState}
            onLogout={onLogoutWorker}
            onToggleAvailability={onToggleAvailability}
          />

          <section className="portal-panel-card">
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              Live Status
            </div>
            <h2 className="portal-panel-title">Signed in and ready</h2>
            <p className="portal-inline-copy">{workerSummary}</p>
          </section>
        </section>
      ) : (
        <section className="portal-auth-grid">
          <section className="portal-panel-card">
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              Worker Signup
            </div>
            <h2 className="portal-panel-title">Create a worker account</h2>
            <p className="portal-inline-copy">
              Register once with email and password, then sign in anytime to control your live availability.
            </p>

            <form className="portal-form-grid" onSubmit={handleRegisterSubmit}>
              <label className="booking-field">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  value={registerForm.name}
                  onChange={handleRegisterChange}
                  className={registerFormErrors.name ? 'has-error' : ''}
                  placeholder="Worker full name"
                />
                {registerFormErrors.name ? <small>{registerFormErrors.name}</small> : null}
              </label>

              <label className="booking-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className={registerFormErrors.email ? 'has-error' : ''}
                  placeholder="worker@email.com"
                />
                {registerFormErrors.email ? <small>{registerFormErrors.email}</small> : null}
              </label>

              <label className="booking-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  className={registerFormErrors.password ? 'has-error' : ''}
                  placeholder="Create a password"
                />
                {registerFormErrors.password ? <small>{registerFormErrors.password}</small> : null}
              </label>

              <label className="booking-field">
                <span>Phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  className={registerFormErrors.phone ? 'has-error' : ''}
                  placeholder="Worker phone number"
                />
                {registerFormErrors.phone ? <small>{registerFormErrors.phone}</small> : null}
              </label>

              <label className="booking-field">
                <span>Service</span>
                <select name="service" value={registerForm.service} onChange={handleRegisterChange}>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </label>

              <label className="booking-field">
                <span>Base Location</span>
                <input
                  type="text"
                  name="location"
                  value={registerForm.location}
                  onChange={handleRegisterChange}
                  className={registerFormErrors.location ? 'has-error' : ''}
                  placeholder="City, area, or neighborhood"
                />
                {registerFormErrors.location ? <small>{registerFormErrors.location}</small> : null}
              </label>

              <label className="portal-checkbox">
                <input
                  type="checkbox"
                  name="available"
                  checked={registerForm.available}
                  onChange={handleRegisterChange}
                />
                <span>Set worker as available after signup</span>
              </label>

              <button type="submit" className="btn-primary portal-submit" disabled={isRegisteringWorker}>
                {isRegisteringWorker ? 'Creating Account...' : 'Create Worker Account'}
              </button>
            </form>

            {registerSuccess ? (
              <div className="worker-form-success" role="status">
                {registerSuccess}
              </div>
            ) : null}

            {registrationError ? (
              <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
                {registrationError}
              </div>
            ) : null}
          </section>

          <section className="portal-panel-card">
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              Worker Login
            </div>
            <h2 className="portal-panel-title">Sign in with your worker account</h2>
            <p className="portal-inline-copy">
              Use your registered email and password to go online, share live location, and update availability.
            </p>

            <form className="portal-form-grid" onSubmit={handleLoginSubmit}>
              <label className="booking-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  className={loginFormErrors.email ? 'has-error' : ''}
                  placeholder="Registered worker email"
                />
                {loginFormErrors.email ? <small>{loginFormErrors.email}</small> : null}
              </label>

              <label className="booking-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  className={loginFormErrors.password ? 'has-error' : ''}
                  placeholder="Enter your password"
                />
                {loginFormErrors.password ? <small>{loginFormErrors.password}</small> : null}
              </label>

              <button type="submit" className="btn-primary portal-submit" disabled={isLoggingInWorker}>
                {isLoggingInWorker ? 'Signing In...' : 'Login Worker'}
              </button>
            </form>

            {loginError ? (
              <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
                {loginError}
              </div>
            ) : null}
          </section>
        </section>
      )}
    </main>
  );
};

export default WorkerPortalPage;
