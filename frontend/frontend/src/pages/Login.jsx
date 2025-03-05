import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = { 
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const API_BASE_URL = process.env.REACT_APP_API_URL 

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const getDeviceToken = async () => {
      try {
        const currentToken = await getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY });
        if (currentToken) {
          localStorage.setItem('deviceToken', currentToken);
        } else {
          console.warn('No registration token available.');
        }
      } catch (err) {
        console.error('Error retrieving device token:', err);
      }
    };

    getDeviceToken();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

  const validatePassword = (password) => password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(user));

      const deviceToken = localStorage.getItem('deviceToken');
      if (deviceToken) {
        await axios.post(`${API_BASE_URL}/api/auth/device-token`, { userId: user.userId, deviceToken });
      }

      login({ token, user });

      alert('Login successful!');
      switch (user.role) {
        case 'individual':
          navigate('/service');
          break;
        case 'service-provider':
          navigate('/dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'HSSM-provider':
          navigate('/hssm');
          break;
        default:
          throw new Error('Unexpected user role');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'An error occurred during login. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: formData.email });
      if (response.status === 200) {
        alert('Password reset email sent. Please check your inbox.');
      } else {
        setError('Failed to send password reset email. Please try again later.');
      }
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setError('An error occurred while sending the password reset email. Please try again later.');
    }
  };

  const handleShowPassword = () => setShowPassword(!showPassword);

  return (
    <Box sx={{ width: 400, margin: 'auto', padding: 4 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleShowPassword}>
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </IconButton>
            ),
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: 2 }}
          disabled={loading}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </Button>
      </form>
      {error && (
        <Typography color="error" sx={{ marginTop: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <Link to="/signup">Don't have an account? Sign up</Link>
        <Button variant="text" onClick={handleForgotPassword}>
          Forgot password?
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
