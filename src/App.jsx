import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import AboutSection from './components/AboutSection';
import WorkersSection from './components/WorkersSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import './index.css';
import { serviceOptions } from './constants/services';
import {
  createWorker,
  listenToWorkers,
  toggleWorkerAvailability,
} from './services/workers';
import { reverseGeocodeLocation } from './services/geocoding';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
};

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

function App() {
  const [selectedService, setSelectedService] = useState('');
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
  const [workerRegistrationError, setWorkerRegistrationError] = useState('');
  const [highlightedWorkerId, setHighlightedWorkerId] = useState('');
  const [isResolvingBookingAddress, setIsResolvingBookingAddress] = useState(false);

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

  useEffect(() => {
    if (!highlightedWorkerId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedWorkerId('');
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedWorkerId]);

  const filteredWorkers = useMemo(() => {
    if (!selectedService) {
      return workers;
    }

    return workers.filter((worker) => worker.service === selectedService);
  }, [selectedService, workers]);

  const matchedWorkers = useMemo(() => {
    if (!confirmedBooking) {
      return [];
    }

    return workers
      .filter((worker) => worker.available && worker.service === confirmedBooking.service)
      .map((worker) => ({
        ...worker,
        locationScore: getLocationMatchScore(confirmedBooking.address, worker.location),
      }))
      .sort((leftWorker, rightWorker) => {
        const locationScoreComparison = rightWorker.locationScore - leftWorker.locationScore;

        if (locationScoreComparison !== 0) {
          return locationScoreComparison;
        }

        return leftWorker.name.localeCompare(rightWorker.name);
      });
  }, [confirmedBooking, workers]);

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
    setSelectedService(service);
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

    const nextErrors = {};
    const trimmedService = bookingService.trim();

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
    });
    setBookingService('');
    setBookingLocation(null);
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

  const handleRegisterWorker = async (worker) => {
    setIsRegisteringWorker(true);
    setWorkerRegistrationError('');

    try {
      const createdWorker = await createWorker(worker);
      setSelectedService(createdWorker.service);
      setHighlightedWorkerId(createdWorker.id);
    } catch (error) {
      setWorkerRegistrationError(error.message || 'Unable to register the worker right now.');
      throw error;
    } finally {
      setIsRegisteringWorker(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0B0B0B', minHeight: '100vh', color: '#ffffff' }}>
      <Header onBookNow={() => openBooking()} />
      <main>
        <Hero
          onBookNow={() => openBooking()}
          onExploreServices={handleExploreServices}
        />
        <ServicesSection onServiceSelect={handleServiceSelect} />
        <WorkersSection
          selectedService={selectedService}
          workers={filteredWorkers}
          isLoading={workersLoading}
          error={workersError}
          workerActionId={workerActionId}
          isRegisteringWorker={isRegisteringWorker}
          registrationError={workerRegistrationError}
          highlightedWorkerId={highlightedWorkerId}
          onRegisterWorker={handleRegisterWorker}
          onToggleAvailability={handleToggleWorkerAvailability}
        />
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
