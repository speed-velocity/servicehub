const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const getApiUrl = (path) => `${apiBaseUrl}${path}`;

export const reverseGeocodeLocation = async (lat, lng) => {
  const searchParams = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  const response = await fetch(getApiUrl(`/api/geocode/reverse?${searchParams.toString()}`));
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch location details right now.');
  }

  const resolvedAddress = payload.address || payload.displayName || '';

  if (!resolvedAddress.trim()) {
    throw new Error('Unable to fetch location details right now.');
  }

  return resolvedAddress;
};
