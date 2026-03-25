const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const getApiUrl = (path) => `${apiBaseUrl}${path}`;

const parseJsonResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
};

export const createBooking = async (booking) => {
  const response = await fetch(getApiUrl('/api/bookings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  });

  return parseJsonResponse(response);
};

export const getWorkerBookings = async (workerId) => {
  const response = await fetch(getApiUrl(`/api/workers/${workerId}/bookings`));
  const payload = await parseJsonResponse(response);

  return payload.bookings || [];
};
