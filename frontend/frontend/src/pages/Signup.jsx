import React, { useState } from 'react';
import { TextField, Button, Box, FormControl, Typography, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { IoEyeOff, IoEye } from 'react-icons/io5';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL


const SignUp = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'individual' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Input change handler
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Form validation
  const validateInputs = () => {
    const { name, email, phone, password } = formData;
    if (!name || !email || !phone || !password) {
      return 'All fields are required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const errorMessage = validateInputs();
    if (errorMessage) {
      setErrorMessage(errorMessage);
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/signup`, formData);
      alert('Signup successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ width: 400, margin: 'auto', padding: 4 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          error={Boolean(errorMessage && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))}
        />
        <TextField
          label="Contact Number"
          name="phone"
          value={formData.phone}
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
              <IconButton onClick={handleShowPassword} aria-label="toggle password visibility">
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </IconButton>
            ),
          }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
          >
            <MenuItem value="individual">Individual</MenuItem>
            <MenuItem value="service-provider">Service Provider</MenuItem>
            <MenuItem value="HSSM-provider">HSSM Provider</MenuItem>
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: 2 }}
          disabled={loading}
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </Button>
      </form>
      {errorMessage && (
        <Typography color="error" sx={{ marginTop: 2 }}>
          {errorMessage}
        </Typography>
      )}
      <Box sx={{ marginTop: 2 }}>
        <Link to="/login">Already have an account? Log in</Link>
      </Box>
    </Box>
  );
};

export default SignUp;
