import React, { useEffect } from 'react';
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

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
};

const IndiaLocationPicker = ({ selectedLocation, onPick }) => {
  return (
    <div className="booking-map-shell">
      <div className="booking-map-header">
        <p className="booking-map-title">India Map Picker</p>
        <p className="booking-map-copy">Tap anywhere on the map to pin the service location.</p>
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

      <p className="booking-map-hint">
        {selectedLocation
          ? `Selected coordinates: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
          : 'Map is centered on India. Click to choose a location.'}
      </p>
    </div>
  );
};

export default IndiaLocationPicker;
