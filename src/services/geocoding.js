const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || '';
const geocodeCache = new Map();

const getApiUrl = (path) => `${apiBaseUrl}${path}`;
const getCacheKey = (lat, lng) => `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;

const fetchJsonWithTimeout = async (url, { timeoutMs = 3500, headers, signal } = {}) => {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    timeoutController.abort(new Error('Request timed out.'));
  }, timeoutMs);

  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(url, {
      headers,
      signal: combinedSignal,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to fetch location details right now.');
    }

    return payload;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

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

const resolveFromGeoapify = async (lat, lng, signal) => {
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

  const payload = await fetchJsonWithTimeout(`https://api.geoapify.com/v1/geocode/reverse?${searchParams.toString()}`, {
    signal,
    timeoutMs: 2600,
  });

  const firstResult = payload?.results?.[0] || null;
  const resolvedAddress = buildReadableAddress(firstResult) || firstResult?.formatted || '';

  if (!resolvedAddress.trim()) {
    throw new Error('Unable to fetch location details right now.');
  }

  return resolvedAddress;
};

const resolveFromBackend = async (lat, lng, signal) => {
  const searchParams = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  const payload = await fetchJsonWithTimeout(getApiUrl(`/api/geocode/reverse?${searchParams.toString()}`), {
    signal,
    timeoutMs: 3200,
  });

  const resolvedAddress = payload.address || payload.displayName || '';

  if (!resolvedAddress.trim()) {
    throw new Error('Unable to fetch location details right now.');
  }

  return resolvedAddress;
};

const resolveFromNominatim = async (lat, lng, signal) => {
  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    zoom: '18',
    'accept-language': 'en',
  });

  const payload = await fetchJsonWithTimeout(`https://nominatim.openstreetmap.org/reverse?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
    signal,
    timeoutMs: 3600,
  });

  const resolvedAddress = buildReadableAddress(payload.address) || payload.display_name || '';

  if (!resolvedAddress.trim()) {
    throw new Error('Unable to fetch location details right now.');
  }

  return resolvedAddress;
};

export const reverseGeocodeLocation = async (lat, lng, options = {}) => {
  const cacheKey = getCacheKey(lat, lng);
  const cachedAddress = geocodeCache.get(cacheKey);

  if (cachedAddress) {
    return cachedAddress;
  }

  try {
    const resolvedAddress = await Promise.any([
      resolveFromGeoapify(lat, lng, options.signal),
      resolveFromBackend(lat, lng, options.signal),
    ]);

    geocodeCache.set(cacheKey, resolvedAddress);
    return resolvedAddress;
  } catch {
    try {
      const resolvedAddress = await resolveFromNominatim(lat, lng, options.signal);
      geocodeCache.set(cacheKey, resolvedAddress);
      return resolvedAddress;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to fetch location details right now.');
    }
  }
};
