import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import PortalHeader from './components/PortalHeader';
import AuthHubPage from './components/AuthHubPage';
import './index.css';
import { serviceOptions } from './constants/services';
import { reverseGeocodeLocation } from './services/geocoding';
import { loginUserAccount, loginWorkerAccount, registerUserAccount, registerWorkerAccount } from './services/auth';
import { listenToWorkers, toggleWorkerAvailability, updateWorkerLocation } from './services/workers';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
};

const workerSessionStorageKey = 'servicehub_worker_session';
const userSessionStorageKey = 'servicehub_user_session';

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

const getInitialRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

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
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState('');
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
    if (!confirmedBooking) {
      return [];
    }

    const sortedWorkers = workers
      .filter((worker) => worker.available && worker.service === confirmedBooking.service)
      .map((worker) => ({
        ...worker,
        locationScore: getLocationMatchScore(confirmedBooking.address, worker.location),
        distanceKm:
          confirmedBooking.locationCoordinates && worker.latitude != null && worker.longitude != null
            ? getDistanceInKm(confirmedBooking.locationCoordinates, { lat: worker.latitude, lng: worker.longitude })
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
      isNearest: nearestWorkerId != null && worker.id === nearestWorkerId,
      distanceLabel:
        worker.distanceKm != null
          ? `${worker.distanceKm.toFixed(1)} km away`
          : 'Distance unavailable',
    }));
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
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setFormErrors({});
    setBookingService('');
    setBookingLocation(null);
    setIsResolvingBookingAddress(false);
    setShowBookingServiceSelect(false);
  };

  const handleServiceSelect = (service) => {
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

  const handleSubmit = (event) => {
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

    setConfirmedBooking({
      ...trimmedForm,
      service: trimmedService,
      locationCoordinates: bookingLocation ? { lat: bookingLocation.lat, lng: bookingLocation.lng } : null,
    });
    setBookingService('');
    setIsResolvingBookingAddress(false);
    setBookingForm(emptyForm);
    setFormErrors({});
  };

  const handleMapLocationSelect = async ({ lat, lng, source = 'map' }) => {
    const prefix = source === 'device' ? 'Current device location' : 'Pinned from India map';
    const fallbackAddress = `${prefix}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    setBookingLocation({ lat, lng, source });
    setBookingForm((currentForm) => ({
      ...currentForm,
      address: source === 'device' ? 'Finding your nearby locality...' : fallbackAddress,
    }));

    setFormErrors((currentErrors) => {
      if (!currentErrors.address) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        address: '',
      };
    });

    setIsResolvingBookingAddress(true);

    try {
      const resolvedAddress = await reverseGeocodeLocation(lat, lng);

      setBookingForm((currentForm) => ({
        ...currentForm,
        address: resolvedAddress,
      }));
    } catch {
      setBookingForm((currentForm) => ({
        ...currentForm,
        address: fallbackAddress,
      }));
    } finally {
      setIsResolvingBookingAddress(false);
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

      setWorkerSession({
        id: worker.id,
        email,
      });
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

      setWorkerSession({
        id: worker.id,
        email,
      });
      return worker;
    } catch (error) {
      setWorkerLoginError(error.message || 'Unable to sign in worker right now.');
      throw error;
    } finally {
      setIsLoggingInWorker(false);
    }
  };

  const handleLogoutWorker = async () => {
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
  };

  const handleRegisterUser = async ({ email, password }) => {
    setIsRegisteringUser(true);
    setUserRegistrationError('');
    setUserLoginError('');

    try {
      const user = await registerUserAccount({ email, password });
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
      setUserSession(user);
      return user;
    } catch (error) {
      setUserLoginError(error.message || 'Unable to login right now.');
      throw error;
    } finally {
      setIsLoggingInUser(false);
    }
  };

  const handleLogoutUser = () => {
    setUserSession(null);
    setUserLoginError('');
    setUserRegistrationError('');
  };

  if (route === '/worker' || route === '/account' || route === '/signup') {
    const initialMode =
      route === '/worker' ? 'worker-register' : route === '/account' ? 'user-register' : 'user-register';

    return (
      <div style={{ backgroundColor: '#0B0B0B', minHeight: '100vh', color: '#ffffff' }}>
        <PortalHeader activePath="/signup" />
        <AuthHubPage
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
      <Header onBookNow={() => openBooking()} />
      <main>
        <Hero
          onBookNow={() => openBooking()}
          onExploreServices={handleExploreServices}
        />
        <ServicesSection onServiceSelect={handleServiceSelect} />
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
