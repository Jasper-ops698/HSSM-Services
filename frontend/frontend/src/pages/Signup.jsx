import React, { useState } from 'react';
import { TextField, Button, Box, FormControl, Typography, InputLabel, Select, MenuItem } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [role, setRole] = useState('individual');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'individual' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // For loading state
  const navigate = useNavigate();

  // Input change handler
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Role change handler
  const handleRoleChange = (e) => {
    setFormData({ ...formData, role: e.target.value });
    setRole(e.target.value);
  };

  // Form validation
  const validateInputs = () => {
    const { name, email, password } = formData;
    if (!name || !email || !password) {
      setError('All fields are required.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateInputs()) return;

    setLoading(true);
    try {
      await axios.post('http://localhost:4000/api/auth/signup', formData);
      alert('Signup successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          helperText="Password must be at least 6 characters."
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select value={role} onChange={handleRoleChange}>
            <MenuItem value="individual">Individual</MenuItem>
            <MenuItem value="service-provider">Service Provider</MenuItem>
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
      {error && (
        <Typography color="error" sx={{ marginTop: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ marginTop: 2 }}>
        <Link to="/login">Already have an account? Log in</Link>
      </Box>
    </Box>
  );
};

export default SignUp;