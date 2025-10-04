import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
  Chip
} from '@mui/material';
import { API_BASE_URL } from '../config';

const HodAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/announcements/my-announcements`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnnouncements(response.data.data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
        setError('Failed to fetch announcements. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>My Announcements</Typography>
      {announcements.length === 0 ? (
        <Typography>You have not created any announcements.</Typography>
      ) : (
        <List>
          {announcements.map((announcement, index) => (
            <React.Fragment key={announcement._id}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <ListItem sx={{ py: 1, display: 'block' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {announcement.title}
                      </Typography>
                      <Chip 
                        label={announcement.active ? 'Active' : 'Inactive'} 
                        color={announcement.active ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {announcement.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created on: {new Date(announcement.createdAt).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target Roles: {announcement.targetRoles.join(', ')}
                      </Typography>
                    </Box>
                    {announcement.department && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Department: {announcement.department}
                        </Typography>
                      </Box>
                    )}
                  </ListItem>
                </CardContent>
              </Card>
              {index < announcements.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default HodAnnouncements;
