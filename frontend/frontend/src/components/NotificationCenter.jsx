import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 180000); // Poll every 3 minutes
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };


  const handleMarkAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read', {});
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
    handleCloseMenu();
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await api.delete('/api/notifications');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
    handleCloseMenu();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpenMenu}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          <Typography variant="h6" component="div">Notifications</Typography>
        </MenuItem>
        <Divider />
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <MenuItem key={notification._id} sx={{ whiteSpace: 'normal', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold', flex: 1 }}>
                {notification.message}
              </Typography>
              <IconButton size="small" color="error" onClick={() => handleDeleteNotification(notification._id)}>
                <span role="img" aria-label="delete">🗑️</span>
              </IconButton>
            </MenuItem>
          ))
        ) : (
          <MenuItem onClick={handleCloseMenu}>
            <Typography>No new notifications</Typography>
          </MenuItem>
        )}
        <Divider />
        {unreadCount > 0 && (
          <MenuItem onClick={handleMarkAsRead}>
            <Typography color="primary">Mark all as read</Typography>
          </MenuItem>
        )}
        {notifications.length > 0 && (
          <MenuItem onClick={handleDeleteAllNotifications}>
            <Typography color="error">Delete all notifications</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
