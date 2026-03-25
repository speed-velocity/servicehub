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

const normalizePhone = (value = '') => value.replace(/[^\d+]/g, '').trim();
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
};

const verifyPassword = (password, passwordHash) => {
  const [salt, storedHash] = passwordHash.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const hashedPassword = crypto.scryptSync(password, salt, 64);

  return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), hashedPassword);
};

const defaultWorkers = [
  {
    name: 'Rahul Verma',
    service: 'Electrician',
    location: 'Bhubaneswar',
    phone: '+919876543210',
    latitude: 20.2961,
    longitude: 85.8245,
    currentLocation: 'Unit 4, Bhubaneswar, Odisha, India',
    lastSeenAt: Date.now() - 1000 * 60 * 2,
    available: true,
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 2,
  },
  {
    name: 'Amit Nayak',
    service: 'Electrician',
    location: 'Bhubaneswar',
    phone: '+919845612347',
    latitude: 20.3158,
    longitude: 85.8232,
    currentLocation: 'Patia, Bhubaneswar, Odisha, India',
    lastSeenAt: Date.now() - 1000 * 60 * 4,
    available: true,
    createdAt: Date.now() - 1000 * 60 * 28,
    updatedAt: Date.now() - 1000 * 60 * 4,
  },
  {
    name: 'Suresh Sahu',
    service: 'Electrician',
    location: 'Cuttack',
    phone: '+919934455667',
    latitude: 20.4625,
    longitude: 85.8828,
    currentLocation: 'Badambadi, Cuttack, Odisha, India',
    lastSeenAt: Date.now() - 1000 * 60 * 6,
    available: true,
    createdAt: Date.now() - 1000 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 6,
  },
  {
    name: 'Anita Sharma',
    service: 'Plumber',
    location: 'Mumbai',
    phone: '+919123456789',
    latitude: null,
    longitude: null,
    currentLocation: '',
    lastSeenAt: 0,
    available: false,
    createdAt: Date.now() - 1000 * 60 * 20,
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
  {
    name: 'Kiran Behera',
    service: 'Plumber',
    location: 'Bhubaneswar',
    phone: '+919811223344',
    latitude: 20.2876,
    longitude: 85.8417,
    currentLocation: 'Rasulgarh, Bhubaneswar, Odisha, India',
    lastSeenAt: Date.now() - 1000 * 60 * 3,
    available: true,
    createdAt: Date.now() - 1000 * 60 * 18,
    updatedAt: Date.now() - 1000 * 60 * 3,
  },
  {
    name: 'Priya Das',
    service: 'Cleaner',
    location: 'Bhubaneswar',
    phone: '+919900112233',
    latitude: 20.3009,
    longitude: 85.8047,
    currentLocation: 'Saheed Nagar, Bhubaneswar, Odisha, India',
    lastSeenAt: Date.now() - 1000 * 60 * 5,
    available: true,
    createdAt: Date.now() - 1000 * 60 * 15,
    updatedAt: Date.now() - 1000 * 60 * 5,
  },
];

const memoryWorkers = defaultWorkers.map((worker) => ({
  id: crypto.randomUUID(),
  ...worker,
  phone: normalizePhone(worker.phone),
}));
const memoryWorkerAccounts = [];
const memoryUserAccounts = [];
const memoryBookings = [];

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
  latitude: row.latitude == null ? null : Number(row.latitude),
  longitude: row.longitude == null ? null : Number(row.longitude),
  currentLocation: row.current_location || row.currentLocation || '',
  lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at).getTime() : row.lastSeenAt || 0,
  available: Boolean(row.available),
  createdAt: row.created_at ? new Date(row.created_at).getTime() : row.createdAt || 0,
  updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : row.updatedAt || 0,
});

const normalizeBookingRow = (row) => ({
  id: row.id,
  workerId: row.worker_id || row.workerId || null,
  userId: row.user_id || row.userId || null,
  customerName: row.customer_name || row.customerName || '',
  customerPhone: row.customer_phone || row.customerPhone || '',
  customerAddress: row.customer_address || row.customerAddress || '',
  service: row.service,
  status: row.status || 'assigned',
  latitude: row.latitude == null ? null : Number(row.latitude),
  longitude: row.longitude == null ? null : Number(row.longitude),
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
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      current_location TEXT,
      last_seen_at TIMESTAMPTZ,
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
    ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS current_location TEXT;
  `);

  await pool.query(`
    ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS worker_accounts (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL UNIQUE REFERENCES workers(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      worker_id TEXT REFERENCES workers(id) ON DELETE SET NULL,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      service TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      status TEXT NOT NULL DEFAULT 'assigned',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS workers_service_idx
    ON workers(service);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS worker_accounts_email_idx
    ON worker_accounts(LOWER(email));
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_email_idx
    ON user_accounts(LOWER(email));
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS bookings_worker_id_idx
    ON bookings(worker_id, created_at DESC);
  `);

  const countResult = await pool.query(`SELECT COUNT(*)::INTEGER AS count FROM workers;`);
  const workerCount = countResult.rows[0]?.count || 0;

  if (workerCount === 0) {
    for (const worker of defaultWorkers) {
      await pool.query(
        `
          INSERT INTO workers (
            id,
            name,
            service,
            location,
            phone,
            latitude,
            longitude,
            current_location,
            last_seen_at,
            available,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW(), NOW());
        `,
        [
          crypto.randomUUID(),
          worker.name,
          worker.service,
          worker.location,
          normalizePhone(worker.phone),
          worker.latitude,
          worker.longitude,
          worker.currentLocation,
          worker.available,
        ]
      );
    }
  }
};

export const listWorkers = async () => {
  if (!pool) {
    return sortWorkers(memoryWorkers);
  }

  const result = await pool.query(`
    SELECT id, name, service, location, phone, latitude, longitude, current_location, last_seen_at, available, created_at, updated_at
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
    phone: normalizePhone(worker.phone),
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
      RETURNING id, name, service, location, phone, latitude, longitude, current_location, last_seen_at, available, created_at, updated_at;
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
      RETURNING id, name, service, location, phone, latitude, longitude, current_location, last_seen_at, available, created_at, updated_at;
    `,
    [workerId, Boolean(available)]
  );

  if (result.rowCount === 0) {
    throw new Error('Worker not found.');
  }

  return normalizeRow(result.rows[0]);
};

export const findWorkerByPhone = async (phone) => {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  if (!pool) {
    return memoryWorkers.find((worker) => normalizePhone(worker.phone) === normalizedPhone) || null;
  }

  const result = await pool.query(
    `
      SELECT id, name, service, location, phone, latitude, longitude, current_location, last_seen_at, available, created_at, updated_at
      FROM workers
      WHERE regexp_replace(COALESCE(phone, ''), '[^0-9+]', '', 'g') = $1
      LIMIT 1;
    `,
    [normalizedPhone]
  );

  return result.rowCount > 0 ? normalizeRow(result.rows[0]) : null;
};

export const updateWorkerLocation = async (workerId, locationUpdate) => {
  const nextLatitude = Number(locationUpdate.latitude);
  const nextLongitude = Number(locationUpdate.longitude);
  const nextCurrentLocation = locationUpdate.currentLocation?.trim() || '';

  if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
    throw new Error('Valid latitude and longitude are required.');
  }

  if (!pool) {
    const currentWorker = memoryWorkers.find((worker) => worker.id === workerId);

    if (!currentWorker) {
      throw new Error('Worker not found.');
    }

    currentWorker.latitude = nextLatitude;
    currentWorker.longitude = nextLongitude;
    currentWorker.currentLocation = nextCurrentLocation;
    currentWorker.lastSeenAt = Date.now();
    currentWorker.updatedAt = Date.now();

    return currentWorker;
  }

  const result = await pool.query(
    `
      UPDATE workers
      SET latitude = $2,
          longitude = $3,
          current_location = $4,
          last_seen_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, service, location, phone, latitude, longitude, current_location, last_seen_at, available, created_at, updated_at;
    `,
    [workerId, nextLatitude, nextLongitude, nextCurrentLocation]
  );

  if (result.rowCount === 0) {
    throw new Error('Worker not found.');
  }

  return normalizeRow(result.rows[0]);
};

export const hasDatabaseConnection = shouldUseDatabase;

export const createBooking = async ({
  assignedWorkerId,
  userId,
  customerName,
  customerPhone,
  customerAddress,
  service,
  locationCoordinates,
}) => {
  const nextBooking = {
    id: crypto.randomUUID(),
    workerId: assignedWorkerId || null,
    userId: userId || null,
    customerName: customerName.trim(),
    customerPhone: normalizePhone(customerPhone),
    customerAddress: customerAddress.trim(),
    service: service.trim(),
    status: assignedWorkerId ? 'assigned' : 'pending',
    latitude:
      locationCoordinates?.lat == null || !Number.isFinite(Number(locationCoordinates.lat))
        ? null
        : Number(locationCoordinates.lat),
    longitude:
      locationCoordinates?.lng == null || !Number.isFinite(Number(locationCoordinates.lng))
        ? null
        : Number(locationCoordinates.lng),
  };

  if (!pool) {
    if (nextBooking.workerId) {
      const assignedWorker = memoryWorkers.find((worker) => worker.id === nextBooking.workerId);

      if (!assignedWorker) {
        throw new Error('Worker not found.');
      }
    }

    const timestamp = Date.now();
    const memoryBooking = {
      ...nextBooking,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryBookings.unshift(memoryBooking);

    return memoryBooking;
  }

  if (nextBooking.workerId) {
    const workerResult = await pool.query(
      `
        SELECT id
        FROM workers
        WHERE id = $1
        LIMIT 1;
      `,
      [nextBooking.workerId]
    );

    if (workerResult.rowCount === 0) {
      throw new Error('Worker not found.');
    }
  }

  const result = await pool.query(
    `
      INSERT INTO bookings (
        id,
        worker_id,
        user_id,
        customer_name,
        customer_phone,
        customer_address,
        service,
        latitude,
        longitude,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, worker_id, user_id, customer_name, customer_phone, customer_address, service, status, latitude, longitude, created_at, updated_at;
    `,
    [
      nextBooking.id,
      nextBooking.workerId,
      nextBooking.userId,
      nextBooking.customerName,
      nextBooking.customerPhone,
      nextBooking.customerAddress,
      nextBooking.service,
      nextBooking.latitude,
      nextBooking.longitude,
      nextBooking.status,
    ]
  );

  return normalizeBookingRow(result.rows[0]);
};

export const listBookingsForWorker = async (workerId) => {
  if (!pool) {
    return memoryBookings
      .filter((booking) => booking.workerId === workerId)
      .sort((leftBooking, rightBooking) => rightBooking.createdAt - leftBooking.createdAt);
  }

  const result = await pool.query(
    `
      SELECT
        id,
        worker_id,
        user_id,
        customer_name,
        customer_phone,
        customer_address,
        service,
        status,
        latitude,
        longitude,
        created_at,
        updated_at
      FROM bookings
      WHERE worker_id = $1
      ORDER BY created_at DESC;
    `,
    [workerId]
  );

  return result.rows.map(normalizeBookingRow);
};

export const createWorkerAccount = async ({ email, password, workerProfile }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password);

  if (!pool) {
    const existingAccount = memoryWorkerAccounts.find((account) => account.email === normalizedEmail);

    if (existingAccount) {
      throw new Error('An account already exists with this email.');
    }

    const worker = await createWorker(workerProfile);
    const account = {
      id: crypto.randomUUID(),
      workerId: worker.id,
      email: normalizedEmail,
      passwordHash,
      createdAt: Date.now(),
    };

    memoryWorkerAccounts.push(account);

    return worker;
  }

  const existingAccount = await pool.query(
    `
      SELECT id
      FROM worker_accounts
      WHERE LOWER(email) = $1
      LIMIT 1;
    `,
    [normalizedEmail]
  );

  if (existingAccount.rowCount > 0) {
    throw new Error('An account already exists with this email.');
  }

  const nextWorkerId = crypto.randomUUID();
  const nextWorker = {
    id: nextWorkerId,
    name: workerProfile.name.trim(),
    service: workerProfile.service.trim(),
    location: workerProfile.location.trim(),
    phone: normalizePhone(workerProfile.phone),
    available: Boolean(workerProfile.available),
  };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const workerResult = await client.query(
      `
        INSERT INTO workers (id, name, service, location, phone, available)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, service, location, phone, latitude, longitude, current_location, last_seen_at, available, created_at, updated_at;
      `,
      [nextWorker.id, nextWorker.name, nextWorker.service, nextWorker.location, nextWorker.phone, nextWorker.available]
    );

    await client.query(
      `
        INSERT INTO worker_accounts (id, worker_id, email, password_hash)
        VALUES ($1, $2, $3, $4);
      `,
      [crypto.randomUUID(), nextWorker.id, normalizedEmail, passwordHash]
    );

    await client.query('COMMIT');

    return normalizeRow(workerResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const authenticateWorkerAccount = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!pool) {
    const account = memoryWorkerAccounts.find((currentAccount) => currentAccount.email === normalizedEmail);

    if (!account || !verifyPassword(password, account.passwordHash)) {
      throw new Error('Invalid email or password.');
    }

    const worker = memoryWorkers.find((currentWorker) => currentWorker.id === account.workerId) || null;

    if (!worker) {
      throw new Error('Invalid email or password.');
    }

    return worker;
  }

  const result = await pool.query(
    `
      SELECT
        worker_accounts.password_hash,
        workers.id,
        workers.name,
        workers.service,
        workers.location,
        workers.phone,
        workers.latitude,
        workers.longitude,
        workers.current_location,
        workers.last_seen_at,
        workers.available,
        workers.created_at,
        workers.updated_at
      FROM worker_accounts
      JOIN workers ON workers.id = worker_accounts.worker_id
      WHERE LOWER(worker_accounts.email) = $1
      LIMIT 1;
    `,
    [normalizedEmail]
  );

  if (result.rowCount === 0) {
    throw new Error('Invalid email or password.');
  }

  const accountRow = result.rows[0];

  if (!verifyPassword(password, accountRow.password_hash)) {
    throw new Error('Invalid email or password.');
  }

  return normalizeRow(accountRow);
};

export const createUserAccount = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password);

  if (!pool) {
    const existingAccount = memoryUserAccounts.find((account) => account.email === normalizedEmail);

    if (existingAccount) {
      throw new Error('An account already exists with this email.');
    }

    const nextAccount = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      createdAt: Date.now(),
    };

    memoryUserAccounts.push(nextAccount);

    return {
      id: nextAccount.id,
      email: nextAccount.email,
    };
  }

  const existingAccount = await pool.query(
    `
      SELECT id
      FROM user_accounts
      WHERE LOWER(email) = $1
      LIMIT 1;
    `,
    [normalizedEmail]
  );

  if (existingAccount.rowCount > 0) {
    throw new Error('An account already exists with this email.');
  }

  const result = await pool.query(
    `
      INSERT INTO user_accounts (id, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email;
    `,
    [crypto.randomUUID(), normalizedEmail, passwordHash]
  );

  return result.rows[0];
};

export const authenticateUserAccount = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!pool) {
    const account = memoryUserAccounts.find((currentAccount) => currentAccount.email === normalizedEmail);

    if (!account || !verifyPassword(password, account.passwordHash)) {
      throw new Error('Invalid email or password.');
    }

    return {
      id: account.id,
      email: account.email,
    };
  }

  const result = await pool.query(
    `
      SELECT id, email, password_hash
      FROM user_accounts
      WHERE LOWER(email) = $1
      LIMIT 1;
    `,
    [normalizedEmail]
  );

  if (result.rowCount === 0) {
    throw new Error('Invalid email or password.');
  }

  const accountRow = result.rows[0];

  if (!verifyPassword(password, accountRow.password_hash)) {
    throw new Error('Invalid email or password.');
  }

  return {
    id: accountRow.id,
    email: accountRow.email,
  };
};
