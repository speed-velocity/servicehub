import React, { useCallback, useEffect, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const indiaCenter = [22.5937, 78.9629];

const MapResizeFix = () => {
  const map = useMap();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map]);

  return null;
};

const MapViewportController = ({ selectedLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }

    map.flyTo([selectedLocation.lat, selectedLocation.lng], 16, {
      animate: true,
      duration: 1.2,
    });
  }, [map, selectedLocation]);

  return null;
};

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
        source: 'map',
      });
    },
  });

  return null;
};

const IndiaLocationPicker = ({ selectedLocation, onPick }) => {
  const [locationState, setLocationState] = useState({
    status: 'idle',
    message: 'Turn on device location and use the map to choose your service address.',
  });

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState({
        status: 'error',
        message: 'Device location is not supported in this browser. You can still pick manually on the map.',
      });
      return;
    }

    setLocationState({
      status: 'loading',
      message: 'Finding your current location...',
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onPick({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'device',
        });

        setLocationState({
          status: 'success',
          message: 'Current device location detected. You can also tap elsewhere on the map to adjust it.',
        });
      },
      () => {
        setLocationState({
          status: 'error',
          message: 'Location access was unavailable. You can still tap anywhere on the India map to choose manually.',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [onPick]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      requestCurrentLocation();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [requestCurrentLocation]);

  return (
    <div className="booking-map-shell">
      <div className="booking-map-header">
        <div>
          <p className="booking-map-title">India Map Picker</p>
          <p className="booking-map-copy">If location access is on, the map will jump to your precise device area.</p>
        </div>
        <button
          type="button"
          className="booking-map-locate-btn"
          onClick={requestCurrentLocation}
        >
          Use My Current Location
        </button>
      </div>

      <div className="booking-map-frame">
        <MapContainer
          center={indiaCenter}
          zoom={4}
          minZoom={4}
          scrollWheelZoom={true}
          className="booking-map"
        >
          <MapResizeFix />
          <MapViewportController selectedLocation={selectedLocation} />
          <MapClickHandler onPick={onPick} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedLocation ? (
            <CircleMarker
              center={[selectedLocation.lat, selectedLocation.lng]}
              radius={10}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.85,
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <p className={`booking-map-hint booking-map-hint-${locationState.status}`}>
        {locationState.status === 'loading'
          ? locationState.message
          : selectedLocation
            ? `Selected coordinates: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
            : locationState.message}
      </p>
    </div>
  );
};

export default IndiaLocationPicker;
