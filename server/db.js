import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

const shouldUseDatabase = Boolean(process.env.DATABASE_URL);

const createPool = () => {
  if (!shouldUseDatabase) {
    return null;
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });
};

const pool = createPool();

const memoryWorkers = [
  {
    id: crypto.randomUUID(),
    name: 'Rahul Verma',
    service: 'Electrician',
    location: 'Bangalore',
    phone: '+91 98765 43210',
    available: true,
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: crypto.randomUUID(),
    name: 'Anita Sharma',
    service: 'Plumber',
    location: 'Mumbai',
    phone: '+91 91234 56789',
    available: false,
    createdAt: Date.now() - 1000 * 60 * 20,
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
];

const sortWorkers = (workers) =>
  [...workers].sort((leftWorker, rightWorker) => {
    const updatedComparison = rightWorker.updatedAt - leftWorker.updatedAt;

    if (updatedComparison !== 0) {
      return updatedComparison;
    }

    const serviceComparison = leftWorker.service.localeCompare(rightWorker.service);

    if (serviceComparison !== 0) {
      return serviceComparison;
    }

    return leftWorker.name.localeCompare(rightWorker.name);
  });

const normalizeRow = (row) => ({
  id: row.id,
  name: row.name,
  service: row.service,
  location: row.location,
  phone: row.phone || '',
  available: Boolean(row.available),
  createdAt: row.created_at ? new Date(row.created_at).getTime() : row.createdAt || 0,
  updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : row.updatedAt || 0,
});

export const ensureDatabaseReady = async () => {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      service TEXT NOT NULL,
      location TEXT NOT NULL,
      phone TEXT,
      available BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS phone TEXT;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS workers_service_idx
    ON workers(service);
  `);
};

export const listWorkers = async () => {
  if (!pool) {
    return sortWorkers(memoryWorkers);
  }

  const result = await pool.query(`
    SELECT id, name, service, location, phone, available, created_at, updated_at
    FROM workers
    ORDER BY updated_at DESC, service ASC, name ASC;
  `);

  return result.rows.map(normalizeRow);
};

export const createWorker = async (worker) => {
  const nextWorker = {
    id: crypto.randomUUID(),
    name: worker.name.trim(),
    service: worker.service.trim(),
    location: worker.location.trim(),
    phone: worker.phone?.trim() || '',
    available: Boolean(worker.available),
  };

  if (!pool) {
    const timestamp = Date.now();
    const memoryWorker = {
      ...nextWorker,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryWorkers.unshift(memoryWorker);

    return memoryWorker;
  }

  const result = await pool.query(
    `
      INSERT INTO workers (id, name, service, location, phone, available)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, service, location, phone, available, created_at, updated_at;
    `,
    [nextWorker.id, nextWorker.name, nextWorker.service, nextWorker.location, nextWorker.phone, nextWorker.available]
  );

  return normalizeRow(result.rows[0]);
};

export const updateWorkerAvailability = async (workerId, available) => {
  if (!pool) {
    const currentWorker = memoryWorkers.find((worker) => worker.id === workerId);

    if (!currentWorker) {
      throw new Error('Worker not found.');
    }

    currentWorker.available = Boolean(available);
    currentWorker.updatedAt = Date.now();

    return currentWorker;
  }

  const result = await pool.query(
    `
      UPDATE workers
      SET available = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, service, location, phone, available, created_at, updated_at;
    `,
    [workerId, Boolean(available)]
  );

  if (result.rowCount === 0) {
    throw new Error('Worker not found.');
  }

  return normalizeRow(result.rows[0]);
};

export const hasDatabaseConnection = shouldUseDatabase;
