const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || '';

const getApiUrl = (path) => `${apiBaseUrl}${path}`;

const buildReadableAddress = (address) => {
  if (!address) {
    return '';
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

  return uniqueParts.join(', ');
};

const resolveFromGeoapify = async (lat, lng) => {
  if (!geoapifyApiKey) {
    throw new Error('Geoapify is not configured on the frontend.');
  }

  const searchParams = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    lang: 'en',
    apiKey: geoapifyApiKey,
  });

  const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${searchParams.toString()}`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to fetch location details right now.');
  }

  const firstResult = payload?.results?.[0] || null;
  const resolvedAddress = buildReadableAddress(firstResult) || firstResult?.formatted || '';

  if (!resolvedAddress.trim()) {
    throw new Error('Unable to fetch location details right now.');
  }

  return resolvedAddress;
};

const resolveFromBackend = async (lat, lng) => {
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

export const reverseGeocodeLocation = async (lat, lng) => {
  try {
    return await resolveFromGeoapify(lat, lng);
  } catch (frontendError) {
    try {
      return await resolveFromBackend(lat, lng);
    } catch {
      throw frontendError;
    }
  }
};
