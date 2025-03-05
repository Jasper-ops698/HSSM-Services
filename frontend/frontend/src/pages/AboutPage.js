import React from 'react';
import { Container, Typography, Box, useMediaQuery } from '@mui/material';

const Footer = () => {
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{
        backgroundColor: '#3f51b5', // Dark blue background color for footer
        color: '#fff', // White text color
        padding: isSmallScreen ? '1rem 0' : '2rem 0', // Adjust padding for small screens
        marginTop: 'auto', // Push the footer to the bottom of the page
        textAlign: 'center', // Center the text inside the footer
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)', // Add subtle shadow for a modern feel
      }}
    >
      <Container>
        <Box>
          <Typography 
            variant={isSmallScreen ? 'body2' : 'body1'} // Adjust text size for small screens
            paragraph
            sx={{
              fontWeight: 400,
              letterSpacing: '0.5px',
            }}
          >
            HSSM Services is committed to providing pocket-friendly, desirable services, to promote an efficient and effective working environment.
          </Typography>
        </Box>
        <Typography 
          variant="body2" 
          color="textSecondary" 
          mt={2}
          sx={{ fontSize: isSmallScreen ? '0.75rem' : '0.875rem' }} // Smaller font on small screens
        >
          &copy; {new Date().getFullYear()} HSSM Services. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
