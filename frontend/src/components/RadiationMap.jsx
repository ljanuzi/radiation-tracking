import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Header, Grid, Segment } from 'semantic-ui-react';
import Sidebar from './Sidebar';
import MapView from './MapView';
import 'leaflet/dist/leaflet.css';
import './RadiationMap.css';
import L from 'leaflet';

const RadiationMap = () => {
  const [data, setData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [latestSecond, setLatestSecond] = useState(null);
  const [threshold, setThreshold] = useState(50);
  const [isCustomFetch, setIsCustomFetch] = useState(false);
  const [alert, setAlert] = useState('');
  const [countryNames, setCountryNames] = useState({});
  const [countryBoundary, setCountryBoundary] = useState(null);
  const [countryAverages, setCountryAverages] = useState({});
  const [currentCountry, setCurrentCountry] = useState(null);
  const [highRadiationLocations, setHighRadiationLocations] = useState([]);
  const [initialLoadTime, setInitialLoadTime] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/messages');
        const fetchedData = response.data;
        console.log(fetchData);

        // Determine the most recent captured second
        const mostRecentTime = Math.max(
          ...fetchedData.flatMap(message =>
            message.value.Messages.map(msg => new Date(msg['Captured Second']).getTime())
          )
        );
        setLatestSecond(mostRecentTime);

        // Filter data to include only entries from the most recent second
        const recentData = fetchedData.filter(message =>
          message.value.Messages.some(msg => new Date(msg['Captured Second']).getTime() === mostRecentTime)
        );

        const highRadiationEntries = recentData.flatMap(message =>
          message.value.Messages.flatMap(msg =>
            msg.Entries.filter(entry => entry.Value > threshold).map(entry => ({
              lat: entry.Latitude,
              lon: entry.Longitude,
              value: entry.Value,
              capturedSecond: msg['Captured Second'],
              city: null // Placeholder, will be updated later
            }))
          )
        );

        if (highRadiationEntries.length > 0) {
          setAlert('Radiation value exceeds the threshold!');
          setHighRadiationLocations(highRadiationEntries);
        } else {
          setAlert('');
          setHighRadiationLocations([]);
        }

        setData(recentData);
        if (!initialLoadTime) {
          setInitialLoadTime(new Date());
        }
        await fetchCountryNames(recentData); // Wait for country names to be fetched

      } catch (error) {
        console.error('Error fetching data:', error);
        setData([]);
      }
    };

    if (!isCustomFetch) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [threshold, isCustomFetch, initialLoadTime]);

  const fetchCountryNames = async (data) => {
    const newCountryNames = {};

    for (const message of data) {
      for (const msg of message.value.Messages) {
        for (const entry of msg.Entries) {
          const key = `${entry.Latitude},${entry.Longitude}`;
          if (!countryNames[key]) {
            try {
              const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                params: {
                  format: 'json',
                  lat: entry.Latitude,
                  lon: entry.Longitude,
                },
              });
              if (response.data && response.data.address) {
                const city = response.data.address.city || response.data.address.town || response.data.address.village || 'Unknown';
                newCountryNames[key] = {
                  country: response.data.address.country,
                  city: city
                };
                entry.city = city;  // Attach city to the entry
                updateCountryAverage(response.data.address.country, entry.Value);
                setCurrentCountry(response.data.address.country);
              } else {
                newCountryNames[key] = {
                  country: 'Unknown',
                  city: 'Unknown'
                };
                entry.city = 'Unknown';  // Attach city to the entry
              }
            } catch (error) {
              console.error('Error fetching country name:', error);
              newCountryNames[key] = {
                country: 'Unknown',
                city: 'Unknown'
              };
              entry.city = 'Unknown';  // Attach city to the entry
            }
          }
        }
      }
    }

    setCountryNames(prevState => ({ ...prevState, ...newCountryNames }));

    // Update highRadiationLocations with correct city names
    setHighRadiationLocations(prevLocations => 
      prevLocations.map(location => ({
        ...location,
        city: newCountryNames[`${location.lat},${location.lon}`]?.city || 'Unknown'
      }))
    );
  };

  useEffect(() => {
    const fetchCountryBoundary = async (country) => {
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: {
            country,
            format: 'json',
            polygon_geojson: 1,
          },
        });
        if (response.data && response.data.length > 0) {
          setCountryBoundary(response.data[0].geojson);
          console.log('Fetched country boundary:', response.data[0].geojson);
        } else {
          console.warn('No boundary data found for country:', country);
        }
      } catch (error) {
        console.error('Error fetching country boundary:', error);
      }
    };

    if (currentCountry) {
      fetchCountryBoundary(currentCountry);
    }
  }, [currentCountry]);

  const updateCountryAverage = (country, value) => {
    setCountryAverages(prevState => {
      const current = prevState[country] || { sum: 0, count: 0 };
      const newSum = current.sum + value;
      const newCount = current.count + 1;
      return {
        ...prevState,
        [country]: { sum: newSum, count: newCount, average: newSum / newCount }
      };
    });
  };

  const customIcon = new L.Icon({
    iconUrl: '/radiation_icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  const redIcon = new L.Icon({
    iconUrl: '/radiation_icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  return (
    <Container fluid style={{ padding: '0', height: '100vh', overflow: 'hidden' }}>
      <Header as="h1" textAlign="center" style={{ margin: '20px 0', backgroundColor: '#f5f5f5', padding: '20px' }}>
        Safecast Radiation Data
      </Header>
      <Grid style={{ height: 'calc(100vh - 80px)', margin: '0' }}>
        <Grid.Row style={{ padding: '0' }}>
          <Grid.Column width={4} style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <Sidebar
              threshold={threshold}
              setThreshold={setThreshold}
              alert={alert}
              countryAverages={countryAverages}
              highRadiationLocations={highRadiationLocations}
              initialLoadTime={initialLoadTime}
            />
          </Grid.Column>
          <Grid.Column width={12} style={{ padding: '0' }}>
            <div className="map-container" style={{ height: '100%' }}>
              <MapView
                data={data}
                summaryData={summaryData}
                latestSecond={latestSecond}
                threshold={threshold}
                countryNames={countryNames}
                countryBoundary={countryBoundary}
              />
            </div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
};

export default RadiationMap;
