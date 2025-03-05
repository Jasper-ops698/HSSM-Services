import React from 'react';
import { Card, CardContent, Typography, Box, Rating } from '@mui/material';

const ServiceCard = ({ service }) => {
  return (
    <Box m={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" component="div">
            {service.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {service.description}
          </Typography>
          <Typography variant="body1" component="p">
            Price: Ksh{service.price}
          </Typography>
          {service.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Rating value={service.rating} readOnly precision={0.5} />
              <Typography variant="caption" ml={1}>
                ({service.numReviews} reviews)
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceCard;