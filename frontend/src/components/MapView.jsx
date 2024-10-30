import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import CustomMarker from './CustomMarker';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './CustomMarker.css';

const ZoomToBoundary = ({ boundary }) => {
  const map = useMap();

  useEffect(() => {
    if (boundary) {
      const bounds = L.geoJSON(boundary).getBounds();
      map.fitBounds(bounds);
    }
  }, [boundary, map]);

  return null;
};

const MapView = ({ data, summaryData, latestSecond, threshold, countryNames, countryBoundary }) => {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      {countryBoundary && (
        <>
          <GeoJSON data={countryBoundary} style={{ color: 'brown', weight: 2, fillOpacity: 0 }} />
          <ZoomToBoundary boundary={countryBoundary} />
        </>
      )}
      {Array.isArray(data) && data.map((message, msgIndex) => (
        message.value.Messages.filter(msg => new Date(msg['Captured Second']).getTime() === latestSecond).map((msg, subMsgIndex) =>
          msg.Entries.map((entry, entryIndex) => {
            const key = `${entry.Latitude},${entry.Longitude}`;
            return (
              <CustomMarker
                key={`${message.value['Captured Time']}-${msgIndex}-${subMsgIndex}-${entryIndex}`}
                position={[entry.Latitude, entry.Longitude]}
                value={entry.Value}
                capturedSecond={msg['Captured Second']}
                country={countryNames[key]?.country}
                city={countryNames[key]?.city}
              />
            );
          })
        )
      ))}
      {Array.isArray(summaryData) && summaryData.map((entry, index) => {
        const key = `${entry.Latitude},${entry.Longitude}`;
        return (
          <CustomMarker
            key={`${entry.Latitude}-${entry.Longitude}-${index}`}
            position={[entry.Latitude, entry.Longitude]}
            value={entry.Value}
            capturedSecond={entry['Captured Second']}
            country={countryNames[key]?.country}
            city={countryNames[key]?.city}
          />
        );
      })}
    </MapContainer>
  );
};

export default MapView;
