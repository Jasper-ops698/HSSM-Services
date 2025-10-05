import React, { useState, useEffect, useCallback } from 'react';
import { rateLimitedRequest } from '../utils/rateLimitedRequest';
import { getWeekNumber } from '../utils/weekUtils';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Receipt,
  HourglassEmpty,
  CheckCircle,
  Notifications,
  CalendarToday,
  LocationOn,
  Close,
  AccessTime,
  Person,
  Group,
  School,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentAbsenceModal from '../components/models/StudentAbsenceModal';
import socket from '../socket';
import api from '../api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Small time formatter: accepts 'HH:mm' or 'HH:mm:ss' or ISO-time and returns locale short time
  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    try {
      const t = timeStr.length <= 8 && /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)
        ? new Date(`1970-01-01T${timeStr}`)
        : new Date(timeStr);
      if (isNaN(t.getTime())) return timeStr;
      return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };
  // Determine class/timetable entry status using UTC-normalized times
  const getEntryStatus = (entry) => {
    try {
      const nowMs = Date.now();
      const now = new Date();
      const baseDateUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const parseTimeUTC = (t) => {
        if (!t) return null;
        const parts = t.split(':').map(p => parseInt(p, 10));
        return new Date(Date.UTC(baseDateUTC.getUTCFullYear(), baseDateUTC.getUTCMonth(), baseDateUTC.getUTCDate(), parts[0] || 0, parts[1] || 0, parts[2] || 0));
      };
      const start = parseTimeUTC(entry.startTime || entry.start);
      const end = parseTimeUTC(entry.endTime || entry.end);
      if (!start || !end) return 'not-started';
      const windowStartMs = start.getTime() - 30 * 60 * 1000;
      const windowEndMs = end.getTime() + 30 * 60 * 1000;
      if (nowMs >= windowStartMs && nowMs <= windowEndMs) return 'in-progress';
      if (nowMs > windowEndMs) return 'done';
      return 'not-started';
    } catch (e) {
      return 'not-started';
    }
  };
  const [dashboardData, setDashboardData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAbsenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsModalOpen, setAnnouncementsModalOpen] = useState(false);

  // Timetable state
  const [timetableData, setTimetableData] = useState(null);
  const [todayTimetable, setTodayTimetable] = useState(null);
  const [todayTimetableError, setTodayTimetableError] = useState('');
  const [timetableView, setTimetableView] = useState('today'); // 'today' or 'week'
  // Holds enrollment state reported by server via sockets to avoid extra fetches
  const [serverEnrollments, setServerEnrollments] = useState({});

  // ...existing code...

  const getCreditColor = (credits) => {
    const numCredits = credits ?? 0;
    if (numCredits < 10) return '#d32f2f';
    if (numCredits < 50) return '#f57c00';
    return '#2e7d32';
  };

  const getCreditBackgroundColor = (credits) => {
    const numCredits = credits ?? 0;
    if (numCredits < 10) return '#ffebee';
    if (numCredits < 50) return '#fff3e0';
    return '#e8f5e8';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const dashboardRes = await api.get('/api/dashboard');
      const data = dashboardRes.data.data;
      setKpiData(data.kpi || {
        credits: 0,
        enrolledClasses: 0,
        pendingEnrollments: 0,
        approvedEnrollments: 0
      });
      setDashboardData(data);

      const announcementsRes = await api.get('/api/announcements');
      setAnnouncements(announcementsRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);




  // Week calculation: use shared helper so teacher/student dashboards use the same logic.
  // The helper expects an optional term start date (string or Date). For students we don't currently
  // pass a termStartDate, so it falls back to Jan 1 of the current year.
  // Backend and frontend should agree on week numbering for consistent timetable results.
  const fetchTimetableData = useCallback(async () => {
    try {
      let response = await api.get(`/api/timetable/student`);
      const data = response?.data || {};
      const hasTimetable = data.timetable && Object.keys(data.timetable).length > 0;
      const enrolledCount = Array.isArray(data.enrolledClasses) ? data.enrolledClasses.length : 0;

      if (!hasTimetable && enrolledCount > 0) {
        const week = getWeekNumber();
        try {
          const retryRes = await api.get(`/api/timetable/student`, { params: { week } });
          if (retryRes?.data) {
            response = retryRes;
          }
        } catch (e) {
          console.warn('Fallback timetable fetch failed:', e);
        }
      }

      setTimetableData(response?.data || null);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setTimetableData(null);
    }
  }, []);

  const fetchTodayTimetable = useCallback(async () => {
    try {
      setTodayTimetable(null);
      setTodayTimetableError('');
      const res = await api.get(`/api/timetable/today`);
      setTodayTimetable(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching today's timetable:", err);
      setTodayTimetable([]);
      setTodayTimetableError('Unable to load today\'s timetable.');
    }
  }, []);

  // Listen for enrollment-related socket events and refresh data when they occur
  useEffect(() => {
    socket.on('enrollment_updated', (payload) => {
      // payload may contain { studentId, classId, status, studentName, className }
      try {
        if (!payload) return;
        // If this update is for the current student, reconcile locally to avoid an extra fetch
        if (String(payload.studentId) === String(user?._id)) {
          // update local serverEnrollments map
          setServerEnrollments(prev => ({ ...prev, [String(payload.classId)]: payload.status }));
          // remove any optimistic pending marker for this class
          setOptimisticPending(prev => {
            const s = new Set(Array.from(prev));
            s.delete(String(payload.classId));
            return s;
          });
          // update KPIs locally when possible
          setKpiData(prev => {
            if (!prev) return prev;
            const updated = { ...prev };
            // Adjust counts conservatively (if we have pending/approved fields)
            if (payload.status === 'Approved') {
              updated.pendingEnrollments = Math.max(0, (updated.pendingEnrollments || 0) - 1);
              updated.approvedEnrollments = (updated.approvedEnrollments || 0) + 1;
              updated.enrolledClasses = (updated.enrolledClasses || 0) + 1;
            } else if (payload.status === 'Rejected') {
              updated.pendingEnrollments = Math.max(0, (updated.pendingEnrollments || 0) - 1);
            }
            return updated;
          });
        }
      } catch (e) {
        console.warn('Error handling enrollment_updated socket payload:', e);
      }
    });

    socket.on('enrollment_requested', (payload) => {
      // payload may contain { studentId, classId, status, studentName, className }
      try {
        if (!payload) return;
        if (String(payload.studentId) === String(user?._id)) {
          // mark as pending in the serverEnrollments map
          setServerEnrollments(prev => ({ ...prev, [String(payload.classId)]: payload.status }));
          // remove optimistic pending if present (server acknowledged)
          setOptimisticPending(prev => {
            const s = new Set(Array.from(prev));
            s.delete(String(payload.classId));
            return s;
          });
          // update KPI pending count locally
          setKpiData(prev => {
            if (!prev) return prev;
            const updated = { ...prev };
            updated.pendingEnrollments = (updated.pendingEnrollments || 0) + 1;
            return updated;
          });
        }
      } catch (e) {
        console.warn('Error handling enrollment_requested socket payload:', e);
      }
    });

    return () => {
      socket.off('enrollment_updated');
      socket.off('enrollment_requested');
    };
  }, [user, fetchDashboardData, fetchTimetableData]);

  useEffect(() => {
    fetchDashboardData();
    fetchTimetableData();
    fetchTodayTimetable();
  }, [fetchTimetableData, fetchDashboardData, fetchTodayTimetable]);

  // Session timeout: log out after 15 minutes
  useEffect(() => {
    let sessionTimeout;
    let pollingInterval;

    // Start 15-minute session timer
    sessionTimeout = setTimeout(() => {
      if (logout) logout();
      alert('Your session has expired. Please log in again.');
      navigate('/login');
    }, 15 * 60 * 1000);

    // Poll dashboard every 5 minutes (keeps KPIs reasonably fresh while avoiding rate limits)
    pollingInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, 5 * 60 * 1000);

    // Also fetch immediately if tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(sessionTimeout);
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [logout, navigate, fetchDashboardData]);

  useEffect(() => {
    if (dashboardData?.notifications) {
      const hasCreditUpdate = dashboardData.notifications.some(
        (notification) => notification.type === 'credit_update'
      );

      if (hasCreditUpdate) {
        const refreshCredits = async () => {
          try {
            const kpiRes = await api.get('/api/dashboard');
            setKpiData(kpiRes.data.kpi);
          } catch (err) {
            console.error('Failed to refresh credit data:', err);
          }
        };
        refreshCredits();
      }
    }
  }, [dashboardData?.notifications]);



  const handleMarkAllAnnouncementsRead = async () => {
    try {
      if (user?.role === 'student') {
        // Students: mark all as read (soft delete)
        await rateLimitedRequest({
          url: `/api/announcements/mark-all-read`,
          method: 'patch',
        });
      } else {
        // Admin/HOD/Teacher: hard delete
        await rateLimitedRequest({
          url: `/api/announcements/delete-all`,
          method: 'delete',
        });
      }
      // Refresh announcements to reflect deletion/mark-as-read
      const announcementsRes = await rateLimitedRequest({
        url: `/api/announcements`,
        method: 'get',
      });
      setAnnouncements(announcementsRes.data);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to delete all announcements.');
      } else {
        console.error('Failed to delete announcements:', err);
        setError('Failed to update announcements. Please try again.');
      }
    }
  };

  const handleOpenAbsenceModal = () => setAbsenceModalOpen(true);
  const handleCloseAbsenceModal = () => setAbsenceModalOpen(false);
  const handleOpenAnnouncementsModal = () => setAnnouncementsModalOpen(true);
  const handleCloseAnnouncementsModal = () => setAnnouncementsModalOpen(false);

  // logic to submit absence request for StudentAbsenceModal component
  const handleSubmitAbsenceRequest = async (formData) => {
    try {
      await api.post('/api/absence/request', formData);
      // Handle success (e.g., show a success message, refresh data)
    } catch (err) {
      console.error('Failed to submit absence request:', err);
      // Handle error (e.g., show an error message)
    }
  };

  // Enrollment modal state and logic
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState('');
  // optimistic pending state for quick UI feedback
  const [optimisticPending, setOptimisticPending] = useState(new Set());

  const handleOpenEnrollmentModal = (classId) => {
    const foundClass = timetableData?.departmentClasses?.find(cls => cls._id === classId);
    setSelectedClass(foundClass || null);
    setEnrollMessage('');
    setEnrollmentModalOpen(true);
  };

  const handleCloseEnrollmentModal = () => {
    setEnrollmentModalOpen(false);
    setSelectedClass(null);
    setEnrollMessage('');
    setEnrollLoading(false);
  };

  const handleSubmitEnrollment = async () => {
    if (!selectedClass) return;
    setEnrollLoading(true);
    setEnrollMessage('');
    try {
      // Optimistic UI: mark this class as pending immediately
      setOptimisticPending(prev => new Set([...Array.from(prev), String(selectedClass._id)]));
      await api.post('/api/enrollments/request', { classId: selectedClass._id });
      // Remove optimistic pending mark now that server responded successfully
      setOptimisticPending(prev => {
        const s = new Set(Array.from(prev));
        s.delete(String(selectedClass._id));
        return s;
      });
      setEnrollMessage('Enrollment request sent! Please await your teacher\'s approval.');
      // Emit a socket event to let the server/other listeners know an enrollment request was made
      try {
        socket.emit('enrollment_requested', { studentId: user?._id, classId: selectedClass._id });
      } catch (e) {
        // ignore emit errors
      }
      // Optionally refresh dashboard/timetable data (we still refresh to reconcile server state)
      fetchDashboardData();
      fetchTimetableData();
      fetchTodayTimetable();
      setTimeout(() => {
        handleCloseEnrollmentModal();
      }, 2000);
    } catch (err) {
      // Remove optimistic pending state on failure
      setOptimisticPending(prev => {
        const s = new Set(Array.from(prev));
        s.delete(String(selectedClass._id));
        return s;
      });
      setEnrollMessage(
        err?.response?.data?.message || 'Failed to submit enrollment request. Please try again.'
      );
    } finally {
      setEnrollLoading(false);
    }
  };

  const getAnnouncementContent = (announcement) => {
    if (!announcement) return '';
    const raw = announcement.message ?? announcement.content ?? '';
    return typeof raw === 'string' ? raw : '';
  };

  const isAnnouncementActive = (announcement) => {
    if (!announcement) return true;
    if (typeof announcement.active === 'boolean') return announcement.active;
    if (typeof announcement.isActive === 'boolean') return announcement.isActive;
    return true;
  };

  const getAudienceLabel = (announcement) => {
    if (!announcement) return '';

    const roleArray = Array.isArray(announcement.targetRoles)
      ? announcement.targetRoles
      : [announcement.targetRoles];
    const rawRole = roleArray[0] || '';
    const normalizedRole = typeof rawRole === 'string' ? rawRole.toLowerCase() : '';
    const scope = announcement.targetScope || (announcement.department ? 'department' : 'global');

    let label = '';
    const departmentSuffix = announcement.department ? ` — ${announcement.department}` : '';

    if (scope === 'department') {
      if (normalizedRole === 'teacher') label = `Teachers in Department${departmentSuffix}`;
      else if (normalizedRole === 'student' || normalizedRole === 'all') label = `Students in Department${departmentSuffix}`;
      else if (normalizedRole === 'hod') label = `HODs in Department${departmentSuffix}`;
      else label = `Department Audience${departmentSuffix}`;
    } else {
      if (normalizedRole === 'teacher') label = 'All Teachers';
      else if (normalizedRole === 'student' || normalizedRole === 'all') label = 'All Students';
      else if (normalizedRole === 'hod') label = 'All HODs';
      else if (normalizedRole === 'credit-controller') label = 'All Credit Controllers';
      else if (normalizedRole === 'hssm-provider') label = 'All HSSM Providers';
      else if (normalizedRole === 'admin') label = 'All Admins';
      else label = 'All Users';
    }

    const audience = announcement.targetAudience || 'all';
    if (audience === 'class') {
      let classLabel = 'Class-specific';
      if (announcement.targetClassName) classLabel = `Class: ${announcement.targetClassName}`;
      else if (announcement.className) classLabel = `Class: ${announcement.className}`;
      else if (announcement.targetClass && typeof announcement.targetClass === 'object' && announcement.targetClass.name) {
        classLabel = `Class: ${announcement.targetClass.name}`;
      }
      label = `${label} • ${classLabel}`;
    } else if (audience === 'specific') {
      const count = Array.isArray(announcement.specific)
        ? announcement.specific.length
        : typeof announcement.specificCount === 'number'
          ? announcement.specificCount
          : 0;
      label = `${label} • ${count} student${count !== 1 ? 's' : ''}`;
    }

    return label;
  };

  const getPriorityChipProps = (priority) => {
    if (!priority) return null;
    const normalized = String(priority).toLowerCase();
    const label = `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} Priority`;
    switch (normalized) {
      case 'high':
        return { label, color: 'error', variant: 'filled' };
      case 'low':
        return { label, color: 'info', variant: 'outlined' };
      default:
        return { label, color: 'warning', variant: 'outlined' };
    }
  };

  const renderAnnouncementCard = (announcement, { truncate = false } = {}) => {
    if (!announcement) return null;
    const content = getAnnouncementContent(announcement);
    const displayContent = truncate && content.length > 220 ? `${content.slice(0, 220)}…` : content;
    const createdAtLabel = announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : '';
    const creatorName = announcement.createdBy?.name || 'Staff';
    const isActive = isAnnouncementActive(announcement);
    const audienceLabel = getAudienceLabel(announcement);
    const priorityProps = getPriorityChipProps(announcement.priority);
    const userId = user?._id ? String(user._id) : null;
    const readBySet = new Set((announcement.readBy || []).map((id) => String(id)));
    const isUnread = userId ? !readBySet.has(userId) : false;

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `4px solid ${isActive ? '#2e7d32' : '#9e9e9e'}`,
          opacity: isActive ? 1 : 0.75,
          backgroundColor: 'rgba(255, 248, 225, 0.35)'
        }}
      >
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">{announcement.title}</Typography>
              {isUnread && <Chip label="New" color="success" size="small" />}
            </Box>
            {createdAtLabel && <Chip size="small" label={createdAtLabel} />}
          </Box>
          <Typography variant="caption" color="text.secondary">
            From: {creatorName}
          </Typography>
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', flexGrow: 1 }}
          >
            {displayContent || 'No additional details provided.'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip size="small" label={isActive ? 'Active' : 'Inactive'} color={isActive ? 'success' : 'default'} />
            {audienceLabel && (
              <Chip size="small" label={audienceLabel} variant="outlined" color="primary" />
            )}
            {priorityProps && (
              <Chip
                size="small"
                label={priorityProps.label}
                color={priorityProps.color}
                variant={priorityProps.variant}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    socket.connect();
    // Register this socket with the backend so it joins a room for this user
    try {
      if (user && user._id) {
        socket.emit('register', { userId: user._id });
      }
    } catch (e) {
      // ignore registration errors
    }

    socket.on('venue_updated', (updatedEntry) => {
      setTimetableData(prevData => {
        if (!prevData) return null;

        const day = updatedEntry.dayOfWeek.toLowerCase();
        const newTimetable = { ...prevData.timetable };

        if (newTimetable[day]) {
          const index = newTimetable[day].findIndex(entry => entry._id === updatedEntry._id);
          if (index !== -1) {
            newTimetable[day][index] = updatedEntry;
          }
        }

        return { ...prevData, timetable: newTimetable };
      });
    });

    return () => {
      socket.off('venue_updated');
      socket.disconnect();
    };
  }, [user]);

  // Listen for credit updates pushed from the server
  useEffect(() => {
    if (!user) return;
    const handleCreditUpdated = (payload) => {
      try {
        if (!payload) return;
        // Only update if event targets this user
        if (String(payload.userId) !== String(user._id)) return;
        setKpiData(prev => ({ ...(prev || {}), credits: payload.credits }));
      } catch (e) {
        console.warn('Error handling credit_updated payload:', e);
      }
    };

    socket.on('credit_updated', handleCreditUpdated);
    return () => {
      socket.off('credit_updated', handleCreditUpdated);
    };
  }, [user]);

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

  // Helper to count unread announcements for the current user
  const getUnreadAnnouncementsCount = () => {
    if (!user || !announcements) return 0;
    return announcements.filter(a => !a.readBy || !a.readBy.includes(user.id || user._id)).length;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Banner */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(120deg, #0052cc 0%, #3f8eff 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome back, {user?.name}!
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography variant="body1">
              You have {kpiData?.pendingEnrollments ?? 0} pending enrollment requests and {getUnreadAnnouncementsCount()} new announcements.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: getCreditColor(kpiData?.credits), display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet sx={{ fontSize: '1.5rem' }} />
                {kpiData?.credits ?? 0}
              </Typography>
              <Typography variant="body2" sx={{ color: getCreditColor(kpiData?.credits) }}>
                Available Credits
              </Typography>
              {(kpiData?.credits ?? 0) < 10 && (
                <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  ⚠️ Low credits - contact credit controller
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Announcements Banner */}
      {announcements && announcements.length > 0 && (
        <Paper
          elevation={2}
          sx={{ p: 2, mb: 4, bgcolor: '#fff8e1', borderLeft: '4px solid #ffc107', borderRadius: 1 }}
        >
          <Typography variant="h6" sx={{ color: '#f57c00', mb: 1, display: 'flex', alignItems: 'center' }}>
            <Notifications sx={{ mr: 1 }} /> Important Announcements
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {announcements.slice(0, 3).map((announcement, index) => (
              <Grid
                item
                xs={12}
                sm={announcements.length > 1 ? 6 : 12}
                md={announcements.length > 2 ? 4 : 6}
                key={announcement._id || index}
              >
                {renderAnnouncementCard(announcement, { truncate: true })}
              </Grid>
            ))}
          </Grid>
          <Box
            sx={{
              display: 'flex',
              justifyContent: announcements.length > 3 ? 'space-between' : 'flex-end',
              alignItems: 'center',
              mt: 2,
              gap: 1
            }}
          >
            {announcements.length > 3 && (
              <Button size="small" variant="outlined" onClick={handleOpenAnnouncementsModal}>
                View All Announcements ({announcements.length})
              </Button>
            )}
            <Button size="small" variant="contained" onClick={handleMarkAllAnnouncementsRead}>
              Mark all as read
            </Button>
          </Box>
        </Paper>
      )}

      {/* KPI Cards */}
      {kpiData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: `2px solid ${getCreditColor(kpiData?.credits)}`, backgroundColor: getCreditBackgroundColor(kpiData?.credits) }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceWallet sx={{ mr: 1, color: getCreditColor(kpiData?.credits) }} /> Credits
                </Typography>
                <Typography variant="h4" sx={{ color: getCreditColor(kpiData?.credits), fontWeight: 'bold' }}>
                  {kpiData?.credits ?? 0}
                </Typography>
                {(kpiData?.credits ?? 0) < 10 && (
                  <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold', display: 'block', mt: 1 }}>
                    ⚠️ Low balance
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Receipt sx={{ mr: 1 }} /> Total Enrollments
                </Typography>
                <Typography variant="h4">{kpiData?.enrolledClasses ?? 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <HourglassEmpty sx={{ mr: 1 }} /> Pending
                </Typography>
                <Typography variant="h4">{kpiData?.pendingEnrollments ?? 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} /> Approved
                </Typography>
                <Typography variant="h4">{kpiData?.approvedEnrollments ?? 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Department Classes Section (from backend) */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="classes-section">
        <Typography variant="h5" gutterBottom>Department Classes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Browse all classes in your department. Enrolled classes are highlighted. You can enroll in any available class.
        </Typography>
        {/* Only show classes for the student's department */}
        <Grid container spacing={2} sx={{ mb: 3 }} />
        {!timetableData?.departmentClasses ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}>
            <Grid container spacing={3} sx={{ flexWrap: 'nowrap' }}>
              {(() => {
                // Build sets for quick lookup: enrolled and pending class IDs for the current student
                const enrolledClassIds = new Set();
                const pendingClassIds = new Set();
                if (dashboardData?.enrollments && Array.isArray(dashboardData.enrollments)) {
                  dashboardData.enrollments.forEach(en => {
                    if (en.class && en.class._id) {
                      const cid = typeof en.class === 'string' ? en.class : en.class._id;
                      if (en.status === 'Approved' || en.status === 'approved') {
                        enrolledClassIds.add(String(cid));
                      } else if (en.status === 'Pending' || en.status === 'pending') {
                        pendingClassIds.add(String(cid));
                      }
                    }
                  });
                }

                return timetableData.departmentClasses
                  .filter(cls => user?.department && cls.department === user.department)
                  .map((cls) => {
                    const clsId = String(cls._id);
                    // Prefer server-sent enrollment status when available (from socket payloads)
                    const serverStatus = serverEnrollments[clsId];
                    // Use normalized dashboardData.enrolledClassIds if provided, otherwise fall back to timetableData.enrolledClasses
                    const normalizedEnrolledIds = Array.isArray(dashboardData?.enrolledClassIds) ? new Set(dashboardData.enrolledClassIds.map(id => String(id))) : null;
                    const isInEnrolledSet = normalizedEnrolledIds ? normalizedEnrolledIds.has(clsId) : (Array.isArray(timetableData.enrolledClasses) && timetableData.enrolledClasses.some(ec => String(ec._id || ec) === clsId));
                    const isEnrolled = serverStatus === 'Approved' || enrolledClassIds.has(clsId) || isInEnrolledSet;
                    // Consider optimistic state and server-sent pending as pending as well
                    const isPending = !isEnrolled && (serverStatus === 'Pending' || pendingClassIds.has(clsId) || optimisticPending.has(clsId));

                    const scheduleSlots = Array.isArray(cls.timetable) ? cls.timetable.filter(slot => slot) : [];
                    const formattedSlots = scheduleSlots.slice(0, 2).map((slot) => {
                      const dayLabel = slot?.day || slot?.dayOfWeek || slot?.dayName || '';
                      const start = formatTime(slot?.startTime || slot?.start);
                      const end = formatTime(slot?.endTime || slot?.end);
                      const range = start && end ? `${start} – ${end}` : (start || end || '');
                      const venueLabel = slot?.venue ? `@ ${slot.venue}` : '';
                      return [dayLabel, range, venueLabel].filter(Boolean).join(' ');
                    }).filter(Boolean);
                    const scheduleSummary = formattedSlots.join(' • ') || 'Schedule pending';
                    const extraSessions = Math.max(0, scheduleSlots.length - 2);
                    const rawTeacher = typeof cls.teacher === 'object' && cls.teacher !== null
                      ? (cls.teacher.fullName || cls.teacher.name || cls.teacher.displayName || cls.teacher.email)
                      : (cls.teacherName || cls.teacherFullName || cls.teacherEmail || (typeof cls.teacher === 'string' ? cls.teacher : ''));
                    const teacherDisplay = rawTeacher || 'Awaiting assignment';
                    const enrolledCount = Array.isArray(cls.enrolledStudents) ? cls.enrolledStudents.length : null;
                    const activeVenue = cls.venueAnnouncements?.find?.((announcement) => announcement?.active);
                    const statusColor = isEnrolled ? '#2e7d32' : isPending ? '#ed6c02' : '#1e88e5';

                    return (
                      <Grid item key={cls._id} xs={12} sm={6} md={4} sx={{ minWidth: { xs: 300, sm: 340 } }}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: isEnrolled ? 'success.light' : 'grey.200',
                            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            background: isEnrolled
                              ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.12) 0%, rgba(241, 248, 233, 0.9) 100%)'
                              : isPending
                                ? 'linear-gradient(135deg, rgba(245, 124, 0, 0.08) 0%, rgba(255, 243, 224, 0.85) 100%)'
                                : 'linear-gradient(135deg, rgba(33, 150, 243, 0.06) 0%, rgba(3, 169, 244, 0.03) 100%)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)'
                            }
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, bgcolor: statusColor }} />
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                              <Box>
                                <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>Class</Typography>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>{cls.name}</Typography>
                              </Box>
                              {isEnrolled ? (
                                <Chip label="Enrolled" color="success" size="small" />
                              ) : isPending ? (
                                <Chip label="Pending" color="warning" size="small" />
                              ) : (
                                <Chip label="Available" color="info" size="small" />
                              )}
                            </Box>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {cls.description || 'No description provided.'}
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1.2 }}>
                              <Chip
                                icon={<School fontSize="small" />}
                                label={cls.department || 'Department TBD'}
                                variant="outlined"
                                size="small"
                                sx={{ backgroundColor: 'background.paper' }}
                              />
                              <Chip
                                icon={<AccountBalanceWallet fontSize="small" />}
                                label={`${cls.creditsRequired ?? 0} credits`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{
                                  backgroundColor: 'primary.light',
                                  color: 'primary.dark',
                                  '& .MuiChip-icon': { color: 'primary.dark' }
                                }}
                              />
                              {typeof enrolledCount === 'number' && (
                                <Chip
                                  icon={<Group fontSize="small" />}
                                  label={`${enrolledCount} enrolled`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>

                            <Stack spacing={1.2} sx={{ mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime fontSize="small" sx={{ color: 'primary.main' }} />
                                <Typography variant="body2" color="text.primary">
                                  <Typography component="span" variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', mr: 0.5 }}>
                                    Schedule:
                                  </Typography>
                                  {scheduleSummary}
                                  {extraSessions > 0 && (
                                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5 }}>
                                      (+{extraSessions} more)
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" sx={{ color: 'secondary.main' }} />
                                <Typography variant="body2" color="text.primary">
                                  <Typography component="span" variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', mr: 0.5 }}>
                                    Instructor:
                                  </Typography>
                                  {teacherDisplay}
                                </Typography>
                              </Box>
                              {activeVenue && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocationOn fontSize="small" sx={{ color: 'error.main' }} />
                                  <Typography variant="body2" color="text.primary">
                                    <Typography component="span" variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', mr: 0.5 }}>
                                      Venue:
                                    </Typography>
                                    {activeVenue.venue}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </CardContent>
                          <Box sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                            {isEnrolled ? (
                              <Button fullWidth variant="outlined" color="success" disabled>Enrolled</Button>
                            ) : isPending ? (
                              <Button fullWidth variant="outlined" color="warning" disabled>Pending</Button>
                            ) : (
                              <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={() => handleOpenEnrollmentModal(cls._id)}
                              >
                                Request Enrollment
                              </Button>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                    );
                  });
              })()}
            </Grid>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Enhanced Timetable Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarToday sx={{ mr: 1 }} /> My Timetable
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant={timetableView === 'today' ? 'contained' : 'outlined'} onClick={() => setTimetableView('today')}>Today</Button>
                <Button size="small" variant={timetableView === 'week' ? 'contained' : 'outlined'} onClick={() => setTimetableView('week')}>Week</Button>
              </Box>
            </Box>
            {timetableView === 'today' ? (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
                {todayTimetable === null ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading timetable...</Typography>
                  </Box>
                ) : todayTimetableError ? (
                  <Alert severity="error">{todayTimetableError}</Alert>
                ) : (
                  <List>
                    {(() => {
                      const todayEntries = Array.isArray(todayTimetable) ? todayTimetable : [];
                      const subjectToClassId = new Map();
                      if (Array.isArray(timetableData?.departmentClasses)) {
                        timetableData.departmentClasses.forEach(c => {
                          if (c && c.name && c._id) subjectToClassId.set(c.name, String(c._id));
                        });
                      }
                      const enrolledClassIdsSet = new Set();
                      if (Array.isArray(dashboardData?.enrolledClassIds)) {
                        dashboardData.enrolledClassIds.forEach(id => { if (id) enrolledClassIdsSet.add(String(id)); });
                      } else if (Array.isArray(timetableData?.enrolledClasses)) {
                        timetableData.enrolledClasses.forEach(ec => {
                          if (!ec) return;
                          enrolledClassIdsSet.add(String(ec._id || ec));
                        });
                      }

                      if (todayEntries.length === 0) {
                        return (
                          <ListItem>
                            <ListItemText primary="No classes scheduled for today." />
                          </ListItem>
                        );
                      }

                      return todayEntries.map((item, idx) => {
                        const status = getEntryStatus ? getEntryStatus(item) : 'not-started';
                        const chipColor = status === 'in-progress' ? 'success' : (status === 'done' ? 'default' : 'info');
                        const chipLabel = status === 'in-progress' ? 'In Progress' : (status === 'done' ? 'Done' : 'Not Started');
                        const entryClassId = item.subject ? subjectToClassId.get(item.subject) : undefined;
                        const isEnrolledEntry = entryClassId ? enrolledClassIdsSet.has(entryClassId) : false;
                        const primaryTeacherName = item.teacher?.name || item.teacherName || 'TBA';
                        const replacementName = item.replacement && (item.replacement.teacher?.name || item.replacement.teacherName);
                        const teacherDisplay = replacementName ? `${replacementName} (covering ${primaryTeacherName})` : primaryTeacherName;
                        const venueLabel = item?.venue?.name || item?.venue || 'TBA';
                        const replacementReason = item.replacement?.reason ? ` — ${item.replacement.reason}` : '';

                        return (
                          <ListItem key={item._id || `today-${idx}`} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1, bgcolor: isEnrolledEntry ? 'rgba(232, 245, 233, 0.6)' : undefined, borderColor: isEnrolledEntry ? '#2e7d32' : undefined }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1" fontWeight="bold">{item?.subject || 'Untitled class'}</Typography>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip label={`${formatTime(item?.startTime)} - ${formatTime(item?.endTime)}`} size="small" color="primary" />
                                    <Chip label={chipLabel} size="small" color={chipColor} />
                                    {replacementName && <Chip label="Replacement" size="small" color="warning" sx={{ ml: 0.5 }} />}
                                    {isEnrolledEntry && <Chip label="Your Class" size="small" color="success" sx={{ ml: 0.5 }} />}
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary">👨‍🏫 {teacherDisplay}</Typography>
                                  <Typography variant="body2" color="text.secondary">📍 {venueLabel}</Typography>
                                  {replacementName && (
                                    <Typography variant="body2" color="text.secondary">🔁 Replacement: {replacementName}{replacementReason}</Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      });
                    })()}
                  </List>
                )}
              </Box>
            ) : (
              <Box>
                {timetableData?.timetable ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                      const dayEntries = timetableData.timetable[day] || [];
                      // Build subject->classId map and enrolled class IDs set for week view
                      const subjectToClassIdWeek = new Map();
                      if (Array.isArray(timetableData?.departmentClasses)) {
                        timetableData.departmentClasses.forEach(c => { if (c && c.name && c._id) subjectToClassIdWeek.set(c.name, String(c._id)); });
                      }
                      const enrolledClassIdsSetWeek = new Set();
                      if (Array.isArray(dashboardData?.enrolledClassIds)) {
                        dashboardData.enrolledClassIds.forEach(id => { if (id) enrolledClassIdsSetWeek.add(String(id)); });
                      } else if (Array.isArray(timetableData?.enrolledClasses)) {
                        timetableData.enrolledClasses.forEach(ec => { if (ec) enrolledClassIdsSetWeek.add(String(ec._id || ec)); });
                      }
                      return (
                        <Card key={day} variant="outlined">
                          <CardContent sx={{ pb: '16px !important' }}>
                            <Typography variant="h6" sx={{ mb: 1, textTransform: 'capitalize' }}>{day}</Typography>
                            {dayEntries.length > 0 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {dayEntries.map((item) => {
                                  const entryClassIdWeek = subjectToClassIdWeek.get(item.subject);
                                  const isEnrolledWeek = entryClassIdWeek ? enrolledClassIdsSetWeek.has(entryClassIdWeek) : false;
                                  const replacementNameWeek = item.replacement && (item.replacement.teacher?.name || item.replacement.teacherName);
                                  const primaryTeacherWeek = item.teacher?.name || item.teacherName || 'TBA';
                                  const teacherDisplayWeek = replacementNameWeek ? `${replacementNameWeek} (covering ${primaryTeacherWeek})` : primaryTeacherWeek;
                                  const venueLabelWeek = item?.venue?.name || item?.venue || 'TBA';
                                  return (
                                    <Box key={item._id} sx={{ p: 1, bgcolor: isEnrolledWeek ? 'rgba(232, 245, 233, 0.6)' : 'grey.50', borderRadius: 1, border: isEnrolledWeek ? '2px solid #2e7d32' : '1px solid #e0e0e0' }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">{item.subject}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <Typography variant="caption" color="primary">{item.startTime} - {item.endTime}</Typography>
                                          {replacementNameWeek && <Chip label="Replacement" size="small" color="warning" />}
                                        </Box>
                                      </Box>
                                      <Typography variant="body2" color="text.secondary">👨‍🏫 {teacherDisplayWeek} • 📍 {venueLabelWeek}</Typography>
                                      {replacementNameWeek && (
                                        <Typography variant="caption" color="text.secondary">🔁 Replacement: {replacementNameWeek}{item.replacement?.reason ? ` — ${item.replacement.reason}` : ''}</Typography>
                                      )}
                                      {isEnrolledWeek && (
                                        <Box sx={{ mt: 1 }}><Chip label="Your Class" size="small" color="success" /></Box>
                                      )}
                                    </Box>
                                  );
                                })}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">No classes scheduled</Typography>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography>Loading timetable...</Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Timetable Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Notifications sx={{ mr: 1 }} /> Timetable Summary
            </Typography>
            <List>
              {timetableData && (
                <>
                  {(() => {
                    // Normalize enrolled classes: could be a number, an array of ids, or array of class objects
                    const enrolledRaw = timetableData.enrolledClasses;
                    let enrolledCount = 0;
                    let enrolledNames = [];

                    if (Array.isArray(enrolledRaw)) {
                      enrolledCount = enrolledRaw.length;
                      // Resolve ids/objects to names using departmentClasses if available
                      enrolledNames = enrolledRaw.map(ec => {
                        const id = String((ec && (ec._id || ec)) || ec);
                        // Try to find matching class in departmentClasses
                        const match = Array.isArray(timetableData.departmentClasses) ? timetableData.departmentClasses.find(c => String(c._id) === id) : null;
                        if (match && match.name) return match.name;
                        // If the enrolled entry is already an object with a name, use it
                        if (ec && typeof ec === 'object' && ec.name) return ec.name;
                        // Fallback to id string
                        return id;
                      }).filter(Boolean);
                    } else if (typeof enrolledRaw === 'number') {
                      enrolledCount = enrolledRaw;
                    } else if (typeof enrolledRaw === 'string') {
                      // single id string
                      enrolledCount = 1;
                      const id = String(enrolledRaw);
                      const match = Array.isArray(timetableData.departmentClasses) ? timetableData.departmentClasses.find(c => String(c._id) === id) : null;
                      enrolledNames = match && match.name ? [match.name] : [id];
                    }

                    const namesDisplay = enrolledNames.length > 0 ? ` — ${enrolledNames.slice(0, 5).join(', ')}${enrolledNames.length > 5 ? '…' : ''}` : '';

                    return (
                      <ListItem>
                        <ListItemText primary="Enrolled Classes" secondary={`${enrolledCount} active enrollment${enrolledCount !== 1 ? 's' : ''}${namesDisplay}`} />
                      </ListItem>
                    );
                  })()}

                  <ListItem><ListItemText primary="Total Schedule Entries" secondary={`${timetableData.totalEntries || 0} timetable entries`} /></ListItem>
                  <Divider sx={{ my: 1 }} />
                  <ListItem>
                    <ListItemText
                      primary="Today's Classes"
                      secondary={(() => {
                        const todayCount = Array.isArray(todayTimetable) ? todayTimetable.length : 0;
                        return `${todayCount} class${todayCount !== 1 ? 'es' : ''}`;
                      })()}
                    />
                  </ListItem>
                  {Array.isArray(todayTimetable) && todayTimetable.length > 0 && (
                    <ListItem>
                      <ListItemText
                        primary="Venues Today"
                        secondary={(() => {
                          const venues = new Set();
                          todayTimetable.forEach(entry => {
                            const venueName = entry?.venue?.name || entry?.venue;
                            if (venueName) venues.add(venueName);
                          });
                          const list = Array.from(venues);
                          return list.length > 0 ? list.join(', ') : 'TBA';
                        })()}
                      />
                    </ListItem>
                  )}
                </>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Absence Reporting */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Absence Reporting</Typography>
            <Typography sx={{ mb: 2 }}>If you are unable to attend a class, please report your absence here.</Typography>
            <Button variant="contained" onClick={handleOpenAbsenceModal}>Report Absence</Button>
          </Paper>
        </Grid>
      </Grid>

      <StudentAbsenceModal
        open={isAbsenceModalOpen}
        onClose={handleCloseAbsenceModal}
        studentId={user?._id}
        classOptions={timetableData?.departmentClasses || []}
        onSubmit={handleSubmitAbsenceRequest}
      />


      {/* Enrollment Modal */}
      <Dialog
        open={enrollmentModalOpen}
        onClose={handleCloseEnrollmentModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Enrollment</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
          {selectedClass ? (
            <>
              <Typography variant="h6" gutterBottom>{selectedClass.name}</Typography>
              <Typography variant="body2" gutterBottom>{selectedClass.description}</Typography>
              <Typography variant="subtitle2" gutterBottom>Department: {selectedClass.department}</Typography>
              <Typography variant="subtitle2" gutterBottom>Credits Required: {selectedClass.creditsRequired}</Typography>
              {enrollMessage && (
                <Alert severity={enrollMessage.includes('await') ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {enrollMessage}
                </Alert>
              )}
            </>
          ) : (
            <Typography>No class selected.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEnrollmentModal} disabled={enrollLoading}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!selectedClass || enrollLoading}
            onClick={handleSubmitEnrollment}
          >
            {enrollLoading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Announcements Modal */}
      <Dialog
        open={announcementsModalOpen}
        onClose={handleCloseAnnouncementsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">All Announcements</Typography>
          <Button onClick={handleCloseAnnouncementsModal} sx={{ minWidth: 'auto', p: 0.5 }}>
            <Close />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {announcements.length === 0 ? (
            <Typography>No announcements available.</Typography>
          ) : (
            <Grid container spacing={2}>
              {announcements.map((announcement, index) => (
                <Grid item xs={12} sm={6} md={4} key={announcement._id || index}>
                  {renderAnnouncementCard(announcement)}
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnnouncementsModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDashboard;