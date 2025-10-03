import React, { useEffect, useState } from 'react';
import assetUrl from '../utils/assetUrl';
import api from '../api';
import {
    Grid,
    Stack,
    CircularProgress,
    Typography,
    TextField,
    Card,          // Use Card for better structure and elevation
    CardContent,   // For text content within the card
    CardMedia,     // Optimized for displaying media like images
    Container,     // Provides basic layout constraints
    Box,           // General purpose layout component
    Button,        // Use MUI Button
    InputAdornment,// To add 'Ksh' prefix to price
    Alert          // For displaying errors
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Icon for back button

// Ensure API_BASE_URL has a fallback for local development if .env is not set
const FALLBACK_IMAGE_URL = assetUrl('/uploads/placeholder-image.png');

const renderImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE_URL;
    if (imagePath.startsWith('data:image')) return imagePath;
    const cleanPath = imagePath.replace(/^uploads\/+/, '');
    return assetUrl(`/uploads/${cleanPath}`);
};

const Total = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(''); // State for handling fetch errors
    const [priceFilter, setPriceFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');


    const fetchServices = async () => {
        setIsLoading(true);
        setError(''); // Clear previous errors
            try {
            const response = await api.get('/api/services/');
            setServices(response.data || []); // Ensure it's an array
            setFilteredServices(response.data || []);
        } catch (err) {
            console.error('Error fetching services:', err.response ? err.response.data : err.message);
            setError(`Failed to fetch services: ${err.response?.data?.message || err.message}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchServices();
    }, []); // Fetch only on initial mount

    useEffect(() => {
        // Apply filters whenever filters or the base services list change
        let filtered = services;

        // Filter by maximum price (only if priceFilter is a valid number)
        const maxPrice = parseFloat(priceFilter);
        if (!isNaN(maxPrice) && maxPrice >= 0) {
            filtered = filtered.filter(service => service.price <= maxPrice);
        }

        // Filter by name (case-insensitive)
        if (nameFilter.trim()) { // Check if nameFilter has non-whitespace content
            filtered = filtered.filter(service =>
                service.name.toLowerCase().includes(nameFilter.trim().toLowerCase())
            );
        }

        setFilteredServices(filtered);
    }, [priceFilter, nameFilter, services]);

    // Handler for name filter with debounce (optional)
    const handleNameFilterChange = (event) => {
        setNameFilter(event.target.value);
    };
    // Example of debounced handler if needed for performance:
    // const debouncedNameFilter = useCallback(debounce(setNameFilter, 300), []);
    // onChange={(e) => debouncedNameFilter(e.target.value)} instead of direct setNameFilter


    return (
        <Container maxWidth="lg" sx={{ py: 3 }}> {/* Add padding */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => window.history.back()}
                variant="outlined"
                sx={{ mb: 3 }} // Add margin bottom
            >
                Go Back
            </Button>

            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Available Services
            </Typography>

            {/* Filters Section */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2, // Spacing between filter fields
                    mb: 4,  // Margin below filters
                    flexWrap: 'wrap' // Allow filters to wrap on smaller screens
                }}
            >
                <TextField
                    label="Max Price"
                    type="number"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: <InputAdornment position="start">Ksh</InputAdornment>,
                        inputProps: { min: 0 } // Prevent negative numbers
                    }}
                    sx={{ minWidth: '150px' }} // Ensure minimum width
                />
                <TextField
                    label="Filter by Service Name"
                    value={nameFilter}
                    onChange={handleNameFilterChange} // Use handler (debounced if needed)
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: '250px' }} // Ensure minimum width
                />
            </Box>

            {/* Loading State */}
            {isLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '40vh' }}>
                    <CircularProgress size={60} />
                    <Typography sx={{ mt: 2 }}>Loading Services...</Typography>
                </Stack>
            ) : error ? ( // Error State
                 <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                    <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: '600px' }}>
                        {error}
                    </Alert>
                    <Button variant="contained" onClick={fetchServices}>
                        Retry
                    </Button>
                </Box>
            ) : ( // Content Display
                <>
                    {/* Service Grid */}
                    {Array.isArray(filteredServices) && filteredServices.length > 0 ? (
                        <Grid container spacing={3}>
                            {filteredServices.map((service) => (
                                <Grid item xs={12} sm={6} md={4} key={service._id}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={renderImageUrl(service.image || service.imagePath)}
                                            alt={service.name}
                                            sx={{ 
                                                objectFit: 'cover',
                                                backgroundColor: 'background.paper',
                                            }}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = FALLBACK_IMAGE_URL;
                                            }}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'medium' }} noWrap title={service.name}>
                                                {service.name || 'Unnamed Service'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {service.description || 'No description available.'}
                                            </Typography>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                                Ksh {service.price != null ? service.price.toLocaleString() : 'N/A'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        // No Results Message
                        <Typography sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic' }}>
                            No services match the current filters.
                        </Typography>
                    )}
                </>
            )}
        </Container>
    );
};

export default Total;