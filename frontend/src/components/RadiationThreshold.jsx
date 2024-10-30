import React, { useState } from 'react';
import { Container, Form, Button } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';  // Import useNavigate instead of useHistory

const RadiationThreshold = () => {
  const [threshold, setThreshold] = useState(0);
  const navigate = useNavigate();  // Use useNavigate hook instead of useHistory

  const handleChange = (e) => {
    setThreshold(Number(e.target.value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here, if needed

    // Navigate back to the map page
    navigate('/');
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Form.Field>
          <label>Set Threshold</label>
          <input
            type="number"
            value={threshold}
            onChange={handleChange}
            placeholder="Enter threshold value"
          />
        </Form.Field>
        <Button type="submit" primary>
          Set Threshold
        </Button>
      </Form>
    </Container>
  );
};

export default RadiationThreshold;
