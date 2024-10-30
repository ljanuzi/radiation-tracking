import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './CustomMarker.css';

const CustomMarker = ({ position, value, capturedSecond, country, city }) => {
  let color;
  if (value > 40) {
    color = 'red';
  } else if (value > 30) {
    color = 'brown';
  } else if (value > 20) {
    color = 'purple';
  } else if (value > 1) {
    color = 'green';
  } else {
    color = 'grey'; // Default color for values <= 1
  }

  const customMarkerIcon = new L.DivIcon({
    html: `<div class="custom-marker" style="color:${color};">X</div>`,
    className: 'custom-marker-container',
    iconSize: [20, 20],
  });

  return (
    <Marker position={position} icon={customMarkerIcon}>
      <Popup>
        <div>
          <p>Value: {value}</p>
          <p>Latitude: {position[0]}</p>
          <p>Longitude: {position[1]}</p>
          <p>Captured Time: {capturedSecond}</p>
          <p>Country: {country || 'Loading...'}</p>
          <p>City: {city || 'Loading...'}</p>
        </div>
      </Popup>
    </Marker>
  );
};

export default CustomMarker;
