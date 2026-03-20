import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import AboutSection from './components/AboutSection';
import WorkersSection from './components/WorkersSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import './index.css';
import {
  createWorker,
  listenToWorkers,
  toggleWorkerAvailability,
} from './services/workers';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
};

const fallbackService = 'General Home Service';

function App() {
  const [selectedService, setSelectedService] = useState('');
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

  const openBooking = (service = selectedService || fallbackService) => {
    setSelectedService(service);
    setFormErrors({});
    setConfirmedBooking(null);
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setFormErrors({});
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    openBooking(service);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

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
      service: selectedService || fallbackService,
    });
    setBookingForm(emptyForm);
    setFormErrors({});
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
        <AboutSection />
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
      </main>
      <Footer />
      <BookingModal
        isOpen={isBookingOpen}
        selectedService={selectedService || fallbackService}
        formData={bookingForm}
        formErrors={formErrors}
        confirmedBooking={confirmedBooking}
        onClose={closeBooking}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default App;
