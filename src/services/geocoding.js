const buildReadableAddress = (address, fallback) => {
  if (!address) {
    return fallback;
  }

  const parts = [
    address.road,
    address.neighbourhood || address.suburb || address.hamlet || address.quarter,
    address.city || address.town || address.village || address.county || address.state_district,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);

  const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);

  return uniqueParts.length > 0 ? uniqueParts.join(', ') : fallback;
};

export const reverseGeocodeLocation = async (lat, lng) => {
  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    zoom: '18',
    'accept-language': 'en',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch location details right now.');
  }

  const data = await response.json();
  const fallback = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return buildReadableAddress(data.address, fallback);
};
