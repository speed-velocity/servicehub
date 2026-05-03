import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import {
  authenticateUserAccount,
  authenticateWorkerAccount,
  createBookingMessage,
  createBooking,
  createUserAccount,
  createWorkerAccount,
  createWorker,
  assignWorkerToBooking,
  cancelBookingForUser,
  deleteBookingForUser,
  ensureDatabaseReady,
  findWorkerByPhone,
  listBookingMessages,
  listBookingsForUser,
  hasDatabaseConnection,
  listBookingsForWorker,
  listWorkers,
  updateWorkerAvailability,
  updateWorkerLocation,
} from './db.js';

const app = express();
const port = Number(process.env.PORT || 10000);
const clientOrigin = process.env.CLIENT_ORIGIN || true;
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || '';
const subscribers = new Set();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

const buildReadableAddress = (address, fallback) => {
  if (!address) {
    return fallback;
  }

  const parts = [
    address.address_line1 || address.street || address.road || address.pedestrian,
    address.suburb || address.neighbourhood || address.hamlet || address.quarter,
    address.city || address.town || address.village || address.county || address.state_district,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);

  const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);

  return uniqueParts.length > 0 ? uniqueParts.join(', ') : fallback;
};

const reverseGeocodeWithGeoapify = async (lat, lng) => {
  const searchParams = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    lang: 'en',
    apiKey: geoapifyApiKey,
  });

  const geoapifyResponse = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!geoapifyResponse.ok) {
    throw new Error('Unable to resolve location details right now.');
  }

  const payload = await geoapifyResponse.json();
  const firstResult = payload?.results?.[0] || null;
  const fallback = firstResult?.formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return {
    address: buildReadableAddress(firstResult, fallback),
    displayName: firstResult?.formatted || fallback,
  };
};

const reverseGeocodeWithNominatim = async (lat, lng) => {
  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    zoom: '18',
    'accept-language': 'en',
  });

  const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ServiceHub/1.0 (support: servicehub render app)',
    },
  });

  if (!nominatimResponse.ok) {
    throw new Error('Unable to resolve location details right now.');
  }

  const payload = await nominatimResponse.json();
  const fallback = payload.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return {
    address: buildReadableAddress(payload.address, fallback),
    displayName: payload.display_name || fallback,
  };
};

const reverseGeocodeCoordinates = async (lat, lng) => {
  if (geoapifyApiKey) {
    try {
      return await reverseGeocodeWithGeoapify(lat, lng);
    } catch {
      return reverseGeocodeWithNominatim(lat, lng);
    }
  }

  return reverseGeocodeWithNominatim(lat, lng);
};

const sendWorkers = async (response) => {
  const workers = await listWorkers();
  response.write(`data: ${JSON.stringify({ workers })}\n\n`);
};

const broadcastWorkers = async () => {
  const workers = await listWorkers();
  const payload = `data: ${JSON.stringify({ workers })}\n\n`;

  for (const response of subscribers) {
    response.write(payload);
  }
};

const validateWorker = (worker) => {
  const nextErrors = {};

  if (!worker?.name?.trim()) {
    nextErrors.name = 'Name is required.';
  }

  if (!worker?.service?.trim()) {
    nextErrors.service = 'Service is required.';
  }

  if (!worker?.location?.trim()) {
    nextErrors.location = 'Location is required.';
  }

  if (!worker?.phone?.trim()) {
    nextErrors.phone = 'Phone is required.';
  }

  return nextErrors;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateAccountCredentials = (payload) => {
  const nextErrors = {};

  if (!payload?.email?.trim()) {
    nextErrors.email = 'Email is required.';
  } else if (!isValidEmail(payload.email.trim())) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!payload?.password?.trim()) {
    nextErrors.password = 'Password is required.';
  } else if (payload.password.trim().length < 6) {
    nextErrors.password = 'Password must be at least 6 characters.';
  }

  return nextErrors;
};

const validateBookingPayload = (payload) => {
  const nextErrors = {};

  if (!payload?.customerName?.trim()) {
    nextErrors.customerName = 'Customer name is required.';
  }

  if (!payload?.customerPhone?.trim()) {
    nextErrors.customerPhone = 'Customer phone is required.';
  }

  if (!payload?.customerAddress?.trim()) {
    nextErrors.customerAddress = 'Customer address is required.';
  }

  if (!payload?.service?.trim()) {
    nextErrors.service = 'Service is required.';
  }

  return nextErrors;
};

const validateChatPayload = (payload) => {
  const nextErrors = {};

  if (!payload?.actorType?.trim()) {
    nextErrors.actorType = 'Actor type is required.';
  }

  if (!payload?.actorId?.trim()) {
    nextErrors.actorId = 'Actor id is required.';
  }

  if (payload.message !== undefined && !payload?.message?.trim()) {
    nextErrors.message = 'Message is required.';
  }

  return nextErrors;
};

const getErrorStatus = (error, fallbackStatus = 500) => {
  if (error.message?.includes('already exists')) {
    return 409;
  }

  if (error.message === 'Invalid email or password.') {
    return 401;
  }

  return fallbackStatus;
};

app.use(
  cors({
    origin: clientOrigin === true ? true : clientOrigin,
  })
);
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    database: hasDatabaseConnection ? 'postgres' : 'memory',
  });
});

app.get('/api/geocode/reverse', async (request, response) => {
  const lat = Number(request.query.lat);
  const lng = Number(request.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    response.status(400).json({ error: 'Valid lat and lng are required.' });
    return;
  }

  try {
    const result = await reverseGeocodeCoordinates(lat, lng);
    response.json(result);
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to resolve location details right now.' });
  }
});

app.get('/api/workers/login', async (request, response) => {
  const phone = request.query.phone;

  if (!phone) {
    response.status(400).json({ error: 'Phone is required.' });
    return;
  }

  try {
    const worker = await findWorkerByPhone(String(phone));

    if (!worker) {
      response.status(404).json({ error: 'Worker not found for this phone number.' });
      return;
    }

    response.json(worker);
  } catch (error) {
    response.status(500).json({ error: error.message || 'Unable to look up the worker right now.' });
  }
});

app.get('/api/workers', async (_request, response) => {
  try {
    const workers = await listWorkers();
    response.json({ workers });
  } catch (error) {
    response.status(500).json({ error: error.message || 'Unable to load workers.' });
  }
});

app.get('/api/workers/stream', async (request, response) => {
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('Connection', 'keep-alive');
  response.flushHeaders?.();

  subscribers.add(response);

  try {
    await sendWorkers(response);
  } catch (error) {
    response.write(`data: ${JSON.stringify({ error: error.message || 'Unable to load workers.' })}\n\n`);
  }

  const keepAlive = setInterval(() => {
    response.write(': keep-alive\n\n');
  }, 25000);

  request.on('close', () => {
    clearInterval(keepAlive);
    subscribers.delete(response);
    response.end();
  });
});

app.post('/api/workers', async (request, response) => {
  const errors = validateWorker(request.body);

  if (Object.keys(errors).length > 0) {
    response.status(400).json({ error: 'Please complete all worker fields.', errors });
    return;
  }

  try {
    const worker = await createWorker(request.body);
    await broadcastWorkers();
    response.status(201).json(worker);
  } catch (error) {
    response.status(500).json({ error: error.message || 'Unable to create worker.' });
  }
});

app.post('/api/worker-auth/register', async (request, response) => {
  const credentialErrors = validateAccountCredentials(request.body);
  const workerErrors = validateWorker(request.body?.workerProfile);
  const errors = {
    ...credentialErrors,
    ...workerErrors,
  };

  if (Object.keys(errors).length > 0) {
    response.status(400).json({ error: 'Please complete all worker signup fields.', errors });
    return;
  }

  try {
    const worker = await createWorkerAccount({
      email: request.body.email,
      password: request.body.password,
      workerProfile: request.body.workerProfile,
    });

    await broadcastWorkers();
    response.status(201).json(worker);
  } catch (error) {
    response.status(getErrorStatus(error)).json({ error: error.message || 'Unable to register worker account.' });
  }
});

app.post('/api/worker-auth/login', async (request, response) => {
  const credentialErrors = validateAccountCredentials(request.body);

  if (Object.keys(credentialErrors).length > 0) {
    response.status(400).json({ error: 'Email and password are required.', errors: credentialErrors });
    return;
  }

  try {
    const worker = await authenticateWorkerAccount({
      email: request.body.email,
      password: request.body.password,
    });

    response.json(worker);
  } catch (error) {
    response.status(getErrorStatus(error)).json({ error: error.message || 'Unable to login worker right now.' });
  }
});

app.post('/api/user-auth/register', async (request, response) => {
  const credentialErrors = validateAccountCredentials(request.body);

  if (Object.keys(credentialErrors).length > 0) {
    response.status(400).json({ error: 'Email and password are required.', errors: credentialErrors });
    return;
  }

  try {
    const user = await createUserAccount({
      email: request.body.email,
      password: request.body.password,
    });

    response.status(201).json(user);
  } catch (error) {
    response.status(getErrorStatus(error)).json({ error: error.message || 'Unable to create user account.' });
  }
});

app.post('/api/user-auth/login', async (request, response) => {
  const credentialErrors = validateAccountCredentials(request.body);

  if (Object.keys(credentialErrors).length > 0) {
    response.status(400).json({ error: 'Email and password are required.', errors: credentialErrors });
    return;
  }

  try {
    const user = await authenticateUserAccount({
      email: request.body.email,
      password: request.body.password,
    });

    response.json(user);
  } catch (error) {
    response.status(getErrorStatus(error)).json({ error: error.message || 'Unable to login right now.' });
  }
});

app.post('/api/bookings', async (request, response) => {
  const bookingErrors = validateBookingPayload(request.body);

  if (Object.keys(bookingErrors).length > 0) {
    response.status(400).json({ error: 'Please complete all booking fields.', errors: bookingErrors });
    return;
  }

  try {
    const booking = await createBooking({
      assignedWorkerId: request.body.assignedWorkerId,
      userId: request.body.userId,
      customerName: request.body.customerName,
      customerPhone: request.body.customerPhone,
      customerAddress: request.body.customerAddress,
      service: request.body.service,
      locationCoordinates: request.body.locationCoordinates,
    });

    response.status(201).json(booking);
  } catch (error) {
    const status = error.message === 'Worker not found.' ? 404 : 500;
    response.status(status).json({ error: error.message || 'Unable to create booking right now.' });
  }
});

app.patch('/api/bookings/:bookingId/worker', async (request, response) => {
  const userId = request.body.userId;
  const workerId = request.body.workerId;

  if (!userId?.trim() || !workerId?.trim()) {
    response.status(400).json({ error: 'User id and worker id are required.' });
    return;
  }

  try {
    const booking = await assignWorkerToBooking({
      bookingId: request.params.bookingId,
      userId,
      workerId,
    });

    response.json(booking);
  } catch (error) {
    const status =
      error.message === 'Booking not found.'
        ? 404
        : error.message === 'Worker not found.'
          ? 404
          : error.message === 'You cannot update this booking.'
            ? 403
            : error.message === 'Selected worker is not available right now.'
              ? 409
              : error.message === 'Selected worker does not match this service.'
                ? 409
                : error.message === 'Booking id is required.' ||
                    error.message === 'User id is required.' ||
                    error.message === 'Worker id is required.'
                  ? 400
                  : 500;

    response.status(status).json({ error: error.message || 'Unable to assign the worker right now.' });
  }
});

app.patch('/api/bookings/:bookingId/cancel', async (request, response) => {
  const userId = request.body.userId;

  if (!userId?.trim()) {
    response.status(400).json({ error: 'User id is required.' });
    return;
  }

  try {
    const booking = await cancelBookingForUser({
      bookingId: request.params.bookingId,
      userId,
    });

    response.json(booking);
  } catch (error) {
    const status =
      error.message === 'Booking not found.'
        ? 404
        : error.message === 'You cannot update this booking.'
          ? 403
          : error.message === 'Booking id is required.' || error.message === 'User id is required.'
            ? 400
            : 500;

    response.status(status).json({ error: error.message || 'Unable to cancel the booking right now.' });
  }
});

app.delete('/api/bookings/:bookingId', async (request, response) => {
  const userId = request.query.userId;

  if (!userId?.trim()) {
    response.status(400).json({ error: 'User id is required.' });
    return;
  }

  try {
    await deleteBookingForUser({
      bookingId: request.params.bookingId,
      userId: String(userId),
    });

    response.json({ ok: true });
  } catch (error) {
    const status =
      error.message === 'Booking not found.'
        ? 404
        : error.message === 'You cannot update this booking.'
          ? 403
          : error.message === 'Booking id is required.' || error.message === 'User id is required.'
            ? 400
            : 500;

    response.status(status).json({ error: error.message || 'Unable to delete the booking right now.' });
  }
});

app.get('/api/workers/:workerId/bookings', async (request, response) => {
  try {
    const bookings = await listBookingsForWorker(request.params.workerId);
    response.json({ bookings });
  } catch (error) {
    response.status(500).json({ error: error.message || 'Unable to load worker bookings.' });
  }
});

app.get('/api/users/:userId/bookings', async (request, response) => {
  try {
    const bookings = await listBookingsForUser(request.params.userId);
    response.json({ bookings });
  } catch (error) {
    response.status(500).json({ error: error.message || 'Unable to load your bookings.' });
  }
});

app.get('/api/bookings/:bookingId/messages', async (request, response) => {
  const validationErrors = validateChatPayload({
    actorType: request.query.actorType,
    actorId: request.query.actorId,
  });

  if (Object.keys(validationErrors).length > 0) {
    response.status(400).json({ error: 'Chat actor details are required.', errors: validationErrors });
    return;
  }

  try {
    const messages = await listBookingMessages({
      bookingId: request.params.bookingId,
      actorType: String(request.query.actorType),
      actorId: String(request.query.actorId),
    });

    response.json({ messages });
  } catch (error) {
    const status =
      error.message === 'Booking not found.'
        ? 404
        : error.message === 'No worker is assigned to this booking yet.'
          ? 409
          : error.message === 'This booking has been cancelled.'
            ? 409
          : error.message === 'This booking is not linked to a user account.'
            ? 409
            : error.message === 'Invalid actor type.' || error.message === 'Actor id is required.'
              ? 400
          : error.message === 'You cannot access this booking chat.'
            ? 403
            : 500;

    response.status(status).json({ error: error.message || 'Unable to load booking chat right now.' });
  }
});

app.post('/api/bookings/:bookingId/messages', async (request, response) => {
  const validationErrors = validateChatPayload(request.body);

  if (Object.keys(validationErrors).length > 0) {
    response.status(400).json({ error: 'Complete the chat message fields.', errors: validationErrors });
    return;
  }

  try {
    const message = await createBookingMessage({
      bookingId: request.params.bookingId,
      senderType: request.body.actorType,
      senderId: request.body.actorId,
      message: request.body.message,
    });

    response.status(201).json(message);
  } catch (error) {
    const status =
      error.message === 'Message is required.'
        ? 400
        : error.message === 'Booking not found.'
          ? 404
          : error.message === 'No worker is assigned to this booking yet.'
            ? 409
            : error.message === 'This booking has been cancelled.'
              ? 409
            : error.message === 'This booking is not linked to a user account.'
              ? 409
              : error.message === 'Invalid actor type.' || error.message === 'Actor id is required.'
                ? 400
            : error.message === 'You cannot access this booking chat.'
              ? 403
              : 500;

    response.status(status).json({ error: error.message || 'Unable to send your chat message right now.' });
  }
});

app.patch('/api/workers/:workerId/availability', async (request, response) => {
  try {
    const worker = await updateWorkerAvailability(request.params.workerId, request.body.available);
    await broadcastWorkers();
    response.json(worker);
  } catch (error) {
    const status = error.message === 'Worker not found.' ? 404 : 500;
    response.status(status).json({ error: error.message || 'Unable to update worker.' });
  }
});

app.patch('/api/workers/:workerId/location', async (request, response) => {
  const latitude = Number(request.body.latitude);
  const longitude = Number(request.body.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    response.status(400).json({ error: 'Valid latitude and longitude are required.' });
    return;
  }

  try {
    const geocodedLocation = await reverseGeocodeCoordinates(latitude, longitude);
    const worker = await updateWorkerLocation(request.params.workerId, {
      latitude,
      longitude,
      currentLocation: geocodedLocation.address,
    });

    await broadcastWorkers();
    response.json(worker);
  } catch (error) {
    const status = error.message === 'Worker not found.' ? 404 : 500;
    response.status(status).json({ error: error.message || 'Unable to update worker location.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));

  app.use((_request, response) => {
    response.sendFile(path.join(distPath, 'index.html'));
  });
}

ensureDatabaseReady()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
