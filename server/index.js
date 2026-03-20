import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import {
  createWorker,
  ensureDatabaseReady,
  hasDatabaseConnection,
  listWorkers,
  updateWorkerAvailability,
} from './db.js';

const app = express();
const port = Number(process.env.PORT || 10000);
const clientOrigin = process.env.CLIENT_ORIGIN || true;
const subscribers = new Set();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

const buildReadableAddress = (address, fallback) => {
  if (!address) {
    return fallback;
  }

  const parts = [
    address.road || address.pedestrian,
    address.neighbourhood || address.suburb || address.hamlet || address.quarter,
    address.city || address.town || address.village || address.county || address.state_district,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);

  const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);

  return uniqueParts.length > 0 ? uniqueParts.join(', ') : fallback;
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

  return nextErrors;
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
      response.status(502).json({ error: 'Unable to resolve location details right now.' });
      return;
    }

    const payload = await nominatimResponse.json();
    const fallback = payload.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    response.json({
      address: buildReadableAddress(payload.address, fallback),
      displayName: payload.display_name || fallback,
    });
  } catch (error) {
    response.status(500).json({ error: error.message || 'Unable to resolve location details right now.' });
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
