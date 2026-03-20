import React, { useState } from 'react';

const createForm = () => ({
  email: '',
  password: '',
});

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const UserAuthPage = ({
  userSession,
  isRegisteringUser,
  isLoggingInUser,
  userRegistrationError,
  userLoginError,
  onRegisterUser,
  onLoginUser,
  onLogoutUser,
}) => {
  const [registerForm, setRegisterForm] = useState(createForm);
  const [loginForm, setLoginForm] = useState(createForm);
  const [registerFormErrors, setRegisterFormErrors] = useState({});
  const [loginFormErrors, setLoginFormErrors] = useState({});

  const handleChange = (setter, errorSetter) => (event) => {
    const { name, value } = event.target;

    setter((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    errorSetter((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [name]: '',
      };
    });
  };

  const validateForm = (form, label) => {
    const nextErrors = {};

    if (!form.email) {
      nextErrors.email = `Please enter the ${label} email.`;
    } else if (!validateEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = `Please enter the ${label} password.`;
    } else if (label === 'signup' && form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    return nextErrors;
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      email: registerForm.email.trim().toLowerCase(),
      password: registerForm.password.trim(),
    };
    const nextErrors = validateForm(trimmedForm, 'signup');

    if (Object.keys(nextErrors).length > 0) {
      setRegisterFormErrors(nextErrors);
      return;
    }

    try {
      await onRegisterUser(trimmedForm);
      setRegisterForm(createForm());
      setRegisterFormErrors({});
    } catch {
      // Parent state already handles backend error.
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      email: loginForm.email.trim().toLowerCase(),
      password: loginForm.password.trim(),
    };
    const nextErrors = validateForm(trimmedForm, 'login');

    if (Object.keys(nextErrors).length > 0) {
      setLoginFormErrors(nextErrors);
      return;
    }

    try {
      await onLoginUser(trimmedForm);
      setLoginForm(createForm());
      setLoginFormErrors({});
    } catch {
      // Parent state already handles backend error.
    }
  };

  return (
    <main className="portal-page">
      <section className="portal-hero-card">
        <div className="section-badge" style={{ marginBottom: '1rem' }}>
          User Account
        </div>
        <h1 className="portal-page-title">Create a user account for quicker return visits</h1>
        <p className="portal-page-copy">
          User accounts are now separate from the worker portal. Register or log in with email and password, then jump
          back to the home page to book services.
        </p>
      </section>

      {userSession ? (
        <section className="portal-panel-card portal-stack">
          <div>
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              Signed In
            </div>
            <h2 className="portal-panel-title">{userSession.email}</h2>
            <p className="portal-inline-copy">
              Your account is active on this device. You can return to the home page and continue booking anytime.
            </p>
          </div>

          <div className="portal-account-actions">
            <a href="/" className="btn-primary portal-action-link">
              Go To Home
            </a>
            <button type="button" className="btn-outline portal-action-link" onClick={onLogoutUser}>
              Logout
            </button>
          </div>
        </section>
      ) : (
        <section className="portal-auth-grid">
          <section className="portal-panel-card">
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              User Signup
            </div>
            <h2 className="portal-panel-title">Create your user account</h2>
            <p className="portal-inline-copy">
              Save your email and password now so the site is ready for future account-based booking features.
            </p>

            <form className="portal-form-grid" onSubmit={handleRegisterSubmit}>
              <label className="booking-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleChange(setRegisterForm, setRegisterFormErrors)}
                  className={registerFormErrors.email ? 'has-error' : ''}
                  placeholder="you@example.com"
                />
                {registerFormErrors.email ? <small>{registerFormErrors.email}</small> : null}
              </label>

              <label className="booking-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleChange(setRegisterForm, setRegisterFormErrors)}
                  className={registerFormErrors.password ? 'has-error' : ''}
                  placeholder="Create a password"
                />
                {registerFormErrors.password ? <small>{registerFormErrors.password}</small> : null}
              </label>

              <button type="submit" className="btn-primary portal-submit" disabled={isRegisteringUser}>
                {isRegisteringUser ? 'Creating Account...' : 'Create User Account'}
              </button>
            </form>

            {userRegistrationError ? (
              <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
                {userRegistrationError}
              </div>
            ) : null}
          </section>

          <section className="portal-panel-card">
            <div className="section-badge" style={{ marginBottom: '0.9rem' }}>
              User Login
            </div>
            <h2 className="portal-panel-title">Sign in to your account</h2>
            <p className="portal-inline-copy">
              Existing users can log in here with the same email and password used during signup.
            </p>

            <form className="portal-form-grid" onSubmit={handleLoginSubmit}>
              <label className="booking-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleChange(setLoginForm, setLoginFormErrors)}
                  className={loginFormErrors.email ? 'has-error' : ''}
                  placeholder="Registered email"
                />
                {loginFormErrors.email ? <small>{loginFormErrors.email}</small> : null}
              </label>

              <label className="booking-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleChange(setLoginForm, setLoginFormErrors)}
                  className={loginFormErrors.password ? 'has-error' : ''}
                  placeholder="Enter your password"
                />
                {loginFormErrors.password ? <small>{loginFormErrors.password}</small> : null}
              </label>

              <button type="submit" className="btn-primary portal-submit" disabled={isLoggingInUser}>
                {isLoggingInUser ? 'Signing In...' : 'Login User'}
              </button>
            </form>

            {userLoginError ? (
              <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
                {userLoginError}
              </div>
            ) : null}
          </section>
        </section>
      )}
    </main>
  );
};

export default UserAuthPage;
