import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Add, Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TARGET_GROUPS = [
  {
    id: 'dept-students',
    label: 'Students in My Department',
    roles: ['teacher', 'HOD'],
    targetRoles: ['student'],
    targetScope: 'department',
    requiresDepartment: true
  },
  {
    id: 'dept-teachers',
    label: 'Teachers in My Department',
    roles: ['teacher', 'HOD'],
    targetRoles: ['teacher'],
    targetScope: 'department',
    requiresDepartment: true
  },
  {
    id: 'global-students',
    label: 'All Students',
    roles: ['HOD', 'admin'],
    targetRoles: ['student'],
    targetScope: 'global'
  },
  {
    id: 'global-teachers',
    label: 'All Teachers',
    roles: ['HOD', 'admin'],
    targetRoles: ['teacher'],
    targetScope: 'global'
  },
  {
    id: 'global-hods',
    label: 'All HODs',
    roles: ['HOD', 'admin'],
    targetRoles: ['HOD'],
    targetScope: 'global'
  }
];

const getAnnouncementAudienceLabel = (announcement) => {
  if (!announcement) return '';
  const roleArray = Array.isArray(announcement.targetRoles) ? announcement.targetRoles : [announcement.targetRoles];
  const role = (roleArray[0] || '').toLowerCase();
  const scope = announcement.targetScope || (announcement.department ? 'department' : 'global');
  const departmentName = announcement.department;

  if (scope === 'global') {
    if (role === 'teacher') return 'All Teachers';
    if (role === 'hod') return 'All HODs';
    if (role === 'student') return 'All Students';
    if (role === 'admin') return 'All Admins';
    if (role === 'credit-controller') return 'All Credit Controllers';
    if (role === 'hssm-provider') return 'All HSSM Providers';
    return 'All Users';
  }

  if (scope === 'department') {
    const suffix = departmentName ? ` — ${departmentName}` : '';
    if (role === 'teacher') return `Teachers in Department${suffix}`;
    if (role === 'student') return `Students in Department${suffix}`;
    return `Department Audience${suffix}`;
  }

  return '';
};

const mapAnnouncementToGroup = (announcement) => {
  if (!announcement) return '';
  const roleArray = Array.isArray(announcement.targetRoles) ? announcement.targetRoles : [announcement.targetRoles];
  const rawRole = roleArray[0];
  const role = typeof rawRole === 'string' ? rawRole.toLowerCase() : rawRole;
  const scope = announcement.targetScope || (announcement.department ? 'department' : 'global');

  if (!role) return '';

  if (scope === 'department') {
    if (role === 'student' || role === 'all') return 'dept-students';
    if (role === 'teacher') return 'dept-teachers';
  }

  if (scope === 'global') {
    if (role === 'student' || role === 'all') return 'global-students';
    if (role === 'teacher') return 'global-teachers';
    if (role === 'hod') return 'global-hods';
  }

  return '';
};

const AnnouncementManager = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetClass: '',
    targetAudience: 'all', // 'all', 'class', 'specific'
    specific: [],
    isActive: true,
    targetGroup: ''
  });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  const targetGroupOptions = useMemo(() => {
    if (!user || !user.role) return [];
    return TARGET_GROUPS.filter(group => {
      if (!group.roles.includes(user.role)) return false;
      if (group.requiresDepartment && !user.department) return false;
      return true;
    });
  }, [user]);

  useEffect(() => {
    if (formData.targetGroup || !targetGroupOptions.length) return;
    setFormData(prev => ({ ...prev, targetGroup: targetGroupOptions[0].id }));
  }, [formData.targetGroup, targetGroupOptions]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/announcements');
      setAnnouncements(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const shouldFetchClassData = ['teacher', 'HOD'].includes(user?.role);
      const requests = [
        api.get('/api/announcements'),
        shouldFetchClassData ? api.get('/api/teacher/classes') : Promise.resolve({ data: [] }),
        shouldFetchClassData ? api.get('/api/teacher/students') : Promise.resolve({ data: [] })
      ];

      const [annRes, classRes, studentRes] = await Promise.allSettled(requests);

      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value.data);
      } else {
        throw annRes.reason;
      }

      if (classRes.status === 'fulfilled') {
        setAvailableClasses(classRes.value.data || []);
      } else {
        setAvailableClasses([]);
      }

      if (studentRes.status === 'fulfilled') {
        setAvailableStudents(studentRes.value.data || []);
      } else {
        setAvailableStudents([]);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load required data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  const handleCreateOpen = () => {
    setFormData({
      title: '',
      content: '',
      targetClass: '',
      targetAudience: 'all',
      specific: [],
      isActive: true,
      targetGroup: targetGroupOptions[0]?.id || ''
    });
    setOpenCreateDialog(true);
  };

  const handleEditOpen = (announcement) => {
    setCurrentAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content || announcement.message || '',
      targetClass: announcement.targetClass || '',
      targetAudience: announcement.targetAudience || 'all',
      specific: announcement.specific || [],
      isActive: announcement.isActive !== undefined ? announcement.isActive : (announcement.active !== undefined ? announcement.active : true),
      targetGroup: mapAnnouncementToGroup(announcement) || targetGroupOptions[0]?.id || ''
    });
    setOpenEditDialog(true);
  };

  const handleClose = () => {
    setOpenCreateDialog(false);
    setOpenEditDialog(false);
    setCurrentAnnouncement(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveAnnouncement = async () => {
    setIsSubmitting(true);
    setError('');

    const selectedGroup = targetGroupOptions.find(group => group.id === formData.targetGroup);

    if (!selectedGroup) {
      setError('Please select a valid target group.');
      setIsSubmitting(false);
      return;
    }

    const departmentValue = selectedGroup.targetScope === 'department'
      ? (currentAnnouncement?.department || user?.department || null)
      : null;

    if (selectedGroup.targetScope === 'department' && !departmentValue) {
      setError('Unable to determine the department for this announcement.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content,
      message: formData.content,
      targetAudience: formData.targetAudience,
      specific: formData.specific,
      isActive: formData.isActive,
      active: formData.isActive,
      targetClass: formData.targetAudience === 'class' ? formData.targetClass : undefined,
      targetRoles: selectedGroup.targetRoles,
      targetScope: selectedGroup.targetScope,
      department: selectedGroup.targetScope === 'department' ? departmentValue : null
    };

    if (formData.targetAudience !== 'specific') {
      delete payload.specific;
    }

    if (formData.targetAudience !== 'class') {
      delete payload.targetClass;
    }

    try {
      if (currentAnnouncement) {
        await api.put(`/api/announcements/${currentAnnouncement._id}`, payload);
      } else {
        await api.post('/api/announcements', payload);
      }
      handleClose();
      fetchAnnouncements();
    } catch (err) {
      console.error(`Error ${currentAnnouncement ? 'updating' : 'creating'} announcement:`, err);
      setError(`Failed to ${currentAnnouncement ? 'update' : 'create'} announcement. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setIsSubmitting(true);
      setError('');
      try {
        await api.delete(`/api/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        console.error('Error deleting announcement:', err);
        setError('Failed to delete announcement. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    setError('');
    try {
      await api.patch(`/api/announcements/${id}/status`, { isActive: !currentStatus });
      fetchAnnouncements();
    } catch (err) {
      console.error('Error toggling announcement status:', err);
      setError('Failed to update announcement status. Please try again.');
    }
  };

  const AnnouncementDialog = ({ open, onClose, onSave, isEdit }) => {
    const selectedTargetGroup = targetGroupOptions.find(group => group.id === formData.targetGroup);

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          name="title"
          label="Announcement Title"
          fullWidth
          variant="outlined"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
        <TextField
          margin="dense"
          name="content"
          label="Announcement Content"
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={formData.content}
          onChange={handleInputChange}
          required
        />

        {targetGroupOptions.length > 0 ? (
          <FormControl fullWidth margin="dense">
            <InputLabel>Target Group</InputLabel>
            <Select
              name="targetGroup"
              value={formData.targetGroup}
              onChange={handleInputChange}
              label="Target Group"
            >
              {targetGroupOptions.map(group => (
                <MenuItem key={group.id} value={group.id}>{group.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You do not have permission to broadcast announcements to any group.
          </Alert>
        )}

        {selectedTargetGroup && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Selected audience: {selectedTargetGroup.label}
          </Typography>
        )}

        <FormControl fullWidth margin="dense">
          <InputLabel>Target Audience</InputLabel>
          <Select
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleInputChange}
            label="Target Audience"
          >
            <MenuItem value="all">All Students</MenuItem>
            <MenuItem value="class">Specific Class</MenuItem>
            <MenuItem value="specific">Specific Students</MenuItem>
          </Select>
        </FormControl>

        {formData.targetAudience === 'class' && (
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Class</InputLabel>
            <Select
              name="targetClass"
              value={formData.targetClass}
              onChange={handleInputChange}
              label="Select Class"
            >
              {availableClasses.map(cls => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {formData.targetAudience === 'specific' && (
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Students</InputLabel>
            <Select
              name="specific"
              multiple
              value={formData.specific}
              onChange={handleInputChange}
              label="Select Students"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const student = availableStudents.find(s => s._id === value);
                    return (
                      <Chip key={value} label={student ? student.name : value} />
                    );
                  })}
                </Box>
              )}
            >
              {availableStudents.map(student => (
                <MenuItem key={student._id} value={student._id}>
                  {student.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControlLabel
          control={
            <Switch
              name="isActive"
              checked={formData.isActive}
              onChange={handleSwitchChange}
              color="primary"
            />
          }
          label="Make announcement active"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={onSave} variant="contained" color="primary" disabled={isSubmitting || !selectedTargetGroup}>
          {isSubmitting ? <CircularProgress size={24} /> : (isEdit ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Manage Announcements</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={handleCreateOpen}
        >
          Create Announcement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {announcements.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No announcements yet</Typography>
              <Typography variant="body2" color="textSecondary">
                Create your first announcement to inform students about important updates.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          announcements.map(announcement => {
            const isCreator = announcement.createdBy?._id === user?._id;
            const canModify = isCreator || user?.role === 'admin' || user?.role === 'HOD';
            const isActive = announcement.active !== undefined
              ? announcement.active
              : (announcement.isActive !== undefined ? announcement.isActive : true);
            const message = announcement.message || announcement.content || '';
            const baseAudienceLabel = getAnnouncementAudienceLabel(announcement) || 'All Students';

            let secondaryAudienceLabel = baseAudienceLabel;
            if (announcement.targetAudience === 'class') {
              const className = availableClasses.find(c => c._id === announcement.targetClass)?.name;
              secondaryAudienceLabel = `${baseAudienceLabel} • Class: ${className || 'N/A'}`;
            } else if (announcement.targetAudience === 'specific') {
              secondaryAudienceLabel = `${baseAudienceLabel} • ${announcement.specific?.length || 0} Student(s)`;
            }

            const departmentChip = announcement.targetScope === 'department' && announcement.department
              ? announcement.department
              : null;

            return (
              <Grid item xs={12} sm={6} md={4} key={announcement._id}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isActive ? 1 : 0.7
                }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" gutterBottom sx={{ pr: 1 }}>
                        {announcement.title}
                      </Typography>
                      {canModify && (
                        <Box>
                          <IconButton
                            size="small"
                            color={isActive ? 'success' : 'default'}
                            onClick={() => handleToggleActive(announcement._id, isActive)}
                            title={isActive ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
                          >
                            {isActive ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditOpen(announcement)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Created: {new Date(announcement.createdAt).toLocaleDateString()} by {announcement.createdBy?.name || 'Unknown'}
                    </Typography>

                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {message.length > 140 ? `${message.slice(0, 140)}…` : message || 'No additional details provided.'}
                    </Typography>

                    <Box sx={{ mt: 'auto', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip
                        label={isActive ? 'Active' : 'Inactive'}
                        color={isActive ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={secondaryAudienceLabel}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {departmentChip && (
                        <Chip
                          label={departmentChip}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {announcement.priority && (
                        <Chip
                          label={`Priority: ${announcement.priority}`}
                          size="small"
                          color={announcement.priority === 'high' ? 'error' : (announcement.priority === 'low' ? 'info' : 'warning')}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      <AnnouncementDialog
        open={openCreateDialog || openEditDialog}
        onClose={handleClose}
        onSave={handleSaveAnnouncement}
        isEdit={!!currentAnnouncement}
      />
    </Box>
  );
};

export default AnnouncementManager;
