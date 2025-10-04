import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const ServiceRequestForm = () => {
  const [formData, setFormData] = useState({
    serviceType: '',
    date: null,
    time: null,
    description: '',
    location: '',
    review: '',
    rating: '',
  });
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [priceFilter, setPriceFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/services/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(response.data)) {
          setServices(response.data);
          setFilteredServices(response.data);
        } else {
          setServices([]);
          setFilteredServices([]);
        }
      } catch (error) {
        console.error('Error fetching services:', error.response ? error.response.data : error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserProfile = () => {
      const storedProfile = JSON.parse(localStorage.getItem('userData'));
      if (storedProfile) {
        setUserProfile(storedProfile);
      }
    };

    fetchServices();
    fetchUserProfile();
  }, []);

  const handleFilterChange = useCallback(() => {
    let filtered = services;
    if (priceFilter) {
      filtered = filtered.filter(service => service.price <= priceFilter);
    }
    if (nameFilter) {
      filtered = filtered.filter(service => service.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }
    setFilteredServices(filtered);
  }, [services, priceFilter, nameFilter]);

  useEffect(() => {
    handleFilterChange();
  }, [priceFilter, nameFilter, handleFilterChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.date || !formData.time || !formData.description || !formData.location) {
      setRequestError('Please fill in all required fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setRequestError('Please log in to submit a request.');
        return;
      }

      const requestData = new FormData();
      requestData.append('serviceType', formData.serviceType);
      requestData.append('date', formData.date);
      requestData.append('time', formData.time);
      requestData.append('description', formData.description);
      requestData.append('location', formData.location);
      requestData.append('userName', userProfile.name);
      requestData.append('userEmail', userProfile.email);
      requestData.append('userPhone', userProfile.phone);
      attachments.forEach((file, index) => {
        requestData.append(`attachments[${index}]`, file);
      });

      // POST request to submit service request
      await axios.post(`${API_BASE_URL}/api/requests/`, requestData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      // Reset form data after submitting request
      setFormData({
        serviceType: '',
        date: null,
        time: null,
        description: '',
        location: '',
        review: '',
        rating: '',
      });
      setAttachments([]);
      setModalOpen(false);
      setRequestError(null);

      // Notify user that the request was successfully submitted
      alert('Service request submitted successfully!');
    } catch (error) {
      setRequestError('An error occurred while submitting the request.');
    }
  };

  const handleReviewSubmit = async (serviceId, review, rating) => {
    if (!review || !rating || rating < 1 || rating > 5) {
      setRequestError('Please provide a valid review and rating (1-5).');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setRequestError('Please log in to submit a review.');
        return;
      }

      const reviewData = { review, rating };

      // POST request to submit review
      await axios.post(`${API_BASE_URL}/api/services/${serviceId}/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Review submitted successfully!');
    } catch (error) {
      setRequestError('An error occurred while submitting the review.');
    }
  };

  return (
    <div>
      {/* Service Request Form */}
      <Button variant="contained" color="primary" onClick={() => setModalOpen(true)} sx={{ mb: 3 }}>
        Request a Service
      </Button>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Request a Service</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '200px' }}>
              <CircularProgress />
            </Stack>
          ) : (
            <form onSubmit={handleSubmit}>
              {requestError && <Typography color="error">{requestError}</Typography>}

              {/* Simple User Profile Information */}
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Name:</strong> {userProfile.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Email:</strong> {userProfile.email}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Phone:</strong> {userProfile.phone}
              </Typography>

              {/* Service Type */}
              <TextField
                select
                label="Service Type"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                fullWidth
                margin="normal"
                variant="outlined"
              >
                {services.map((service) => (
                  <MenuItem key={service._id} value={service.name}>
                    {service.name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Date and Time */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={2}>
                  <DesktopDatePicker
                    label="Date"
                    inputFormat="MM/DD/YYYY"
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                  <TimePicker
                    label="Time"
                    value={formData.time}
                    onChange={(time) => setFormData({ ...formData, time })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Stack>
              </LocalizationProvider>

              {/* Location */}
              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                fullWidth
                margin="normal"
                variant="outlined"
              />

              {/* Description */}
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                margin="normal"
                variant="outlined"
                multiline
                rows={4}
              />

              {/* File Attachments */}
              <TextField
                type="file"
                inputProps={{ multiple: true }}
                onChange={(e) => setAttachments(Array.from(e.target.files))}
                fullWidth
                margin="normal"
                variant="outlined"
              />

              {/* Submit Request */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Filter by Price"
          type="number"
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          variant="outlined"
        />
        <TextField
          label="Filter by Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          variant="outlined"
        />
      </Stack>

      {/* Available Services */}
      <Grid container spacing={3}>
        {filteredServices.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service._id}>
            <div
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                {service.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                {service.description}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Price: Ksh{service.price}
              </Typography>
              {service.image && (
                <>
                  <img
                    src={`data:image/jpeg;base64,${service.image}`}
                    alt={service.name}
                    style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      const review = prompt('Enter your review:');
                      const rating = prompt('Enter your rating (1-5):');
                      if (review && rating) {
                        handleReviewSubmit(service._id, review, rating);
                      }
                    }}
                    sx={{ mt: 2 }}
                  >
                    Submit Review
                  </Button>
                </>
              )}
            </div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ServiceRequestForm;
