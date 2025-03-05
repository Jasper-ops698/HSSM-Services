import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Stack, CircularProgress, Typography, TextField } from '@mui/material';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Total = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [priceFilter, setPriceFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
              const token = localStorage.getItem('token');
              if (!API_BASE_URL) {
                console.error('API_BASE_URL is not defined');
                return;
              }
              const response = await axios.get(`${API_BASE_URL}/api/services/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setServices(response.data);
              setFilteredServices(response.data);
            } catch (error) {
              console.error('Error fetching services:', error.response ? error.response.data : error.message);
            } finally {
              setIsLoading(false);
            }
        };

        fetchServices();
    }, []);

    useEffect(() => {
        let filtered = services;

        if (priceFilter) {
            filtered = filtered.filter(service => service.price <= priceFilter);
        }

        if (nameFilter) {
            filtered = filtered.filter(service => service.name.toLowerCase().includes(nameFilter.toLowerCase()));
        }

        setFilteredServices(filtered);
    }, [priceFilter, nameFilter, services]);

    return (
        <>
        {isLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '200px' }}>
                    <CircularProgress />
                </Stack>
            ) : (
        <>
            <button onClick={() => window.history.back()} style={{ marginBottom: '16px', padding: '8px 16px', cursor: 'pointer' }}>
                Go Back
            </button>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                    label="Max Price"
                    type="number"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    variant="outlined"
                    size="small"
                />
                <TextField
                    label="Service Name"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    variant="outlined"
                    size="small"
                />
            </Stack>
            <Grid container spacing={3}>
            {Array.isArray(filteredServices) && filteredServices.map((service) => (
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
                            </>
                        )}
                    </div>
                </Grid>
            ))}
            </Grid>
        </>
        )}
        </>
    );
};

export default Total;
