import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Container } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import RadiationMap from '../components/RadiationMap';

const AppRouter = () => {

  return (
    <Router>
      <Container>
        <Routes>
          <Route path="/" element={<RadiationMap />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default AppRouter;