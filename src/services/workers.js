const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const getApiUrl = (path) => `${apiBaseUrl}${path}`;

const parseJsonResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
};

export const listenToWorkers = (onData, onError) => {
  const eventSource = new EventSource(getApiUrl('/api/workers/stream'));

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      onData(payload.workers || []);
    } catch (error) {
      onError(error);
    }
  };

  eventSource.onerror = () => {
    onError(new Error('Unable to connect to the live worker stream.'));
  };

  return () => {
    eventSource.close();
  };
};

export const createWorker = async (worker) => {
  const response = await fetch(getApiUrl('/api/workers'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(worker),
  });

  return parseJsonResponse(response);
};

export const lookupWorkerByPhone = async (phone) => {
  const searchParams = new URLSearchParams({
    phone,
  });

  const response = await fetch(getApiUrl(`/api/workers/login?${searchParams.toString()}`));

  return parseJsonResponse(response);
};

export const toggleWorkerAvailability = async (workerId, available) => {
  const response = await fetch(getApiUrl(`/api/workers/${workerId}/availability`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ available: !available }),
  });

  return parseJsonResponse(response);
};

export const updateWorkerLocation = async (workerId, location) => {
  const response = await fetch(getApiUrl(`/api/workers/${workerId}/location`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(location),
  });

  return parseJsonResponse(response);
};
