import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Box sx={{ textAlign: 'center', padding: 4 }}>
      <Typography variant="h3" sx={{ marginBottom: 3 }}>Welcome to our Services</Typography>
      <Typography variant="h6" sx={{ marginBottom: 3 }}>Your one-stop solution for cleaning, laundry, and plumbing services.</Typography>
      <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ marginRight: 2 }}>
        Get Started
      </Button>
      <Button variant="outlined" color="primary" component={Link} to="/login">
        Login
      </Button>
    </Box>
  );
};

export default Home;