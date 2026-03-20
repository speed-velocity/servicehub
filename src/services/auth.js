const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const getApiUrl = (path) => `${apiBaseUrl}${path}`;

const parseJsonResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
};

const postJson = async (path, body) => {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse(response);
};

export const registerWorkerAccount = async ({ email, password, workerProfile }) =>
  postJson('/api/worker-auth/register', {
    email,
    password,
    workerProfile,
  });

export const loginWorkerAccount = async ({ email, password }) =>
  postJson('/api/worker-auth/login', {
    email,
    password,
  });

export const registerUserAccount = async ({ email, password }) =>
  postJson('/api/user-auth/register', {
    email,
    password,
  });

export const loginUserAccount = async ({ email, password }) =>
  postJson('/api/user-auth/login', {
    email,
    password,
  });
