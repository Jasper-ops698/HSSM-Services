import React, { useContext, useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // For loading state
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:4000/api/auth/login', formData);
      login(data);
      alert('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response ? err.response.data.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
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
      <Box sx={{ marginTop: 2 }}>
        <Link to="/signup">Don't have an account? Sign up</Link>
      </Box>
    </Box>
  );
};

export default Login;
