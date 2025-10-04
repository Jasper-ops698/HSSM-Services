import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, CircularProgress, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';
import ServiceCard from '../components/ServiceCard';

const Total = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/api/services');
        setServices(data.data || data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch services. Please try again later.');
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Available Services
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600, mx: 'auto', display: 'block' }}
        />
      </Box>

      {filteredServices.length === 0 ? (
        <Typography variant="h6" align="center" color="textSecondary">
          No services found.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredServices.map((service) => (
            <Grid item key={service._id} xs={12} sm={6} md={4} lg={3}>
              <ServiceCard service={service} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Total;