import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Report as ReportIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Done as MarkAsReadIcon,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';

import { rateLimitedRequest } from '../utils/rateLimitedRequest';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HssmProviderDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  // Session timeout: log out after 15 minutes
  useEffect(() => {
    let sessionTimeout;
    sessionTimeout = setTimeout(() => {
      if (logout) logout();
      alert('Your session has expired. Please log in again.');
      navigate('/login');
    }, 15 * 60 * 1000);
    return () => {
      clearTimeout(sessionTimeout);
    };
  }, [logout, navigate]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await rateLimitedRequest({ url: '/api/hssm-provider/dashboard', method: 'get' });
        setDashboardData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await rateLimitedRequest({ url: '/api/hssm-provider/notifications', method: 'get' });
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchDashboardData();
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await rateLimitedRequest({ url: `/api/hssm-provider/notifications/${notificationId}/read`, method: 'put', data: {} });
      setNotifications(prev => prev.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await rateLimitedRequest({ url: '/api/hssm-provider/notifications/mark-all-read', method: 'put', data: {} });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

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

  const KpiCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" color={`${color}.main`}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ArrowForward />}
            onClick={() => navigate(1)}
          >
            Forward
          </Button>
        </Box>
        <Typography variant="h4">
          Health Systems Support Management Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notification Bell */}
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setShowNotifications(!showNotifications)}
              sx={{ color: 'primary.main' }}
            >
              {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
            </IconButton>
            {unreadCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'error.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Box>
            )}
          </Box>
          <Button variant="contained" onClick={() => navigate('/report-center')}>
            Go to Report Center
          </Button>
        </Box>
      </Box>

      {/* Notifications Panel */}
      {showNotifications && (
        <Paper sx={{ p: 2, mb: 3, maxHeight: 400, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                startIcon={<MarkAsReadIcon />}
              >
                Mark All Read
              </Button>
            )}
          </Box>
          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem
                  key={notification._id}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  {!notification.read && (
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification._id)}
                      sx={{ ml: 1 }}
                    >
                      <MarkAsReadIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="High Priority Incidents"
            value={dashboardData?.kpis?.highPriorityIncidents || 0}
            icon={<WarningIcon color="error" />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Overdue Tasks"
            value={dashboardData?.kpis?.overdueTasks || 0}
            icon={<AssignmentIcon color="warning" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Assets"
            value={dashboardData?.kpis?.totalAssets || 0}
            icon={<BusinessIcon color="info" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Active Incidents"
            value={dashboardData?.kpis?.activeIncidents || 0}
            icon={<ReportIcon color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Incidents"
            value={dashboardData?.kpis?.totalIncidents || 0}
            icon={<ReportIcon color="secondary" />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Task Completion Rate"
            value={`${dashboardData?.kpis?.taskCompletionRate || 0}%`}
            icon={<CheckCircleIcon color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Recent Meter Readings"
            value={dashboardData?.kpis?.recentMeterReadings || 0}
            icon={<TrendingUpIcon color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Tasks"
            value={dashboardData?.kpis?.totalTasks || 0}
            icon={<ScheduleIcon color="info" />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Task Completion Progress */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Task Completion Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={dashboardData?.kpis?.taskCompletionRate || 0}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${dashboardData?.kpis?.taskCompletionRate || 0}%`}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Incidents */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Incidents
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recentIncidents?.map((incident) => (
                    <TableRow key={incident._id}>
                      <TableCell>{incident.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={incident.priority}
                          color={getPriorityColor(incident.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{incident.department}</TableCell>
                      <TableCell>
                        <Chip
                          label={incident.status || 'Open'}
                          color={incident.status === 'Closed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent incidents
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Assets */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Assets
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recentAssets?.map((asset) => (
                    <TableRow key={asset._id}>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={asset.category}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{asset.location}</TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No recent assets
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Tasks
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Priority</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.upcomingTasks?.map((task) => (
                    <TableRow key={task._id}>
                      <TableCell>{task.task}</TableCell>
                      <TableCell>{task.assignedTo}</TableCell>
                      <TableCell>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority}
                          color={getPriorityColor(task.priority)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No upcoming tasks
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Analytics Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Analytics Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Asset Categories:
              </Typography>
              {dashboardData?.analytics?.assetCategories?.map((category) => (
                <Box key={category._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{category._id}</Typography>
                  <Chip label={category.count} size="small" />
                </Box>
              )) || <Typography variant="body2">No data available</Typography>}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Task Priorities:
              </Typography>
              {dashboardData?.analytics?.taskPriorities?.map((priority) => (
                <Box key={priority._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{priority._id}</Typography>
                  <Chip label={priority.count} size="small" />
                </Box>
              )) || <Typography variant="body2">No data available</Typography>}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HssmProviderDashboard;
