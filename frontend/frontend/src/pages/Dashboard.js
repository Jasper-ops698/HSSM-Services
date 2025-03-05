import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import context for managing auth state

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  });
  const [imageFile, setImageFile] = useState(null);

  const [requestStatusFilter, setRequestStatusFilter] = useState('');

  const getAuthToken = () => localStorage.getItem('token'); // Retrieve token from localStorage

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError('No token found');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setRequests(response.data.requests);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCreatedServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError('No token found');
      setIsLoading(false);
      return;
    }

    console.log('Token size:', token.length);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/services/service`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        throw new Error(response.data?.message || 'Unexpected response format');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch created services.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchDashboardData();
      if (user.role === 'service-provider') {
        fetchCreatedServices();
      }
    }
  }, [user, navigate, fetchDashboardData, fetchCreatedServices]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setServiceDetails((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (event) => {
    setImageFile(event.target.files[0]);
  };

  const handleCreateService = async (event) => {
    event.preventDefault();

    if (!serviceDetails.name || !serviceDetails.description || !serviceDetails.price) {
      alert('Please fill in all required fields.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', serviceDetails.name);
      formData.append('description', serviceDetails.description);
      formData.append('price', parseFloat(serviceDetails.price) || 0);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.post(`${API_BASE_URL}/api/services/`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Service created successfully!');
      setServiceDetails({ name: '', description: '', price: '', image: '' });
      setIsModalOpen(false);
      fetchCreatedServices();
    } catch (err) {
      alert('Error creating service. Please try again.');
    }
  };

  const handleEditService = async (event, id) => {
    event.preventDefault();

    if (!serviceDetails.name || !serviceDetails.description || !serviceDetails.price) {
      alert('Please fill in all required fields.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', serviceDetails.name);
      formData.append('description', serviceDetails.description);
      formData.append('price', parseFloat(serviceDetails.price) || 0);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.put(`${API_BASE_URL}/api/services/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Service updated successfully!');
      setServiceDetails({ name: '', description: '', price: '', image: '' });
      setIsModalOpen(false);
      fetchCreatedServices();
    } catch (err) {
      alert('Error updating service. Please try again.');
    }
  };

  const handleStatusChange = async (requestId, status) => {
    const token = getAuthToken();
    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/requests/${requestId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Request status updated successfully!');
      fetchDashboardData();
    } catch (err) {
      alert('Error updating request status. Please try again.');
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const filteredRequests = (requests || []).filter((request) =>
    requestStatusFilter ? request.status === requestStatusFilter : true
  );

  return (
    <Container maxWidth="md" sx={{ backgroundColor: '#f4f4f4', padding: '2rem', borderRadius: '1rem' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#3f51b5', mb: 4 }}>
        My Dashboard
      </Typography>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </div>
      ) : error ? (
        <div>
          <Typography variant="h6" color="error">Error: {error}</Typography>
          <Button variant="contained" onClick={fetchDashboardData}>Try Again</Button>
        </div>
      ) : (
        <>
          <Typography variant="h5" align="center" gutterBottom sx={{ color: '#3f51b5', mb: 4 }}>
            Service Requests
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {Array.isArray(filteredRequests) && filteredRequests.length === 0 ? (
            <Typography variant="h6" align="center">No service requests found.</Typography>
          ) : (
            <Grid container spacing={3}>
              {Array.isArray(filteredRequests) && filteredRequests.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request._id}>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1rem' }}>
                    <img
                      src={request.image || 'fallback-image-url.jpg'}
                      alt={`Service request for ${request.serviceType}`}
                      style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                      onError={(e) => (e.target.src = 'fallback-image-url.jpg')}
                    />
                    <Typography variant="h5">{request.serviceType}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {dayjs(request.date).format('MMM DD, YYYY')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Time: {dayjs(request.time).format('h:mm A')}
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={request.status || ''}
                        onChange={(e) => handleStatusChange(request._id, e.target.value)}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="accepted">Accepted</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </Grid>
              ))}
            </Grid>
          )}

          {user?.role === 'service-provider' && (
            <>
              <Typography variant="h5" align="center" gutterBottom sx={{ color: '#3f51b5', mt: 4, mb: 4 }}>
                Created Services
              </Typography>
              {services.length === 0 ? (
                <Typography variant="h6" align="center">Created services missing.</Typography>
              ) : (
                <Grid container spacing={3}>
                  {services.map((service) => (
                    <Grid item xs={12} sm={6} md={4} key={service._id}>
                      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1rem' }}>
                        <Typography variant="h5">{service.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Description: {service.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: Ksh{service.price}
                        </Typography>
                        <Button onClick={() => {
                          setServiceDetails(service);
                          setIsModalOpen(true);
                        }} variant="contained" color="primary" sx={{ mt: 2, mr: 1 }}>
                          Edit
                        </Button>
                      </div>
                    </Grid>
                  ))}
                </Grid>
              )}
              <Button onClick={() => {
                setServiceDetails({ name: '', description: '', price: '', image: '' });
                setIsModalOpen(true);
              }} variant="contained" sx={{ mt: 3 }}>
                Create Service
              </Button>
            </>
          )}
        </>
      )}

      <Dialog open={isModalOpen} onClose={closeModal}>
        <DialogTitle>{serviceDetails._id ? 'Edit Service' : 'Create a Service'}</DialogTitle>
        <DialogContent>
          <form onSubmit={(event) => serviceDetails._id ? handleEditService(event, serviceDetails._id) : handleCreateService(event)}>
            <TextField
              label="Service Name"
              id="name"
              value={serviceDetails.name}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Short Description"
              id="description"
              value={serviceDetails.description}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Price"
              id="price"
              type="number"
              value={serviceDetails.price}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
              sx={{ mb: 2 }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'block', marginBottom: '1rem' }}
            />
            <DialogActions>
              <Button onClick={closeModal} color="primary">Cancel</Button>
              <Button type="submit" color="primary">{serviceDetails._id ? 'Update Service' : 'Create Service'}</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Dashboard;