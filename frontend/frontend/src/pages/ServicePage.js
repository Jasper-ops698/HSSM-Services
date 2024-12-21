import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, MenuItem, Typography, Grid } from '@mui/material';
import axios from 'axios';
import ServiceCard from '../components/ServiceCard';

const ServiceRequestForm = () => {
  const [formData, setFormData] = useState({
    serviceType: '',
    date: '',
    time: '',
    address: '',
    contact: '',
  });
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/api/services');
        setServices(response.data);
      } catch (err) {
        console.error('Error fetching services:', err);
      }
    };

    fetchServices();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted Data:', formData);
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        Request a Service
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          select
          label="Service Type"
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          {services.map((service) => (
            <MenuItem key={service._id} value={service.name}>
              {service.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Time"
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Contact"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Submit Request
        </Button>
      </form>
      <Typography variant="h5" align="center" gutterBottom sx={{ marginTop: 4 }}>
        Available Services
      </Typography>
      <Grid container spacing={2}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service._id}>
            <ServiceCard service={service} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ServiceRequestForm;
