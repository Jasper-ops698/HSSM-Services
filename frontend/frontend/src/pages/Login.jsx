import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import api from '../api';

// --- Firebase Config --- (Ensure your .env variables are loaded correctly)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// --- API URL --- (Ensure your .env variable is loaded correctly)

const Login = () => {
  // Ensure useAuth() provides a 'login' function
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [pendingLogin, setPendingLogin] = useState(null); // Store login data for 2FA retry
  const navigate = useNavigate();

  // --- Firebase Initialization and Device Token ---
  useEffect(() => {
    let app;
    try {
      // Prevent re-initialization if already done elsewhere
      // Note: This basic check might not be robust enough in complex scenarios
      // Consider using a more formal check like getApps().length === 0
      app = initializeApp(firebaseConfig);
    } catch (err) {

      // Optionally get the existing app instance if needed: app = getApp();
    }

    if (app) {
      const messaging = getMessaging(app);

      const requestNotificationPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {

            return true;
          } else {

            return false;
          }
        } catch (err) {

          return false;
        }
      };

      const getDeviceToken = async () => {
        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) return; // Don't try to get token if permission denied

        try {
          const currentToken = await getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY });
          if (currentToken) {

            localStorage.setItem('deviceToken', currentToken);
          } else {

          }
        } catch (err) {

          // Handle specific errors like 'messaging/permission-blocked' if needed
        }
      };

      getDeviceToken();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Basic validation functions
  const validateEmail = (email) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Input Validation ---
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
    setTwoFactorRequired(false);
    setTwoFactorToken('');
    setPendingLogin(null);
    try {
      // --- Login API Call ---
      const response = await api.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/json' },
      });

      // --- Response Validation ---
      // Axios throws for non-2xx status codes, so response.status check might be redundant
      // unless you have specific non-2xx codes you want to handle differently here.
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        // Log the actual response body for debugging if possible

        throw new Error('Received non-JSON response from server. Please contact support.');
      }

      const { token, user } = response.data;

      // --- Data Validation ---
      if (!token || !user || !user.id || !user.role) { // Add checks for essential data

          throw new Error('Authentication failed: Incomplete user data received.');
      }



      // --- Store Auth Details (Redundancy Check) ---
      // Consider if your AuthContext's login function *also* does this.
      // If AuthContext handles persistence, these lines might be removable.
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(user));


      // --- Update Auth Context State ---
      // This is the crucial step for informing the rest of the app.
      login({ token, user }); // Assuming login updates the context state


      // --- Device Token Registration (Optional, after successful login) ---
      const deviceToken = localStorage.getItem('deviceToken');
      if (deviceToken && user.id) { // Ensure user.id exists
        const payload = { userId: user.id, deviceToken };

        try {
            // Make this call non-blocking for the user login flow if possible
            // No need to await if the login doesn't depend on its success
       api.post('/api/auth/device-token', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(deviceTokenResponse => {
                 if (deviceTokenResponse.status === 200) {

                 } else {
                    // Log non-200 success responses if applicable

                 }
            }).catch(err => {
                // Log errors separately, don't let this block login success UX

            });

        } catch (err) {
          // Catch synchronous errors if any (less likely with axios.post)

        }
      } else if (!deviceToken) {

      }


      // --- Navigation (Happens AFTER context update is initiated) ---

      // Using alert is generally bad UX, consider toast notifications
      // alert('Login successful!');

      switch (user.role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'teacher':
          navigate('/manage-classes');
          break;
        case 'credit-controller':
          navigate('/credit-dashboard');
          break;
        case 'HOD':
          navigate('/hod-dashboard');
          break;
        case 'HSSM-provider':
          navigate('/hssm');
          break;
        case 'staff':
          navigate('/waiting-for-role');
          break;
        default:
          console.warn(`Unknown user role: ${user.role}`);
          setError(`Login successful, but role "${user.role}" is not fully configured. Please contact support.`);
          navigate('/dashboard'); // Navigate to general dashboard as fallback
          break;
      }

    } catch (err) {
      // 2FA required branch
      if (err.response && err.response.status === 206 && err.response.data.twoFactorRequired) {
        setTwoFactorRequired(true);
        setPendingLogin({ ...formData, userId: err.response.data.userId });
        setError('Two-factor authentication code required.');
        setLoading(false);
        return;
      }
      // Handle Axios errors specifically
      if (err.response) {
        // Server responded with a status code outside the 2xx range

        setError(err.response.data?.message || `Login failed with status: ${err.response.status}`);
      } else if (err.request) {
        // Request was made but no response received (network error, timeout)
        console.error('Login API No Response:', err.request);
        setError('Network error or server did not respond. Please try again.');
      } else {
        // Something happened in setting up the request or processing the response/logic
        console.error('Login Logic Error:', err.message);
        setError(err.message || 'An unexpected error occurred during login.');
      }
      setLoading(false);
    }
  };

  // Handle 2FA code submission
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: pendingLogin.email,
        password: pendingLogin.password,
        twoFactorToken,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      const { token, user } = response.data;
      login({ token, user });
      setTwoFactorRequired(false);
      setTwoFactorToken('');
      setPendingLogin(null);
      // --- Navigation (Happens AFTER context update is initiated) ---
      console.log(`Navigating based on role: ${user.role}`);
      // Using alert is generally bad UX, consider toast notifications
      // alert('Login successful!');

      switch (user.role) {
        case 'student':
          navigate('/service');
          break;
        case 'staff':
          navigate('/dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'HSSM-provider':
          navigate('/hssm');
          break;
        default:
          navigate('/');
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid two-factor authentication code.');
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password --- (Navigate to dedicated page)
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleShowPassword = () => setShowPassword(!showPassword);

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      // Send the ID token to your backend
  const response = await api.post('/api/auth/google', { idToken });
      const { token, user: backendUser } = response.data;
      // Store token and user info as you do for email/password login
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(backendUser));
      login({ token, user: backendUser });
      
      // Role-based navigation (same as regular login)
      switch (backendUser.role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'HSSM-provider':
          navigate('/hssm');
          break;
        case 'staff':
          navigate('/waiting-for-role');
          break;
        default:
          navigate('/dashboard');
          break;
      }
    } catch (error) {
      setError(error.message || "Google sign-in failed.");
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ p: 2, bgcolor: '#f0f2f5' }} // Light grey background for the page
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 450,
          p: { xs: 2, sm: 4 },
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Login
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ mt: 2, mb: 2 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          startIcon={<img src="https://www.google.com/favicon.ico" alt="Google icon" style={{ width: 20, height: 20 }} />}
        >
          Sign in with Google
        </Button>
        {!twoFactorRequired ? (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleShowPassword} edge="end">
                    {showPassword ? <IoEyeOff /> : <IoEye />}
                  </IconButton>
                ),
              }}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1, mb: 1, textAlign: 'center' }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit}>
            <TextField
              label="2FA Code"
              type="text"
              name="twoFactorToken"
              value={twoFactorToken}
              onChange={e => setTwoFactorToken(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            {error && (
              <Typography color="error" sx={{ mt: 1, mb: 1, textAlign: 'center' }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify 2FA'}
            </Button>
          </form>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2">
            <Link to="/signup">Don't have an account? Sign up</Link>
          </Typography>
          <Button variant="text" size="small" onClick={handleForgotPassword} disabled={loading}>
            Forgot password?
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;