import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { rateLimitedRequest } from '../utils/rateLimitedRequest';
import { getWeekNumber } from '../utils/weekUtils';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Button,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  // RadioGroup, FormControlLabel, Radio (removed - not used in this variant)
  Alert,
} from '@mui/material';
import {
  Receipt,
  HourglassEmpty,
  CheckCircle,
  Announcement,
  CalendarToday,
  Class as ClassIcon,
  BookOnline,
  ExpandMore as ExpandMoreIcon,
  People,
} from '@mui/icons-material';

import TeacherAbsenceModal from '../components/models/TeacherAbsenceModal';
import EnrollmentManager from '../components/EnrollmentManager';
import AbsenceManager from '../components/AbsenceManager';
import AnnouncementManager from '../components/AnnouncementManager';
import socket from '../socket';

// WEEKDAY_KEYS removed: not used in this file

const TeacherDashboardNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // attendance state removed: not used in this variant
  const [activeTab, setActiveTab] = useState(0);
  const [timetableData, setTimetableData] = useState(null);
  const timetableRef = useRef(null);
  // timetableView state removed: not used in this variant
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [myClasses, setMyClasses] = useState([]);
  const [serverEnrollmentNotifications, setServerEnrollmentNotifications] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // HOD announcement dialog state
  const [announceDialogOpen, setAnnounceDialogOpen] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ classId: '', className: '', replacementName: '', reason: '', entryId: '', entries: [] });

  useEffect(() => {
    timetableRef.current = timetableData;
  }, [timetableData]);

  // format time helper
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

  const fetchDashboardData = async () => {
    try {
      const kpiRes = await rateLimitedRequest({ url: '/api/dashboard', method: 'get' });
      setKpiData(kpiRes.data.kpi);

      const res = await rateLimitedRequest({ url: '/api/teacher/dashboard', method: 'get' });
      setDashboardData(res.data);

      const classesRes = await rateLimitedRequest({ url: '/api/teacher/classes', method: 'get' });
      setMyClasses(classesRes.data);

      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const localGetWeekNumber = (termStartDate) => getWeekNumber(termStartDate);

  const fetchTimetableData = useCallback(async () => {
    try {
      let termStartDate = null;
      const currentTimetable = timetableRef.current;
      if (currentTimetable && currentTimetable.timetable) {
        Object.values(currentTimetable.timetable).forEach(dayArr => {
          dayArr.forEach(entry => {
            if (entry.startDate && (!termStartDate || new Date(entry.startDate) < new Date(termStartDate))) {
              termStartDate = entry.startDate;
            }
          });
        });
      }
      if (!termStartDate) {
        if (dashboardData && dashboardData.termStartDate) termStartDate = dashboardData.termStartDate;
        else termStartDate = new Date();
      }
      const week = localGetWeekNumber(termStartDate);
  const response = await api.get(`/api/timetable/teacher?week=${week}`);
  setTimetableData(response.data);
    } catch (err) {
      console.error('Error fetching timetable:', err);
    }
  }, [dashboardData]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchTimetableData();
    }
    // eslint-disable-next-line
  }, [user, fetchTimetableData]);

  useEffect(() => {
    if (dashboardData) {
      const refreshKpiData = async () => {
        try {
          const kpiRes = await rateLimitedRequest({ url: '/api/dashboard', method: 'get' });
          setKpiData(kpiRes.data.kpi);
        } catch (err) {
          // ignore
        }
      };
      refreshKpiData();
    }
  }, [dashboardData]);

  useEffect(() => {
    if (!user) return;
    let interval;
    function startPolling() {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchDashboardData();
        }
      }, 15 * 60 * 1000);
    }
    startPolling();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchDashboardData(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVisibility); };
  }, [user]);

  const renderServerEnrollmentNotifications = () => {
    if (!serverEnrollmentNotifications || serverEnrollmentNotifications.length === 0) return null;
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Recent Enrollment Events</Typography>
        <List dense>
          {serverEnrollmentNotifications.slice(0, 5).map((n, idx) => (
            <ListItem key={`${n.enrollmentId || n.classId || idx}-${n.receivedAt || idx}`} sx={{ py: 0.5, cursor: 'pointer' }} onClick={() => handleNotificationClick(n)}>
              <ListItemText primary={`${n.studentName || 'Student'} → ${n.className || 'Class'}`} secondary={`${n.type === 'requested' ? 'Requested' : 'Updated'} • ${n.status || ''} • ${new Date(n.receivedAt || Date.now()).toLocaleTimeString()}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  // Attendance helpers removed: not used in this file variant

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    const classId = notification.classId || null;
    setSelectedClassId(classId);
    setActiveTab(1);
  };

  const handleOpenAbsenceModal = (classId = null) => { setSelectedClassId(classId); setIsAbsenceModalOpen(true); };
  const handleCloseAbsenceModal = () => setIsAbsenceModalOpen(false);
  const handleAnnounceInput = (field, value) => setAnnounceForm(prev => ({ ...prev, [field]: value }));

  // Fetch timetable entries for a class (used by HOD dialog)
  const fetchEntriesForClass = async (classId) => {
    try {
  const res = await api.get(`/api/timetable/class/${classId}`);
  if (res.data && res.data.entries) setAnnounceForm(prev => ({ ...prev, entries: res.data.entries }));
    } catch (e) {
      console.error('Failed to fetch entries for class:', e);
      setError('Failed to fetch entries for class. Please try again later.');
    }
  };

  // Assign replacement for selected timetable entry (calls backend which also creates announcement)
  const handleSendAnnouncement = async () => {
    try {
      const entryId = announceForm.entryId;
      if (!entryId) {
        alert('Please select the timetable session to assign the replacement to.');
        return;
      }

      const payload = { replacementTeacherId: null, replacementName: announceForm.replacementName, reason: announceForm.reason };
  await api.post(`/api/timetable/${entryId}/assign-replacement`, payload);
      setAnnounceDialogOpen(false);
      fetchDashboardData();
      fetchTimetableData();
      alert('Replacement assigned and announcement created.');
    } catch (err) {
      console.error('Failed to assign replacement:', err);
      alert('Failed to assign replacement.');
    }
  };

  useEffect(() => {
    socket.connect();
    try { if (user && user._id) socket.emit('register', { userId: user._id }); } catch (e) { }

    socket.on('venue_updated', (updatedEntry) => {
      setTimetableData(prevData => {
        if (!prevData) return null;
        const day = updatedEntry.dayOfWeek.toLowerCase();
        const newTimetable = { ...prevData.timetable };
        if (newTimetable[day]) {
          const index = newTimetable[day].findIndex(entry => entry._id === updatedEntry._id);
          if (index !== -1) newTimetable[day][index] = updatedEntry;
        }
        return { ...prevData, timetable: newTimetable };
      });

      socket.on('enrollment_requested', (payload) => {
        try { if (!payload) return; setServerEnrollmentNotifications(prev => [{ type: 'requested', ...payload, receivedAt: Date.now() }, ...prev].slice(0, 20)); } catch (e) { console.warn('Error handling enrollment_requested payload:', e); }
      });

      socket.on('enrollment_updated', (payload) => {
        try { if (!payload) return; setServerEnrollmentNotifications(prev => [{ type: 'updated', ...payload, receivedAt: Date.now() }, ...prev].slice(0, 20)); } catch (e) { console.warn('Error handling enrollment_updated payload:', e); }
      });
    });

    return () => { socket.off('venue_updated'); socket.disconnect(); };
  }, [user]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* KPI Cards */}
      {kpiData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Receipt sx={{ mr: 1 }} /> Total Classes
                </Typography>
                <Typography variant="h4">{kpiData.totalClasses || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <HourglassEmpty sx={{ mr: 1 }} /> Total Students
                </Typography>
                <Typography variant="h4">{kpiData.enrolledStudents || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent enrollment events from server */}
      {renderServerEnrollmentNotifications()}

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button variant="outlined" fullWidth startIcon={<ClassIcon />} onClick={() => navigate('/manage-classes')} sx={{ height: 60 }}>
            Manage Classes
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button variant="contained" color="secondary" startIcon={<BookOnline />} onClick={() => navigate('/book-venue')} sx={{ mb: 2, width: '100%' }}>
            Book a Venue
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="My Classes" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Enrollments" icon={<People />} iconPosition="start" />
          <Tab label="Absences" icon={<HourglassEmpty />} iconPosition="start" />
          <Tab label="Announcements" icon={<Announcement />} iconPosition="start" />
          <Tab label="My Timetable" icon={<CalendarToday />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box role="tabpanel" hidden={activeTab !== 0}>{activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Teacher Absence Application */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>Report Absence</Typography>
              <Typography sx={{ mb: 2 }}>If you are unable to attend your classes, please report your absence here.</Typography>
              <Button variant="contained" onClick={() => { if (myClasses && myClasses.length === 1) { setSelectedClassId(myClasses[0]._id); handleOpenAbsenceModal(myClasses[0]._id); } else if (!selectedClassId) alert('Please select a class from the list below to report absence.'); else handleOpenAbsenceModal(selectedClassId); }}>Report Absence</Button>
            </Paper>
          </Grid>

          {/* My Classes and Attendance */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>My Classes</Typography>
            {myClasses && myClasses.length > 0 ? myClasses.map(cls => (
              <Accordion key={cls._id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1 }}>{cls.name}</Typography>
                    <Chip label={`${cls.enrolledStudents?.length || 0} students`} size="small" color="primary" sx={{ mr: 1 }} />
                    <Chip label={`${cls.creditsRequired} credits`} size="small" variant="outlined" />
                    {(() => { const replacement = cls?.replacement || cls?.replacementInfo || cls?.replacementTeacher; const isAssignedToMe = replacement && (replacement.teacher?._id === user?._id || replacement.teacherId === user?._id || replacement.name === user?.name); if (isAssignedToMe) return <Chip label="Assigned (replacement)" color="warning" size="small" sx={{ ml: 1 }} />; return null; })()}
                    <Button size="small" variant="outlined" sx={{ ml: 2 }} onClick={e => { e.stopPropagation(); setSelectedClassId(cls._id); handleOpenAbsenceModal(cls._id); }}>Report Absence</Button>
                    {(user?.role === 'HOD' || user?.role === 'admin') && (
                      <Button size="small" variant="contained" color="secondary" sx={{ ml: 1 }} onClick={async e => { e.stopPropagation(); setAnnounceDialogOpen(true); setAnnounceForm({ classId: cls._id, className: cls.name, replacementName: '', reason: '', entryId: '', entries: [] }); await fetchEntriesForClass(cls._id); }}>Announce Teacher Change</Button>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{cls.description}</Typography>
                  {(() => { const replacement = cls?.replacement || cls?.replacementInfo || cls?.replacementTeacher; if (replacement) { const repName = replacement.teacher?.name || replacement.name || replacement.replacementName || replacement.teacherName; const reason = replacement.reason || replacement.replacementReason || replacement.note || ''; return (<Box sx={{ mb: 1 }}><Chip label={`Replacement: ${repName || 'Assigned'}`} color="warning" size="small" sx={{ mr: 1 }} />{reason && <Typography variant="caption" color="text.secondary">Reason: {reason}</Typography>}</Box>); } return null; })()}

                  </AccordionDetails>
                </Accordion>
              )) : (
                <Typography variant="body2" color="text.secondary">No classes found.</Typography>
              )}
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Other Tabs */}
      <Box role="tabpanel" hidden={activeTab !== 1}>{activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <EnrollmentManager />
        </Paper>
      )}</Box>

      <Box role="tabpanel" hidden={activeTab !== 2}>{activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <AbsenceManager />
        </Paper>
      )}</Box>

      <Box role="tabpanel" hidden={activeTab !== 3}>{activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <AnnouncementManager />
        </Paper>
      )}</Box>

      <Box role="tabpanel" hidden={activeTab !== 4}>{activeTab === 4 && (
        <Paper sx={{ p: 2 }}>
          {timetableData ? (
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(timetableData, null, 2)}</pre>
          ) : <Typography>No timetable available.</Typography>}
        </Paper>
      )}</Box>

      {/* Absence Modal */}
      <TeacherAbsenceModal open={isAbsenceModalOpen} onClose={handleCloseAbsenceModal} classId={selectedClassId} onReported={fetchDashboardData} />

      {/* Announce Dialog */}
      <Dialog open={announceDialogOpen} onClose={() => setAnnounceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Announce Teacher Change</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1">{announceForm.className}</Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <TextField label="Replacement Name" value={announceForm.replacementName} onChange={e => handleAnnounceInput('replacementName', e.target.value)} />
            <TextField label="Reason" value={announceForm.reason} onChange={e => handleAnnounceInput('reason', e.target.value)} multiline rows={3} sx={{ mt: 2 }} />
            <TextField select label="Select Session" value={announceForm.entryId || ''} onChange={e => handleAnnounceInput('entryId', e.target.value)} SelectProps={{ native: true }} sx={{ mt: 2 }}>
              <option value="">-- Select session --</option>
              {announceForm.entries && announceForm.entries.map(en => <option key={en._id} value={en._id}>{`${en.dayOfWeek} ${formatTime(en.startTime)} - ${formatTime(en.endTime)}`}</option>)}
            </TextField>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnounceDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendAnnouncement}>Assign Replacement</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default TeacherDashboardNew;
