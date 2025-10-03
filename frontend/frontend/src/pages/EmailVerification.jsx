import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import { API_BASE_URL } from '../config';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/verify-email?token=${token}`);
        const { token: authToken, user } = response.data;

        // Store auth data
        localStorage.setItem('token', authToken);
        localStorage.setItem('userData', JSON.stringify(user));

        // Update auth context
        login({ token: authToken, user });

        setStatus('success');
        setMessage('Email verified successfully! Redirecting...');

        // Redirect based on role after a short delay
        setTimeout(() => {
          if (user.role === 'student') {
            navigate('/student-dashboard');
          } else if (user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 2000);

      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, login]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
      }}
    >
      {status === 'verifying' && (
        <>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Verifying your email...</Typography>
        </>
      )}

      {status === 'success' && (
        <Alert severity="success" sx={{ maxWidth: 500 }}>
          <Typography variant="h6">Email Verified!</Typography>
          <Typography>{message}</Typography>
        </Alert>
      )}

      {status === 'error' && (
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6">Verification Failed</Typography>
          <Typography>{message}</Typography>
        </Alert>
      )}
    </Box>
  );
};

export default EmailVerification;
