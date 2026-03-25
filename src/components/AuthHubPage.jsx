import React, { useEffect, useMemo, useState } from 'react';
import { serviceOptions } from '../constants/services';
import WorkerSessionPanel from './WorkerSessionPanel';

const authModes = [
  { id: 'user-register', label: 'User Register', type: 'user' },
  { id: 'user-login', label: 'User Login', type: 'user' },
  { id: 'worker-register', label: 'Worker Register', type: 'worker' },
  { id: 'worker-login', label: 'Worker Login', type: 'worker' },
];

const modeContent = {
  user: {
    register: {
      badge: 'User Signup',
      title: 'Sign up.',
      description: 'Create your account in a few clean steps.',
      switchCopy: 'Already a member?',
      switchLabel: 'Log in',
      alternateMode: 'user-login',
      showcaseBadge: 'Join For Free',
      showcaseTitle: 'Let’s get started.',
      showcaseCopy: 'Trusted services, cleaner access, faster booking.',
      showcasePoints: ['Instant booking', 'Safer sign-in', 'Return faster'],
    },
    login: {
      badge: 'User Login',
      title: 'Sign in.',
      description: 'Get back in and continue quickly.',
      switchCopy: 'Need an account?',
      switchLabel: 'Register',
      alternateMode: 'user-register',
      showcaseBadge: 'Secure Return',
      showcaseTitle: 'Welcome back.',
      showcaseCopy: 'Secure return access with less friction.',
      showcasePoints: ['Quick re-entry', 'Protected access', 'Less friction'],
    },
  },
  worker: {
    register: {
      badge: 'Worker Signup',
      title: 'Worker signup.',
      description: 'Set up your worker profile and go live.',
      switchCopy: 'Already registered?',
      switchLabel: 'Log in',
      alternateMode: 'worker-login',
      showcaseBadge: 'Worker Access',
      showcaseTitle: 'Build your worker profile.',
      showcaseCopy: 'Secure setup, live control, and cleaner visibility.',
      showcasePoints: ['Live status', 'Secure profile', 'Location control'],
    },
    login: {
      badge: 'Worker Login',
      title: 'Worker login.',
      description: 'Sign in and manage your availability instantly.',
      switchCopy: 'New worker here?',
      switchLabel: 'Register',
      alternateMode: 'worker-register',
      showcaseBadge: 'Go Live',
      showcaseTitle: 'Go live in one move.',
      showcaseCopy: 'Stay visible, manage status, and move fast.',
      showcasePoints: ['Go available', 'Stay visible', 'Secure dashboard'],
    },
  },
};

const createUserForm = () => ({
  email: '',
  password: '',
});

const createWorkerRegisterForm = () => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  service: serviceOptions[0],
  location: '',
  available: true,
});

const createWorkerLoginForm = () => ({
  email: '',
  password: '',
});

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getPasswordHint = (password, requiresStrongCheck) => {
  if (!password) {
    return {
      text: 'Use at least 6 characters.',
      status: 'muted',
    };
  }

  if (requiresStrongCheck && password.length < 6) {
    return {
      text: 'Password is too short. Use at least 6 characters.',
      status: 'error',
    };
  }

  return {
    text: 'Password length looks good.',
    status: 'success',
  };
};

const PasswordField = ({
  error,
  hint,
  isVisible,
  label,
  name,
  onChange,
  onToggleVisibility,
  placeholder,
  value,
}) => (
  <label className="booking-field">
    <span>{label}</span>
    <div className={`password-input-shell${error ? ' has-error' : ''}`}>
      <input
        type={isVisible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        className={error ? 'has-error' : ''}
        placeholder={placeholder}
      />
      <button type="button" className="password-toggle-btn" onClick={onToggleVisibility}>
        {isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
    {error ? <small>{error}</small> : null}
    {!error && hint ? <p className={`password-hint password-hint-${hint.status}`}>{hint.text}</p> : null}
  </label>
);

const AuthHubPage = ({
  authPrompt,
  initialMode,
  userSession,
  workerSession,
  sessionWorker,
  workersLoading,
  isRegisteringWorker,
  isLoggingInWorker,
  isUpdatingAvailability,
  workerRegistrationError,
  workerLoginError,
  isRegisteringUser,
  isLoggingInUser,
  userRegistrationError,
  userLoginError,
  locationShareState,
  onRegisterWorker,
  onLoginWorker,
  onLogoutWorker,
  onToggleAvailability,
  onRegisterUser,
  onLoginUser,
  onLogoutUser,
}) => {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [userRegisterForm, setUserRegisterForm] = useState(createUserForm);
  const [userLoginForm, setUserLoginForm] = useState(createUserForm);
  const [workerRegisterForm, setWorkerRegisterForm] = useState(createWorkerRegisterForm);
  const [workerLoginForm, setWorkerLoginForm] = useState(createWorkerLoginForm);
  const [userRegisterErrors, setUserRegisterErrors] = useState({});
  const [userLoginErrors, setUserLoginErrors] = useState({});
  const [workerRegisterErrors, setWorkerRegisterErrors] = useState({});
  const [workerLoginErrors, setWorkerLoginErrors] = useState({});
  const [workerRegisterSuccess, setWorkerRegisterSuccess] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({
    userRegister: false,
    userLogin: false,
    workerRegister: false,
    workerLogin: false,
  });

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  const currentMode = useMemo(
    () => authModes.find((mode) => mode.id === activeMode) || authModes[0],
    [activeMode]
  );
  const activeType = currentMode.type;
  const activeAction = currentMode.id.includes('login') ? 'login' : 'register';
  const content = modeContent[activeType][activeAction];
  const showcaseCards = useMemo(
    () =>
      content.showcasePoints.map((point, index) => ({
        id: `${activeType}-${activeAction}-${index}`,
        label: index === 0 ? 'Flash' : index === 1 ? 'Guard' : 'Flow',
        title: point,
      })),
    [activeAction, activeType, content.showcasePoints]
  );
  const workspaceHighlights = useMemo(
    () =>
      activeType === 'user'
        ? [
            { label: 'Mode', value: activeAction === 'register' ? 'New Account' : 'Quick Login' },
            { label: 'Result', value: activeAction === 'register' ? 'Book Faster' : 'Resume Fast' },
          ]
        : [
            { label: 'Mode', value: activeAction === 'register' ? 'Worker Setup' : 'Worker Login' },
            { label: 'Result', value: activeAction === 'register' ? 'Go Live' : 'Manage Status' },
          ],
    [activeAction, activeType]
  );

  const workerSummary = useMemo(() => {
    if (!sessionWorker) {
      return '';
    }

    return `${sessionWorker.name} can now switch availability and share live location while signed in.`;
  }, [sessionWorker]);

  const showWorkerSessionLoading = Boolean(workerSession) && workersLoading && !sessionWorker;

  const userRegisterPasswordHint = getPasswordHint(userRegisterForm.password, true);
  const userLoginPasswordHint = getPasswordHint(userLoginForm.password, false);
  const workerRegisterPasswordHint = getPasswordHint(workerRegisterForm.password, true);
  const workerLoginPasswordHint = getPasswordHint(workerLoginForm.password, false);

  const togglePasswordVisibility = (key) => {
    setVisiblePasswords((currentState) => ({
      ...currentState,
      [key]: !currentState[key],
    }));
  };

  const switchType = (nextType) => {
    setActiveMode(`${nextType}-${activeAction}`);
  };

  const switchAction = (nextAction) => {
    setActiveMode(`${activeType}-${nextAction}`);
  };

  const switchAlternateMode = () => {
    setActiveMode(content.alternateMode);
  };

  const handleUserChange = (setter, errorSetter) => (event) => {
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

  const handleWorkerRegisterChange = (event) => {
    const { name, value, type, checked } = event.target;

    setWorkerRegisterForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setWorkerRegisterErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [name]: '',
      };
    });

    if (workerRegisterSuccess) {
      setWorkerRegisterSuccess('');
    }
  };

  const handleWorkerLoginChange = (event) => {
    const { name, value } = event.target;

    setWorkerLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setWorkerLoginErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [name]: '',
      };
    });
  };

  const validateUserForm = (form, formType) => {
    const nextErrors = {};

    if (!form.email) {
      nextErrors.email = 'Please enter your email.';
    } else if (!validateEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = 'Please enter your password.';
    } else if (formType === 'register' && form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    return nextErrors;
  };

  const handleUserRegisterSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      email: userRegisterForm.email.trim().toLowerCase(),
      password: userRegisterForm.password.trim(),
    };
    const nextErrors = validateUserForm(trimmedForm, 'register');

    if (Object.keys(nextErrors).length > 0) {
      setUserRegisterErrors(nextErrors);
      return;
    }

    try {
      await onRegisterUser(trimmedForm);
      setUserRegisterForm(createUserForm());
      setUserRegisterErrors({});
    } catch {
      // Parent state already handles backend error.
    }
  };

  const handleUserLoginSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      email: userLoginForm.email.trim().toLowerCase(),
      password: userLoginForm.password.trim(),
    };
    const nextErrors = validateUserForm(trimmedForm, 'login');

    if (Object.keys(nextErrors).length > 0) {
      setUserLoginErrors(nextErrors);
      return;
    }

    try {
      await onLoginUser(trimmedForm);
      setUserLoginForm(createUserForm());
      setUserLoginErrors({});
    } catch {
      // Parent state already handles backend error.
    }
  };

  const handleWorkerRegisterSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      name: workerRegisterForm.name.trim(),
      email: workerRegisterForm.email.trim().toLowerCase(),
      password: workerRegisterForm.password.trim(),
      phone: workerRegisterForm.phone.trim(),
      service: workerRegisterForm.service.trim(),
      location: workerRegisterForm.location.trim(),
      available: Boolean(workerRegisterForm.available),
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
      setWorkerRegisterErrors(nextErrors);
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

      setWorkerRegisterForm(createWorkerRegisterForm());
      setWorkerRegisterErrors({});
      setWorkerRegisterSuccess('Worker account created and signed in successfully.');
      setActiveMode('worker-login');
    } catch {
      // Parent state already handles backend error.
    }
  };

  const handleWorkerLoginSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      email: workerLoginForm.email.trim().toLowerCase(),
      password: workerLoginForm.password.trim(),
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
      setWorkerLoginErrors(nextErrors);
      return;
    }

    try {
      await onLoginWorker(trimmedForm);
      setWorkerLoginForm(createWorkerLoginForm());
      setWorkerLoginErrors({});
    } catch {
      // Parent state already handles backend error.
    }
  };

  const renderUserRegister = () => (
    <section className="portal-panel-card auth-form-panel">
      <div className="auth-form-header">
        <div className="section-badge">{content.badge}</div>
        <h2 className="auth-form-title">{content.title}</h2>
        <p className="portal-inline-copy">{content.description}</p>
      </div>

      <form className="portal-form-grid" onSubmit={handleUserRegisterSubmit}>
        <label className="booking-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={userRegisterForm.email}
            onChange={handleUserChange(setUserRegisterForm, setUserRegisterErrors)}
            className={userRegisterErrors.email ? 'has-error' : ''}
            placeholder="you@example.com"
          />
          {userRegisterErrors.email ? <small>{userRegisterErrors.email}</small> : null}
        </label>

        <PasswordField
          error={userRegisterErrors.password}
          hint={userRegisterPasswordHint}
          isVisible={visiblePasswords.userRegister}
          label="Password"
          name="password"
          onChange={handleUserChange(setUserRegisterForm, setUserRegisterErrors)}
          onToggleVisibility={() => togglePasswordVisibility('userRegister')}
          placeholder="Create a password"
          value={userRegisterForm.password}
        />

        <button type="submit" className="btn-primary portal-submit" disabled={isRegisteringUser}>
          {isRegisteringUser ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-form-switch">
        <span>{content.switchCopy}</span>
        <button type="button" className="auth-inline-link" onClick={switchAlternateMode}>
          {content.switchLabel}
        </button>
      </div>

      {userRegistrationError ? (
        <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
          {userRegistrationError}
        </div>
      ) : null}
    </section>
  );

  const renderUserLogin = () => (
    <section className="portal-panel-card auth-form-panel">
      <div className="auth-form-header">
        <div className="section-badge">{content.badge}</div>
        <h2 className="auth-form-title">{content.title}</h2>
        <p className="portal-inline-copy">{content.description}</p>
      </div>

      <form className="portal-form-grid" onSubmit={handleUserLoginSubmit}>
        <label className="booking-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={userLoginForm.email}
            onChange={handleUserChange(setUserLoginForm, setUserLoginErrors)}
            className={userLoginErrors.email ? 'has-error' : ''}
            placeholder="Registered email"
          />
          {userLoginErrors.email ? <small>{userLoginErrors.email}</small> : null}
        </label>

        <PasswordField
          error={userLoginErrors.password}
          hint={userLoginPasswordHint}
          isVisible={visiblePasswords.userLogin}
          label="Password"
          name="password"
          onChange={handleUserChange(setUserLoginForm, setUserLoginErrors)}
          onToggleVisibility={() => togglePasswordVisibility('userLogin')}
          placeholder="Enter your password"
          value={userLoginForm.password}
        />

        <button type="submit" className="btn-primary portal-submit" disabled={isLoggingInUser}>
          {isLoggingInUser ? 'Signing In...' : 'Login User'}
        </button>
      </form>

      <div className="auth-form-switch">
        <span>{content.switchCopy}</span>
        <button type="button" className="auth-inline-link" onClick={switchAlternateMode}>
          {content.switchLabel}
        </button>
      </div>

      {userLoginError ? (
        <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
          {userLoginError}
        </div>
      ) : null}
    </section>
  );

  const renderWorkerRegister = () => (
    <section className="portal-panel-card auth-form-panel">
      <div className="auth-form-header">
        <div className="section-badge">{content.badge}</div>
        <h2 className="auth-form-title">{content.title}</h2>
        <p className="portal-inline-copy">{content.description}</p>
      </div>

      <form className="portal-form-grid" onSubmit={handleWorkerRegisterSubmit}>
        <label className="booking-field">
          <span>Name</span>
          <input
            type="text"
            name="name"
            value={workerRegisterForm.name}
            onChange={handleWorkerRegisterChange}
            className={workerRegisterErrors.name ? 'has-error' : ''}
            placeholder="Worker full name"
          />
          {workerRegisterErrors.name ? <small>{workerRegisterErrors.name}</small> : null}
        </label>

        <label className="booking-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={workerRegisterForm.email}
            onChange={handleWorkerRegisterChange}
            className={workerRegisterErrors.email ? 'has-error' : ''}
            placeholder="worker@email.com"
          />
          {workerRegisterErrors.email ? <small>{workerRegisterErrors.email}</small> : null}
        </label>

        <PasswordField
          error={workerRegisterErrors.password}
          hint={workerRegisterPasswordHint}
          isVisible={visiblePasswords.workerRegister}
          label="Password"
          name="password"
          onChange={handleWorkerRegisterChange}
          onToggleVisibility={() => togglePasswordVisibility('workerRegister')}
          placeholder="Create a password"
          value={workerRegisterForm.password}
        />

        <label className="booking-field">
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            value={workerRegisterForm.phone}
            onChange={handleWorkerRegisterChange}
            className={workerRegisterErrors.phone ? 'has-error' : ''}
            placeholder="Worker phone number"
          />
          {workerRegisterErrors.phone ? <small>{workerRegisterErrors.phone}</small> : null}
        </label>

        <label className="booking-field">
          <span>Service</span>
          <select name="service" value={workerRegisterForm.service} onChange={handleWorkerRegisterChange}>
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
            value={workerRegisterForm.location}
            onChange={handleWorkerRegisterChange}
            className={workerRegisterErrors.location ? 'has-error' : ''}
            placeholder="City, area, or neighborhood"
          />
          {workerRegisterErrors.location ? <small>{workerRegisterErrors.location}</small> : null}
        </label>

        <label className="portal-checkbox">
          <input
            type="checkbox"
            name="available"
            checked={workerRegisterForm.available}
            onChange={handleWorkerRegisterChange}
          />
          <span>Set worker as available after signup</span>
        </label>

        <button type="submit" className="btn-primary portal-submit" disabled={isRegisteringWorker}>
          {isRegisteringWorker ? 'Creating Account...' : 'Create Worker Account'}
        </button>
      </form>

      <div className="auth-form-switch">
        <span>{content.switchCopy}</span>
        <button type="button" className="auth-inline-link" onClick={switchAlternateMode}>
          {content.switchLabel}
        </button>
      </div>

      {workerRegisterSuccess ? (
        <div className="worker-form-success" role="status">
          {workerRegisterSuccess}
        </div>
      ) : null}

      {workerRegistrationError ? (
        <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
          {workerRegistrationError}
        </div>
      ) : null}
    </section>
  );

  const renderWorkerLogin = () => (
    <section className="portal-panel-card auth-form-panel">
      <div className="auth-form-header">
        <div className="section-badge">{content.badge}</div>
        <h2 className="auth-form-title">{content.title}</h2>
        <p className="portal-inline-copy">{content.description}</p>
      </div>

      <form className="portal-form-grid" onSubmit={handleWorkerLoginSubmit}>
        <label className="booking-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={workerLoginForm.email}
            onChange={handleWorkerLoginChange}
            className={workerLoginErrors.email ? 'has-error' : ''}
            placeholder="Registered worker email"
          />
          {workerLoginErrors.email ? <small>{workerLoginErrors.email}</small> : null}
        </label>

        <PasswordField
          error={workerLoginErrors.password}
          hint={workerLoginPasswordHint}
          isVisible={visiblePasswords.workerLogin}
          label="Password"
          name="password"
          onChange={handleWorkerLoginChange}
          onToggleVisibility={() => togglePasswordVisibility('workerLogin')}
          placeholder="Enter your password"
          value={workerLoginForm.password}
        />

        <button type="submit" className="btn-primary portal-submit" disabled={isLoggingInWorker}>
          {isLoggingInWorker ? 'Signing In...' : 'Login Worker'}
        </button>
      </form>

      <div className="auth-form-switch">
        <span>{content.switchCopy}</span>
        <button type="button" className="auth-inline-link" onClick={switchAlternateMode}>
          {content.switchLabel}
        </button>
      </div>

      {workerLoginError ? (
        <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
          {workerLoginError}
        </div>
      ) : null}
    </section>
  );

  const renderSessionPanel = () => {
    if (currentMode.type === 'worker' && sessionWorker) {
      return (
        <section className="portal-stack">
          <WorkerSessionPanel
            sessionWorker={sessionWorker}
            sessionEmail={workerSession?.email || ''}
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
      );
    }

    if (currentMode.type === 'user' && userSession) {
      return (
        <section className="portal-panel-card portal-stack auth-form-panel">
          <div className="auth-form-header">
            <div className="section-badge">Signed In</div>
            <h2 className="auth-form-title">{userSession.email}</h2>
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
      );
    }

    return null;
  };

  const renderFormPanel = () => {
    if (showWorkerSessionLoading) {
      return (
        <section className="portal-panel-card auth-form-panel">
          <p className="portal-inline-copy">Loading your worker profile...</p>
        </section>
      );
    }

    const sessionPanel = renderSessionPanel();

    if (sessionPanel) {
      return sessionPanel;
    }

    switch (activeMode) {
      case 'user-login':
        return renderUserLogin();
      case 'worker-register':
        return renderWorkerRegister();
      case 'worker-login':
        return renderWorkerLogin();
      case 'user-register':
      default:
        return renderUserRegister();
    }
  };

  return (
    <main className="portal-page">
      {authPrompt ? (
        <section className="portal-auth-prompt" role="alert">
          {authPrompt}
        </section>
      ) : null}

      <section className="auth-experience-shell">
        <aside className="auth-showcase-panel">
          <div className="auth-showcase-sheen" />
          <div className="auth-showcase-content">
            <div className="auth-showcase-header">
              <div className="section-badge">{content.showcaseBadge}</div>
            </div>

            <div className="auth-showcase-copyblock">
              <p className="auth-showcase-kicker">ServX</p>
              <h1 className="auth-showcase-title">{content.showcaseTitle}</h1>
              <p className="auth-showcase-copy">{content.showcaseCopy}</p>
            </div>

            <div className="auth-showcase-card-grid">
              <div className="auth-showcase-glasscard auth-showcase-glasscard-primary">
                <p className="auth-showcase-glasslabel">
                  {activeType === 'user' ? 'Customer Workspace' : 'Worker Workspace'}
                </p>
                <h3 className="auth-showcase-glassheading">
                  {activeType === 'user'
                    ? activeAction === 'register'
                      ? 'Create once. Book quicker.'
                      : 'Sign in and move straight to services.'
                    : activeAction === 'register'
                      ? 'Set up once. Go live cleanly.'
                      : 'Sign in and control your status instantly.'}
                </h3>
              </div>

              <div className="auth-showcase-microgrid">
                {showcaseCards.map((card) => (
                  <article key={card.id} className="auth-showcase-mini-card">
                    <p className="auth-showcase-mini-label">{card.label}</p>
                    <h3 className="auth-showcase-mini-title">{card.title}</h3>
                  </article>
                ))}
              </div>
            </div>

            <div className="auth-showcase-actions">
              <a href="/" className="btn-outline auth-showcase-link">
                Explore Home
              </a>
              <button type="button" className="btn-primary" onClick={switchAlternateMode}>
                {content.switchLabel}
              </button>
            </div>
          </div>
        </aside>

        <section className="auth-workspace">
          <div className="auth-workspace-ambient" />
          <div className="auth-workspace-inner">
            <div className="auth-switchboard">
              <div className="auth-switchboard-copy">
                <div className="section-badge">Secure Access</div>
                <h2 className="auth-switchboard-title">
                  {activeType === 'user' ? 'User Access' : 'Worker Access'}
                </h2>
              </div>

              <div className="auth-switchboard-highlights">
                {workspaceHighlights.map((item) => (
                  <article key={item.label} className="auth-switchboard-card">
                    <p className="auth-switchboard-card-label">{item.label}</p>
                    <p className="auth-switchboard-card-value">{item.value}</p>
                  </article>
                ))}
              </div>

              <div className="auth-switchboard-controls">
                <div className="auth-segment" role="tablist" aria-label="Account type">
                  {['user', 'worker'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`auth-segment-chip${activeType === type ? ' is-active' : ''}`}
                      onClick={() => switchType(type)}
                    >
                      {type === 'user' ? 'User Access' : 'Worker Access'}
                    </button>
                  ))}
                </div>

                <div className="auth-segment auth-segment-secondary" role="tablist" aria-label="Auth action">
                  {['register', 'login'].map((action) => (
                    <button
                      key={action}
                      type="button"
                      className={`auth-segment-chip${activeAction === action ? ' is-active' : ''}`}
                      onClick={() => switchAction(action)}
                    >
                      {action === 'register' ? 'Register' : 'Login'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {renderFormPanel()}
          </div>
        </section>
      </section>
    </main>
  );
};

export default AuthHubPage;
