import React, { useState, useEffect } from 'react';
import { Container, Form, Button } from 'semantic-ui-react';
import axios from 'axios';

const ThresholdAlerts = ({ setThreshold, setData, setAlerts }) => {
  const [localThreshold, setLocalThreshold] = useState(0);
  const [localAlerts, setLocalAlerts] = useState([]); // Define local alerts state

  const handleThresholdChange = (e) => {
    setLocalThreshold(Number(e.target.value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setThreshold(localThreshold);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/radiation-data');
      const fetchedData = response.data;
      console.log('Fetched Data:', fetchedData); // Debug log

      // Check for alerts
      const highRadiationEntries = [];

      for (const message of fetchedData.Messages) {
        for (const entry of message.Entries) {
          if (entry.Value > localThreshold) {
            highRadiationEntries.push({
              latitude: entry.Latitude,
              longitude: entry.Longitude,
              value: entry.Value
            });
          }
        }
      }

      console.log('High Radiation Entries:', highRadiationEntries); // Debug log

      setAlerts(highRadiationEntries);
      setLocalAlerts(highRadiationEntries); // Update local alerts state
      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(error.message); // Display error message to the user
    }
  };

  useEffect(() => {
    if (localThreshold) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [localThreshold]);

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Form.Field>
          <label>Set Threshold</label>
          <input
            type="number"
            value={localThreshold}
            onChange={handleThresholdChange}
            placeholder="Enter threshold value"
          />
        </Form.Field>
        <Button type="submit" primary>
          Apply
        </Button>
      </Form>

      <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'scroll' }}>
        {localAlerts.length > 0 ? (
          localAlerts.map((alert, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
              <p><strong>Latitude:</strong> {alert.latitude}</p>
              <p><strong>Longitude:</strong> {alert.longitude}</p>
              <p><strong>Value:</strong> {alert.value}</p>
              <p style={{ color: 'red' }}><strong>Above the threshold</strong></p>
            </div>
          ))
        ) : (
          <p>No alerts above the threshold</p>
        )}
      </div>
    </Container>
  );
};

export default ThresholdAlerts;
