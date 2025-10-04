import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: 2,
      }}
    >
      <Typography variant="h4" color="error" gutterBottom>
        Access Restricted
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        It looks like your account doesn't have the necessary permissions to view that page.
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 3 }}>
        If you recently created a staff account, an administrator will assign your role shortly. If this seems unexpected, please contact your administrator.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/') }>
          Go to Home
        </Button>
        <Button variant="outlined" color="primary" onClick={handleGoToLogin}>
          Log in / Switch Account
        </Button>
      </Box>
    </Box>
  );
};

export default UnauthorizedPage;
