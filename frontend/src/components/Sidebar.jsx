import React from 'react';
import { Segment, Input, Message, List, Header, Icon, Divider } from 'semantic-ui-react';

const Sidebar = ({ threshold, setThreshold, alert, countryAverages, highRadiationLocations, initialLoadTime }) => {
  const calculateDuration = () => {
    const now = new Date();
    const diffMs = now - initialLoadTime;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  return (
    <Segment raised>
      <div className="threshold-input">
        <label>Threshold: </label>
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          fluid
        />
      </div>
      {alert && <Message color="red" style={{ marginTop: '20px' }}>{alert}</Message>}
      <Divider />
      <div className="country-averages">
        <Header as="h3">Country Radiation Averages</Header>
        <List>
          {Object.entries(countryAverages).map(([country, { average }]) => (
            <List.Item key={country}>
              <Icon name="globe" />
              <List.Content>
                <List.Header>{country}</List.Header>
                <List.Description>Average radiation value is {average.toFixed(2)}</List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>
      </div>
      <Divider />
      <div className="high-radiation-alerts">
        <Header as="h3">High Radiation Alerts</Header>
        <List>
          {highRadiationLocations.map((location, index) => (
            <List.Item key={index}>
              <Icon name="warning sign" color="red" />
              <List.Content>
                <List.Description>
                  Threshold is high for {location.city} at {location.capturedSecond}
                </List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>
      </div>
    </Segment>
  );
};

export default Sidebar;
