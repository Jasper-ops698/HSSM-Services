import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

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
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceCard;
