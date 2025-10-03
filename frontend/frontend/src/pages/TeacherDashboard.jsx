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
  RadioGroup,
  FormControlLabel,
  Radio,
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

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const TeacherDashboard = () => {
  const { user } = useAuth();
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [kpiData, setKpiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attendance, setAttendance] = useState({});
    const [activeTab, setActiveTab] = useState(0);
    const [timetableData, setTimetableData] = useState(null);
    const timetableRef = useRef(null);
    const [timetableView, setTimetableView] = useState('today'); // 'today' or 'week'
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

    const getClassStatus = (cls) => {
      try {
        // Use UTC-based day/time comparisons to match backend logic
        const nowMs = Date.now();
        const WEEKDAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

        // Determine today's UTC weekday
        const now = new Date();
        const todayKey = WEEKDAY_KEYS[now.getUTCDay()];

        const entries = cls.timetable ? cls.timetable.filter(e => (e.day || e.dayOfWeek) && ((e.day || e.dayOfWeek).toLowerCase() === todayKey)) : [];
        if (!entries || entries.length === 0) return 'not-started';

        // Base UTC date for today
        const baseDateUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        const parseTimeUTC = (t) => {
          if (!t) return null;
          const parts = t.split(':').map(p => parseInt(p, 10));
          return new Date(Date.UTC(baseDateUTC.getUTCFullYear(), baseDateUTC.getUTCMonth(), baseDateUTC.getUTCDate(), parts[0] || 0, parts[1] || 0, parts[2] || 0));
        };

        for (const e of entries) {
          const start = parseTimeUTC(e.startTime || e.start);
          const end = parseTimeUTC(e.endTime || e.end);
          if (!start || !end) continue;
          const windowStartMs = start.getTime() - 30 * 60 * 1000;
          const windowEndMs = end.getTime() + 30 * 60 * 1000;
          if (nowMs >= windowStartMs && nowMs <= windowEndMs) return 'in-progress';
          if (nowMs > windowEndMs) return 'done';
        }
        return 'not-started';
      } catch (e) {
        return 'not-started';
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

    const fetchTimetableData = useCallback(async () => {
      try {
        let response = await api.get(`/api/timetable/teacher`);
        const data = response?.data || {};
        const hasTimetable = data.timetable && Object.keys(data.timetable).length > 0;

        if (!hasTimetable) {
          const week = getWeekNumber();
          try {
            const retryRes = await api.get(`/api/timetable/teacher`, { params: { week } });
            if (retryRes?.data) {
              response = retryRes;
            }
          } catch (e) {
            console.warn('Fallback teacher timetable fetch failed:', e);
          }
        }

        setTimetableData(response?.data || null);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setTimetableData(null);
      }
    }, []);

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
            // token not used here; rateLimitedRequest handles auth internally
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

    const handleAttendanceChange = (studentId, status) => setAttendance(prev => ({ ...prev, [studentId]: status }));

    const handleMarkAttendance = async (classId) => {
    try {
      // token not used here; api client handles auth internally
  const date = new Date().toISOString().split('T')[0];
  const attendanceArray = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
  await rateLimitedRequest({ url: '/api/teacher/attendance/bulk', method: 'post', data: { classId, date, attendance: attendanceArray } });
        alert('Attendance marked successfully!');
      } catch (err) {
        console.error('Failed to mark attendance:', err);
        alert('Failed to mark attendance.');
      }
    };

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
  // token not used here; api client handles auth internally
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

      // Handle timetable updates
      const handleVenueUpdated = (updatedEntry) => {
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
      };

      // Enrollment event handlers should be registered at mount so teachers receive them
      const handleEnrollmentRequested = (payload) => {
        try {
          if (!payload) return;
          setServerEnrollmentNotifications(prev => [{ type: 'requested', ...payload, receivedAt: Date.now() }, ...prev].slice(0, 20));
        } catch (e) { console.warn('Error handling enrollment_requested payload:', e); }
      };

      const handleEnrollmentUpdated = (payload) => {
        try {
          if (!payload) return;
          setServerEnrollmentNotifications(prev => [{ type: 'updated', ...payload, receivedAt: Date.now() }, ...prev].slice(0, 20));
        } catch (e) { console.warn('Error handling enrollment_updated payload:', e); }
      };

      socket.on('venue_updated', handleVenueUpdated);
      socket.on('enrollment_requested', handleEnrollmentRequested);
      socket.on('enrollment_updated', handleEnrollmentUpdated);

      return () => {
        socket.off('venue_updated', handleVenueUpdated);
        socket.off('enrollment_requested', handleEnrollmentRequested);
        socket.off('enrollment_updated', handleEnrollmentUpdated);
        socket.disconnect();
      };
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
                      {(() => {
                        const status = getClassStatus(cls);
                        if (status === 'in-progress') return <Chip label="In Progress" color="success" size="small" sx={{ ml: 1 }} />;
                        if (status === 'done') return <Chip label="Done" color="default" size="small" sx={{ ml: 1 }} />;
                        return <Chip label="Not Started" color="info" size="small" sx={{ ml: 1 }} />;
                      })()}
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

                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Students</Typography>
                    <List>
                      {cls.enrolledStudents && cls.enrolledStudents.map(student => (
                        <ListItem key={student._id}>
                          <ListItemText primary={student.name} secondary={<Box><Typography variant="body2" color="text.secondary">{student.email}</Typography><Typography variant="body2" color="text.secondary">Credits: {student.credits || 0}</Typography></Box>} />
                          <FormControl component="fieldset">
                            <RadioGroup row value={attendance[student._id] || 'present'} onChange={(e) => handleAttendanceChange(student._id, e.target.value)}>
                              <FormControlLabel value="present" control={<Radio />} label="Present" />
                              <FormControlLabel value="absent" control={<Radio />} label="Absent" />
                            </RadioGroup>
                          </FormControl>
                        </ListItem>
                      ))}
                      {(!cls.enrolledStudents || cls.enrolledStudents.length === 0) && <ListItem><ListItemText primary="No students enrolled in this class" /></ListItem>}
                    </List>

                    {cls.enrolledStudents && cls.enrolledStudents.length > 0 && <Button variant="contained" onClick={() => handleMarkAttendance(cls._id)} sx={{ mt: 2 }}>Mark Attendance for Today</Button>}
                  </AccordionDetails>
                </Accordion>
              )) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">No classes found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>See classes assigned to you to get started</Typography>
                  <Typography variant="body2" color="text.secondary">Go to Manage Classes to view your current and future classes</Typography>
                </Paper>
              )}
            </Grid>

            {/* Class Statistics and Recent Activity */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Recent Absences</Typography>
                <List>
                  {dashboardData?.absences && dashboardData.absences.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>Student Absences</Typography>
                      {dashboardData.absences.slice(0, 5).map(absence => (
                        <ListItem key={absence._id} sx={{ px: 0 }}>
                          <ListItemText primary={absence.student?.name || absence.studentId?.name || 'Unknown'} secondary={<Box><Typography variant="caption" display="block">{new Date(absence.dateOfAbsence || absence.date || absence.createdAt || Date.now()).toLocaleDateString()}</Typography><Typography variant="caption" color="text.secondary">{absence.reason}</Typography><Typography variant="caption" color={(() => { const s = (absence.status || '').toLowerCase(); if (s === 'approved' || s === 'accepted') return 'success.main'; if (s === 'pending' || s === 'awaiting' || s === 'processing' || s === '') return 'error.main'; if (s === 'rejected') return 'error.main'; return 'warning.main'; })()} sx={{ fontWeight: 'bold' }}>Status: {absence.status ? (absence.status.charAt(0).toUpperCase() + absence.status.slice(1)) : 'Pending'}</Typography></Box>} />
                        </ListItem>
                      ))}
                    </>
                  )}

                  {dashboardData?.teacherAbsences && dashboardData.teacherAbsences.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>Your Absence Requests</Typography>
                      {dashboardData.teacherAbsences.slice(0, 5).map(absence => (
                        <ListItem key={absence._id} sx={{ px: 0 }}>
                          <ListItemText primary={absence.class?.name || 'No Class'} secondary={<Box><Typography variant="caption" display="block">{new Date(absence.dateOfAbsence || absence.date || absence.createdAt || Date.now()).toLocaleDateString()}</Typography><Typography variant="caption" color="text.secondary">{absence.reason}</Typography><Typography variant="caption" color={(() => { const s = (absence.status || '').toLowerCase(); if (s === 'approved' || s === 'accepted') return 'success.main'; if (s === 'pending' || s === 'awaiting' || s === 'processing' || s === '') return 'error.main'; if (s === 'rejected') return 'error.main'; return 'warning.main'; })()} sx={{ fontWeight: 'bold' }}>Status: {absence.status?.charAt(0).toUpperCase() + absence.status?.slice(1) || 'Pending'}</Typography></Box>} />
                        </ListItem>
                      ))}
                    </>
                  )}

                  {(!dashboardData?.absences || dashboardData.absences.length === 0) && (!dashboardData?.teacherAbsences || dashboardData.teacherAbsences.length === 0) && (
                    <Typography variant="body2" color="text.secondary">No recent absences</Typography>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}
        </Box>

        {/* Enrollments Tab */}
        <Box role="tabpanel" hidden={activeTab !== 1}>{activeTab === 1 && (<EnrollmentManager openClassId={selectedClassId} />)}</Box>
        {/* Absences Tab */}
        <Box role="tabpanel" hidden={activeTab !== 2}>{activeTab === 2 && (<AbsenceManager />)}</Box>
        {/* Announcements Tab */}
        <Box role="tabpanel" hidden={activeTab !== 3}>{activeTab === 3 && (<AnnouncementManager />)}</Box>

        {/* Timetable Tab */}
        <Box role="tabpanel" hidden={activeTab !== 4}>
          {activeTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">My Teaching Schedule</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant={timetableView === 'today' ? 'contained' : 'outlined'} onClick={() => setTimetableView('today')}>Today</Button>
                  <Button size="small" variant={timetableView === 'week' ? 'contained' : 'outlined'} onClick={() => setTimetableView('week')}>Week</Button>
                </Box>
              </Box>

              {timetableView === 'today' ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
                  {timetableData === null || timetableData === undefined ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} /><Typography>Loading schedule...</Typography></Box>
                  ) : (
                    <Grid container spacing={2}>
                      {(() => {
                        const todayIndex = new Date().getDay();
                        const today = WEEKDAY_KEYS[todayIndex];
                        const todayEntries = (timetableData.timetable && timetableData.timetable[today]) ? timetableData.timetable[today] : [];
                        return todayEntries.length > 0 ? todayEntries.map((item, idx) => {
                          const venueLabel = item?.venue?.name || item?.venue || 'TBA';
                          const departmentLabel = item?.department || 'General';
                          const primaryTeacherId = item?.teacher?._id || item?.teacher;
                          const primaryTeacherName = item?.teacher?.name || item?.teacherName || item?.assignedTeacher?.name || 'TBA';
                          const replacement = item?.replacement || item?.replacementInfo || item?.replacementTeacher;
                          const replacementTeacherId = replacement && (replacement.teacher?._id || replacement.teacher);
                          const replacementName = replacement && (replacement.teacher?.name || replacement.name || replacement.teacherName || replacement.replacementName);
                          const replacementReason = replacement && (replacement.reason || replacement.replacementReason || replacement.note || '');
                          const isCovering = Boolean(item?.isReplacementAssignment);
                          const replacementIsDifferent = replacementTeacherId && primaryTeacherId && String(replacementTeacherId) !== String(primaryTeacherId);

                          return (
                            <Grid item xs={12} md={6} key={item._id || `${today}-${idx}`}>
                              <Card sx={{ border: '1px solid #e0e0e0' }}>
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="h6" fontWeight="bold">{item?.subject || 'Untitled class'}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Chip label={`${formatTime(item?.startTime)} - ${formatTime(item?.endTime)}`} size="small" color="primary" />
                                      {isCovering && <Chip label="Covering" size="small" color="warning" />}
                                      {!isCovering && replacementIsDifferent && <Chip label="Replacement Assigned" size="small" color="warning" />}
                                    </Box>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>📍 {venueLabel}</Typography>
                                  <Typography variant="body2" color="text.secondary">� Department: {departmentLabel}</Typography>
                                  {isCovering ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>👩‍🏫 Covering for <strong>{primaryTeacherName}</strong></Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>👩‍🏫 Teacher: <strong>{primaryTeacherName}</strong></Typography>
                                  )}
                                  {replacementName && (!isCovering || replacementReason) && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>� Replacement: {replacementName}{replacementReason ? ` — ${replacementReason}` : ''}</Typography>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        }) : <Grid item xs={12}><Typography>No classes scheduled for today.</Typography></Grid>;
                      })()}
                    </Grid>
                  )}
                </Box>
              ) : (
                <Box>
                  {timetableData?.timetable ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                        const dayEntries = timetableData.timetable[day] || [];
                        return (
                          <Card key={day} variant="outlined">
                            <CardContent sx={{ pb: '16px !important' }}>
                              <Typography variant="h6" sx={{ mb: 1, textTransform: 'capitalize' }}>{day}</Typography>
                              {dayEntries.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {dayEntries.map((item) => {
                                    const venueLabel = item?.venue?.name || item?.venue || 'TBA';
                                    const departmentLabel = item?.department || 'General';
                                    const primaryTeacherId = item?.teacher?._id || item?.teacher;
                                    const primaryTeacherName = item?.teacher?.name || item?.teacherName || item?.assignedTeacher?.name || 'TBA';
                                    const replacement = item?.replacement || item?.replacementInfo || item?.replacementTeacher;
                                    const replacementTeacherId = replacement && (replacement.teacher?._id || replacement.teacher);
                                    const replacementName = replacement && (replacement.teacher?.name || replacement.name || replacement.teacherName || replacement.replacementName);
                                    const replacementReason = replacement && (replacement.reason || replacement.replacementReason || replacement.note || '');
                                    const isCovering = Boolean(item?.isReplacementAssignment);
                                    const replacementIsDifferent = replacementTeacherId && primaryTeacherId && String(replacementTeacherId) !== String(primaryTeacherId);

                                    return (
                                      <Box key={item._id} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                          <Typography variant="subtitle2" fontWeight="bold">{item.subject}</Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" color="primary">{item.startTime} - {item.endTime}</Typography>
                                            {isCovering && <Chip label="Covering" size="small" color="warning" />}
                                            {!isCovering && replacementIsDifferent && <Chip label="Replacement Assigned" size="small" color="warning" />}
                                          </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">📍 {venueLabel} • 👥 {departmentLabel}</Typography>
                                        {isCovering ? (
                                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>👩‍🏫 Covering for <strong>{primaryTeacherName}</strong></Typography>
                                        ) : (
                                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>👩‍🏫 Teacher: <strong>{primaryTeacherName}</strong></Typography>
                                        )}
                                        {replacementName && (!isCovering || replacementReason) && (
                                          <Typography variant="caption" color="text.secondary">🔁 Replacement: {replacementName}{replacementReason ? ` — ${replacementReason}` : ''}</Typography>
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              ) : <Typography variant="body2" color="text.secondary">No classes scheduled</Typography>}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  ) : <Typography>Loading schedule...</Typography>}
                </Box>
              )}

              {/* Schedule Summary */}
              {timetableData && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Schedule Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}><Typography variant="body2" color="text.secondary">Total Classes</Typography><Typography variant="h6">{timetableData.totalEntries || 0}</Typography></Grid>
                      <Grid item xs={6} sm={3}><Typography variant="body2" color="text.secondary">Today's Classes</Typography><Typography variant="h6">{(() => { const todayIndex = new Date().getDay(); const todayKey = WEEKDAY_KEYS[todayIndex]; return timetableData.timetable?.[todayKey]?.length || 0; })()}</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Box>
        <TeacherAbsenceModal open={isAbsenceModalOpen} onClose={handleCloseAbsenceModal} userId={user?._id} classId={selectedClassId} refreshAbsences={fetchDashboardData} />

        {/* HOD Announce Teacher Change Dialog */}
        <Dialog open={announceDialogOpen} onClose={() => setAnnounceDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Announce Teacher Change</DialogTitle>
          <DialogContent>
            <TextField margin="dense" label="Class" fullWidth value={announceForm.className} disabled />
            <TextField select margin="dense" label="Session" fullWidth SelectProps={{ native: true }} value={announceForm.entryId} onChange={(e) => handleAnnounceInput('entryId', e.target.value)}>
              <option value="">-- Select session --</option>
              {announceForm.entries && announceForm.entries.map(ent => (
                <option key={ent._id} value={ent._id}>{`${ent.dayOfWeek} ${ent.startTime}-${ent.endTime} @ ${ent.venue ? ent.venue.name || ent.venue : ent.venue || 'TBA'}`}</option>
              ))}
            </TextField>
            <TextField margin="dense" label="Replacement Teacher Name" fullWidth value={announceForm.replacementName} onChange={(e) => handleAnnounceInput('replacementName', e.target.value)} />
            <TextField margin="dense" label="Reason" fullWidth multiline rows={3} value={announceForm.reason} onChange={(e) => handleAnnounceInput('reason', e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAnnounceDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendAnnouncement}>Send Announcement</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

export default TeacherDashboard;
