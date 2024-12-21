import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const About = () => {
  return (
    <Container>
      <Typography variant="h3" align="center" gutterBottom>
        About Us
      </Typography>
      <Box mt={4}>
        <Typography variant="h6" paragraph>
          MultiShop Services is committed to providing top-notch services, ensuring your home and business run smoothly. 
        </Typography>
        <Typography variant="body1" color="textSecondary">
          With a dedicated team of professionals, we specialize in cleaning, laundry, and plumbing services. Our goal is to
          deliver convenience and quality at your doorstep.
        </Typography>
      </Box>
    </Container>
  );
};

export default About;