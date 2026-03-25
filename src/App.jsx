import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import PortalHeader from './components/PortalHeader';
import AuthHubPage from './components/AuthHubPage';
import WorkerDashboardPage from './components/WorkerDashboardPage';
import './index.css';
import { serviceOptions } from './constants/services';
import { reverseGeocodeLocation } from './services/geocoding';
import { loginUserAccount, loginWorkerAccount, registerUserAccount, registerWorkerAccount } from './services/auth';
import { createBooking, getWorkerBookings } from './services/bookings';
import { listenToWorkers, toggleWorkerAvailability, updateWorkerLocation } from './services/workers';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
};

const workerSessionStorageKey = 'servicehub_worker_session';
const userSessionStorageKey = 'servicehub_user_session';
const authIntentStorageKey = 'servicehub_auth_intent';
const normalizeText = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getLocationMatchScore = (address, workerLocation) => {
  const normalizedAddress = normalizeText(address);
  const normalizedWorkerLocation = normalizeText(workerLocation);

  if (!normalizedAddress || !normalizedWorkerLocation) {
    return 0;
  }

  if (normalizedAddress.includes(normalizedWorkerLocation)) {
    return 4;
  }

  const addressTokens = normalizedAddress.split(' ').filter((token) => token.length > 2);
  const workerLocationTokens = normalizedWorkerLocation.split(' ').filter((token) => token.length > 2);
  const sharedTokens = workerLocationTokens.filter((token) => addressTokens.includes(token));

  return sharedTokens.length;
};

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceInKm = (fromLocation, toLocation) => {
  if (!fromLocation || !toLocation) {
    return null;
  }

  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(toLocation.lat - fromLocation.lat);
  const deltaLongitude = toRadians(toLocation.lng - fromLocation.lng);
  const fromLatitude = toRadians(fromLocation.lat);
  const toLatitude = toRadians(toLocation.lat);

  const haversineValue =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * angularDistance;
};

const getMatchedWorkersForBooking = (booking, workers) => {
  if (!booking) {
    return [];
  }

  const sortedWorkers = workers
    .filter((worker) => worker.available && worker.service === booking.service)
    .map((worker) => ({
      ...worker,
      locationScore: getLocationMatchScore(booking.address, worker.location),
      distanceKm:
        booking.locationCoordinates && worker.latitude != null && worker.longitude != null
          ? getDistanceInKm(booking.locationCoordinates, { lat: worker.latitude, lng: worker.longitude })
          : null,
    }))
    .sort((leftWorker, rightWorker) => {
      if (leftWorker.distanceKm != null && rightWorker.distanceKm != null) {
        return leftWorker.distanceKm - rightWorker.distanceKm;
      }

      if (leftWorker.distanceKm != null) {
        return -1;
      }

      if (rightWorker.distanceKm != null) {
        return 1;
      }

      const locationScoreComparison = rightWorker.locationScore - leftWorker.locationScore;

      if (locationScoreComparison !== 0) {
        return locationScoreComparison;
      }

      return leftWorker.name.localeCompare(rightWorker.name);
    });

  const nearestWorkerId = sortedWorkers.find((worker) => worker.distanceKm != null)?.id || null;

  return sortedWorkers.map((worker) => ({
    ...worker,
    isNearest: nearestWorkerId != null ? worker.id === nearestWorkerId : worker === sortedWorkers[0],
    distanceLabel: worker.distanceKm != null ? `${worker.distanceKm.toFixed(1)} km away` : 'Distance unavailable',
  }));
};

const getInitialRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/worker/dashboard') {
    return '/worker/dashboard';
  }

  if (path === '/worker') {
    return '/worker';
  }

  if (path === '/account') {
    return '/account';
  }

  if (path === '/signup') {
    return '/signup';
  }

  return '/';
};

function App() {
  const route = getInitialRoute();
  const [bookingService, setBookingService] = useState('');
  const [bookingLocation, setBookingLocation] = useState(null);
  const [showBookingServiceSelect, setShowBookingServiceSelect] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState('');
  const [workerBookings, setWorkerBookings] = useState([]);
  const [workerBookingsLoading, setWorkerBookingsLoading] = useState(false);
  const [workerBookingsError, setWorkerBookingsError] = useState('');
  const [workerActionId, setWorkerActionId] = useState('');
  const [isRegisteringWorker, setIsRegisteringWorker] = useState(false);
  const [isLoggingInWorker, setIsLoggingInWorker] = useState(false);
  const [workerRegistrationError, setWorkerRegistrationError] = useState('');
  const [workerLoginError, setWorkerLoginError] = useState('');
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const [isLoggingInUser, setIsLoggingInUser] = useState(false);
  const [userRegistrationError, setUserRegistrationError] = useState('');
  const [userLoginError, setUserLoginError] = useState('');
  const [isResolvingBookingAddress, setIsResolvingBookingAddress] = useState(false);
  const [workerSession, setWorkerSession] = useState(() => {
    const savedSession = window.localStorage.getItem(workerSessionStorageKey);

    if (!savedSession) {
      return null;
    }

    try {
      return JSON.parse(savedSession);
    } catch {
      return null;
    }
  });
  const [userSession, setUserSession] = useState(() => {
    const savedSession = window.localStorage.getItem(userSessionStorageKey);

    if (!savedSession) {
      return null;
    }

    try {
      return JSON.parse(savedSession);
    } catch {
      return null;
    }
  });
  const [locationShareState, setLocationShareState] = useState({
    status: 'idle',
    message: 'Sign in and go available to share live worker location.',
  });
  const watchIdRef = useRef(null);
  const lastSentLocationRef = useRef(null);
  const geocodeAbortControllerRef = useRef(null);
  const geocodeRequestIdRef = useRef(0);
  const hasActiveSession = Boolean(userSession || workerSession);
  const hasUserSession = Boolean(userSession);
  const authIntent =
    route === '/signup' || route === '/account' || route === '/worker'
      ? window.sessionStorage.getItem(authIntentStorageKey) || ''
      : '';

  useEffect(() => {
    setWorkersLoading(true);
    setWorkersError('');

    const unsubscribe = listenToWorkers(
      (nextWorkers) => {
        setWorkers(nextWorkers);
        setWorkersLoading(false);
        setWorkersError('');
      },
      (error) => {
        setWorkers([]);
        setWorkersLoading(false);
        setWorkersError(error.message || 'Unable to load workers right now.');
      }
    );

    return unsubscribe;
  }, []);

  const sessionWorker = useMemo(() => {
    if (!workerSession?.id) {
      return null;
    }

    return workers.find((worker) => worker.id === workerSession.id) || null;
  }, [workerSession, workers]);

  const matchedWorkers = useMemo(() => {
    return getMatchedWorkersForBooking(confirmedBooking, workers);
  }, [confirmedBooking, workers]);

  useEffect(() => {
    if (!workerSession) {
      window.localStorage.removeItem(workerSessionStorageKey);
      return;
    }

    window.localStorage.setItem(workerSessionStorageKey, JSON.stringify(workerSession));
  }, [workerSession]);

  useEffect(() => {
    if (!userSession) {
      window.localStorage.removeItem(userSessionStorageKey);
      return;
    }

    window.localStorage.setItem(userSessionStorageKey, JSON.stringify(userSession));
  }, [userSession]);

  useEffect(() => {
    if (!workerSession || workersLoading) {
      return;
    }

    if (!sessionWorker) {
      setWorkerSession(null);
      setWorkerLoginError('Your worker session expired. Please sign in again.');
    }
  }, [workerSession, sessionWorker, workersLoading]);

  useEffect(() => {
    if (!workerSession?.id || route !== '/worker/dashboard') {
      setWorkerBookings([]);
      setWorkerBookingsError('');
      setWorkerBookingsLoading(false);
      return;
    }

    let isActive = true;

    setWorkerBookingsLoading(true);
    setWorkerBookingsError('');

    getWorkerBookings(workerSession.id)
      .then((bookings) => {
        if (!isActive) {
          return;
        }

        setWorkerBookings(bookings);
        setWorkerBookingsLoading(false);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setWorkerBookings([]);
        setWorkerBookingsLoading(false);
        setWorkerBookingsError(error.message || 'Unable to load your customer bookings right now.');
      });

    return () => {
      isActive = false;
    };
  }, [route, workerSession]);

  useEffect(() => {
    if (!workerSession || !sessionWorker?.available) {
      if (watchIdRef.current != null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      lastSentLocationRef.current = null;

      setLocationShareState({
        status: workerSession ? 'paused' : 'idle',
        message: workerSession
          ? 'You are signed in. Go available to share live location with users.'
          : 'Sign in and go available to share live worker location.',
      });
      return undefined;
    }

    if (!navigator.geolocation) {
      setLocationShareState({
        status: 'error',
        message: 'Geolocation is not supported on this device.',
      });
      return undefined;
    }

    setLocationShareState({
      status: 'sharing',
      message: 'Sharing your live location with users while you remain available.',
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const lastSentLocation = lastSentLocationRef.current;
        const distanceMovedKm = lastSentLocation ? getDistanceInKm(lastSentLocation, nextLocation) : null;

        if (distanceMovedKm != null && distanceMovedKm < 0.03) {
          return;
        }

        lastSentLocationRef.current = nextLocation;

        void updateWorkerLocation(sessionWorker.id, {
          latitude: nextLocation.lat,
          longitude: nextLocation.lng,
        })
          .then(() => {
            setLocationShareState({
              status: 'sharing',
              message: 'Live location is updating for users in real time.',
            });
          })
          .catch((error) => {
            setLocationShareState({
              status: 'error',
              message: error.message || 'Unable to update your live location right now.',
            });
          });
      },
      () => {
        setLocationShareState({
          status: 'error',
          message: 'Location permission is required to share your live position while available.',
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sessionWorker, workerSession]);

  const openBooking = (service = '') => {
    setBookingService(service);
    setBookingLocation(null);
    setShowBookingServiceSelect(!service);
    setFormErrors({});
    setConfirmedBooking(null);
    setBookingError('');
    setIsBookingOpen(true);
  };

  const redirectToBookingAuth = () => {
    window.sessionStorage.setItem(authIntentStorageKey, 'booking');
    navigateToSignup();
  };

  const closeBooking = () => {
    geocodeAbortControllerRef.current?.abort();
    geocodeAbortControllerRef.current = null;
    setIsBookingOpen(false);
    setFormErrors({});
    setBookingService('');
    setBookingLocation(null);
    setIsResolvingBookingAddress(false);
    setShowBookingServiceSelect(false);
    setBookingError('');
  };

  const handleServiceSelect = (service) => {
    if (!hasUserSession) {
      redirectToBookingAuth();
      return;
    }

    openBooking(service);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'service') {
      setBookingService(value);
      setFormErrors((currentErrors) => {
        if (!currentErrors.service) {
          return currentErrors;
        }

        return {
          ...currentErrors,
          service: '',
        };
      });

      return;
    }

    setBookingForm((currentForm) => ({
      ...currentForm,
      [name]: value,
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = {
      name: bookingForm.name.trim(),
      phone: bookingForm.phone.trim(),
      address: bookingForm.address.trim(),
    };
    const trimmedService = bookingService.trim();
    const nextErrors = {};

    if (!trimmedService) {
      nextErrors.service = 'Please choose a service.';
    }

    if (!trimmedForm.name) {
      nextErrors.name = 'Please enter your name.';
    }

    if (!trimmedForm.phone) {
      nextErrors.phone = 'Please enter your phone number.';
    }

    if (!trimmedForm.address) {
      nextErrors.address = 'Please enter your address.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const draftBooking = {
      ...trimmedForm,
      service: trimmedService,
      locationCoordinates: bookingLocation ? { lat: bookingLocation.lat, lng: bookingLocation.lng } : null,
    };
    const nextMatchedWorkers = getMatchedWorkersForBooking(draftBooking, workers);
    const assignedWorker = nextMatchedWorkers[0] || null;

    setIsSubmittingBooking(true);
    setBookingError('');

    try {
      const savedBooking = await createBooking({
        assignedWorkerId: assignedWorker?.id || null,
        userId: userSession?.id || null,
        customerName: draftBooking.name,
        customerPhone: draftBooking.phone,
        customerAddress: draftBooking.address,
        service: draftBooking.service,
        locationCoordinates: draftBooking.locationCoordinates,
      });

      setConfirmedBooking({
        ...draftBooking,
        assignedWorkerId: savedBooking.workerId,
        status: savedBooking.status,
        createdAt: savedBooking.createdAt,
        assignedWorkerName: assignedWorker?.name || '',
      });
      setBookingService('');
      setIsResolvingBookingAddress(false);
      setBookingForm(emptyForm);
      setFormErrors({});
    } catch (error) {
      setBookingError(error.message || 'Unable to confirm your booking right now.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleMapLocationSelect = async ({ lat, lng, source = 'map' }) => {
    geocodeAbortControllerRef.current?.abort();
    const nextController = new AbortController();
    geocodeAbortControllerRef.current = nextController;
    const requestId = geocodeRequestIdRef.current + 1;
    geocodeRequestIdRef.current = requestId;

    setBookingLocation({ lat, lng, source });
    setBookingForm((currentForm) => ({
      ...currentForm,
      address: 'Fetching your address...',
    }));

    setFormErrors((currentErrors) => {
      return {
        ...currentErrors,
        address: '',
      };
    });

    setIsResolvingBookingAddress(true);

    try {
      const resolvedAddress = await reverseGeocodeLocation(lat, lng, {
        signal: nextController.signal,
      });

      if (geocodeRequestIdRef.current !== requestId) {
        return;
      }

      setBookingForm((currentForm) => ({
        ...currentForm,
        address: resolvedAddress,
      }));
    } catch (error) {
      if (error.name === 'AbortError' || geocodeRequestIdRef.current !== requestId) {
        return;
      }

      setBookingForm((currentForm) => ({
        ...currentForm,
        address: '',
      }));
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        address: 'Address could not be fetched automatically. Please type your full address manually.',
      }));
    } finally {
      if (geocodeRequestIdRef.current === requestId) {
        setIsResolvingBookingAddress(false);
      }
    }
  };

  const handleExploreServices = () => {
    document.getElementById('services')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleToggleWorkerAvailability = async (workerId, available) => {
    setWorkerActionId(workerId);

    try {
      await toggleWorkerAvailability(workerId, available);
      setWorkersError('');
    } catch (error) {
      setWorkersError(error.message || 'Unable to update worker availability.');
    } finally {
      setWorkerActionId('');
    }
  };

  const handleRegisterWorker = async ({ email, password, workerProfile }) => {
    setIsRegisteringWorker(true);
    setWorkerRegistrationError('');
    setWorkerLoginError('');

    try {
      const worker = await registerWorkerAccount({
        email,
        password,
        workerProfile,
      });

      const nextSession = {
        id: worker.id,
        email,
      };

      setWorkerSession(nextSession);
      window.localStorage.setItem(workerSessionStorageKey, JSON.stringify(nextSession));
      window.location.href = '/worker/dashboard';
      return worker;
    } catch (error) {
      setWorkerRegistrationError(error.message || 'Unable to register the worker account right now.');
      throw error;
    } finally {
      setIsRegisteringWorker(false);
    }
  };

  const handleLoginWorker = async ({ email, password }) => {
    setIsLoggingInWorker(true);
    setWorkerLoginError('');
    setWorkerRegistrationError('');

    try {
      const worker = await loginWorkerAccount({
        email,
        password,
      });

      const nextSession = {
        id: worker.id,
        email,
      };

      setWorkerSession(nextSession);
      window.localStorage.setItem(workerSessionStorageKey, JSON.stringify(nextSession));
      window.location.href = '/worker/dashboard';
      return worker;
    } catch (error) {
      setWorkerLoginError(error.message || 'Unable to sign in worker right now.');
      throw error;
    } finally {
      setIsLoggingInWorker(false);
    }
  };

  const navigateToSignup = () => {
    window.location.href = '/signup';
  };

  const handleLogoutWorker = async (shouldRedirect = true) => {
    if (sessionWorker?.available) {
      try {
        await toggleWorkerAvailability(sessionWorker.id, sessionWorker.available);
      } catch {
        // Preserve logout even if availability update fails.
      }
    }

    setWorkerSession(null);
    setWorkerLoginError('');
    setWorkerRegistrationError('');
    setLocationShareState({
      status: 'idle',
      message: 'Sign in and go available to share live worker location.',
    });

    if (shouldRedirect) {
      navigateToSignup();
    }
  };

  const handleRegisterUser = async ({ email, password }) => {
    setIsRegisteringUser(true);
    setUserRegistrationError('');
    setUserLoginError('');

    try {
      const user = await registerUserAccount({ email, password });
      window.sessionStorage.removeItem(authIntentStorageKey);
      setUserSession(user);
      return user;
    } catch (error) {
      setUserRegistrationError(error.message || 'Unable to create your user account right now.');
      throw error;
    } finally {
      setIsRegisteringUser(false);
    }
  };

  const handleLoginUser = async ({ email, password }) => {
    setIsLoggingInUser(true);
    setUserLoginError('');
    setUserRegistrationError('');

    try {
      const user = await loginUserAccount({ email, password });
      window.sessionStorage.removeItem(authIntentStorageKey);
      setUserSession(user);
      return user;
    } catch (error) {
      setUserLoginError(error.message || 'Unable to login right now.');
      throw error;
    } finally {
      setIsLoggingInUser(false);
    }
  };

  const handleLogoutUser = (shouldRedirect = true) => {
    setUserSession(null);
    setUserLoginError('');
    setUserRegistrationError('');

    if (shouldRedirect) {
      navigateToSignup();
    }
  };

  const handleHeaderAuthAction = async () => {
    if (!hasActiveSession) {
      navigateToSignup();
      return;
    }

    if (workerSession) {
      await handleLogoutWorker(false);
    }

    if (userSession) {
      handleLogoutUser(false);
    }

    navigateToSignup();
  };

  if (route === '/worker/dashboard' && workerSession) {
    return (
      <div style={{ backgroundColor: '#0B0B0B', minHeight: '100vh', color: '#ffffff' }}>
        <PortalHeader activePath="/worker/dashboard" showWorkerDashboard />
        <WorkerDashboardPage
          workerSession={workerSession}
          sessionWorker={sessionWorker}
          workersLoading={workersLoading}
          isUpdatingAvailability={workerActionId === sessionWorker?.id}
          locationShareState={locationShareState}
          bookings={workerBookings}
          bookingsLoading={workerBookingsLoading}
          bookingsError={workerBookingsError}
          onToggleAvailability={handleToggleWorkerAvailability}
          onLogout={handleLogoutWorker}
        />
        <Footer />
      </div>
    );
  }

  if (route === '/worker/dashboard' || route === '/worker' || route === '/account' || route === '/signup') {
    const initialMode =
      authIntent === 'booking'
        ? 'user-login'
        : route === '/worker'
          ? 'worker-register'
          : route === '/worker/dashboard'
            ? 'worker-login'
          : 'user-register';

    return (
      <div style={{ backgroundColor: '#0B0B0B', minHeight: '100vh', color: '#ffffff' }}>
        <PortalHeader
          activePath={route === '/worker/dashboard' ? '/worker/dashboard' : '/signup'}
          showWorkerDashboard={Boolean(workerSession)}
        />
        <AuthHubPage
          authPrompt={
            authIntent === 'booking' ? 'Please login or register first before booking any service.' : ''
          }
          initialMode={initialMode}
          userSession={userSession}
          workerSession={workerSession}
          sessionWorker={sessionWorker}
          workersLoading={workersLoading}
          isRegisteringWorker={isRegisteringWorker}
          isLoggingInWorker={isLoggingInWorker}
          isUpdatingAvailability={workerActionId === sessionWorker?.id}
          workerRegistrationError={workerRegistrationError || workersError}
          workerLoginError={workerLoginError}
          isRegisteringUser={isRegisteringUser}
          isLoggingInUser={isLoggingInUser}
          userRegistrationError={userRegistrationError}
          userLoginError={userLoginError}
          locationShareState={locationShareState}
          onRegisterWorker={handleRegisterWorker}
          onLoginWorker={handleLoginWorker}
          onLogoutWorker={handleLogoutWorker}
          onToggleAvailability={handleToggleWorkerAvailability}
          onRegisterUser={handleRegisterUser}
          onLoginUser={handleLoginUser}
          onLogoutUser={handleLogoutUser}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0B0B0B', minHeight: '100vh', color: '#ffffff' }}>
      <Header
        authActionLabel={hasActiveSession ? 'Logout' : 'Sign Up / Login'}
        onAuthAction={handleHeaderAuthAction}
        onBookNow={() => {
          if (!hasUserSession) {
            redirectToBookingAuth();
            return;
          }

          openBooking();
        }}
      />
      <main>
        <Hero
          onBookNow={() => {
            if (!hasUserSession) {
              redirectToBookingAuth();
              return;
            }

            openBooking();
          }}
          onExploreServices={handleExploreServices}
        />
        <ServicesSection isLocked={!hasUserSession} onServiceSelect={handleServiceSelect} />
        <AboutSection />
      </main>
      <Footer />
      <BookingModal
        isOpen={isBookingOpen}
        selectedService={bookingService}
        showServiceSelect={showBookingServiceSelect}
        serviceOptions={serviceOptions}
        formData={bookingForm}
        formErrors={formErrors}
        confirmedBooking={confirmedBooking}
        matchedWorkers={matchedWorkers}
        submissionError={bookingError}
        isSubmitting={isSubmittingBooking}
        isResolvingAddress={isResolvingBookingAddress}
        selectedLocation={bookingLocation}
        onClose={closeBooking}
        onChange={handleInputChange}
        onLocationPick={handleMapLocationSelect}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default App;
