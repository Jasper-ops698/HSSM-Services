import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import Footer from './AboutPage';  
import { BubbleChat } from 'flowise-embed-react';

const Home = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main content */}
      <Box sx={{ flex: 1, textAlign: 'center', padding: 4 }}>
        <Typography variant="h3" sx={{ marginBottom: 3 }}>
          Welcome to our Services
        </Typography>
        <Typography variant="h6" sx={{ marginBottom: 3 }}>
          We make work easier.
        </Typography>
        <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ marginRight: 2 }}>
          Get Started
        </Button>
        <Button variant="outlined" color="primary" component={Link} to="/login">
          Login
        </Button>

        {/* Chatbot Integration */}
        <BubbleChat
          chatflowid="ad955aba-c62e-49df-940b-5e8260bf6af2"
          apiHost="http://localhost:3000"
        />
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Home;
