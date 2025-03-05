import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  Paper,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Hssm = () => {
  const [showModal, setShowModal] = useState({
    incident: false,
    asset: false,
    task: false,
    meterReading: false,
    Report: false,
  });

  const initialFormData = {
    incident: {
      department: '',
      title: '',
      priority: '',
      description: '',
      date: '',
      file: null,
    },
    asset: {
      name: '',
      serialNumber: '',
      category: 'Fixed Assets',
      location: '',
      'service records': '',
      file: null,
    },
    task: {
      task: '',
      assignedTo: '',
      id: '',
      dueDate: '',
      priority: '',
      'task description': '',
      file: null,
    },
    meterReading: {
      location: '',
      reading: '',
      date: '',
    },
    Report: {
      file: null,
    },
  };

  const [formData, setFormData] = useState(initialFormData);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    maintenanceTasks: 0,
    pendingIncidents: 0,
    meterReadings: [],
  });

  const fetchData = async () => {
    const token = localStorage.getItem('token');

    try {
      const [incidentResponse, assetResponse, taskResponse, meterReadingResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hssm/incidents`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/hssm/assets`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/hssm/tasks`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/hssm/meterReadings`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const incidents = await incidentResponse.json();
      const assets = await assetResponse.json();
      const tasks = await taskResponse.json();
      const meterReadings = await meterReadingResponse.json();

      // Transform the data for the pie chart
      const chartData = meterReadings.map((location, index) => ({
        value: location.readings.length, // display the number of readings per location
        name: location._id, // Use the location ID as the name 
        color: ['#ff0000', '#00ff00', '#0000ff'][index % 3], // Assign colors to each location
      }));

      setDashboardData({
        totalAssets: assets.length || 0,
        maintenanceTasks: tasks.length || 0,
        pendingIncidents: incidents.length || 0,
        meterReadings: chartData,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (modal, field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [modal]: { ...prevFormData[modal], [field]: value },
    }));
  };

  const handleReadingChange = (modal, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [modal]: {
        ...prev[modal],
        [field]: value,
      },
    }));
  };

  const handleFileChange = (modal, file) => {
    setFormData((prev) => ({
      ...prev,
      [modal]: { ...prev[modal], file },
    }));
  };

  const handleSubmit = async (modal) => {
    const endpointMap = {
      incident: `${API_BASE_URL}/api/hssm/incidents`,
      asset: `${API_BASE_URL}/api/hssm/assets`,
      task: `${API_BASE_URL}/api/hssm/tasks`,
      meterReading: `${API_BASE_URL}/api/hssm/meterReadings`,
      Report: `${API_BASE_URL}/api/hssm/reports`,
    };

    const data = new FormData();

    if (modal === 'meterReading') {
      // Handle meterReading data separately
      const { location, reading, date } = formData.meterReading;
      if (!location || !reading || !date) {
        alert('All fields are required for a meter reading');
        return;
      }

      data.append('location', location);
      data.append('reading', reading);
      data.append('date', date);
    } else {
      // Handle other modals as before
      const fields = formData[modal];
      for (const key in fields) {
        if (fields[key] !== null && fields[key] !== undefined) {
          data.append(key, fields[key]);
        }
      }
    }
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(endpointMap[modal], {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (response.ok) {
        alert(`${modal.charAt(0).toUpperCase() + modal.slice(1)} added successfully!`);
        setFormData((prev) => ({ ...prev, [modal]: initialFormData[modal] }));
        toggleModal(modal);
        fetchData();
      } else {
        const errorData = await response.json();
        console.error(`Failed to add ${modal}:`, errorData);
        alert(`Failed to add ${modal}.`);
      }
    } catch (error) {
      console.error(`Error adding ${modal}:`, error);
      alert(`An error occurred while adding ${modal}.`);
    }
  };

  const toggleModal = (modal) => {
    setShowModal((prev) => ({ ...prev, [modal]: !prev[modal] }));
  };

  const renderModalContent = (modal) => (
    <>
      <Typography variant="h6" gutterBottom>
        {`Add ${modal.charAt(0).toUpperCase() + modal.slice(1)}`}
      </Typography>
      {modal === 'meterReading' ? (
        <Box>
          <TextField
            label="Location"
            fullWidth
            sx={{ mb: 2 }}
            value={formData.meterReading.location}
            onChange={(e) => handleReadingChange(modal, 'location', e.target.value)}
          />
          <TextField
            label="Reading"
            fullWidth
            sx={{ mt: 1 }}
            value={formData.meterReading.reading}
            onChange={(e) => handleReadingChange(modal, 'reading', e.target.value)}
            type="number"
          />
          <TextField
            label="Date"
            fullWidth
            sx={{ mt: 1 }}
            value={formData.meterReading.date}
            onChange={(e) => handleReadingChange(modal, 'date', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayIcon />
                </InputAdornment>
              ),
            }}
            type="date"
          />
        </Box>
      ) : (
        Object.keys(formData[modal]).map((field) => {
          if (field === 'priority') {
            return (
              <TextField
                select
                key={field}
                label="Priority"
                fullWidth
                sx={{ mb: 2 }}
                value={formData[modal].priority}
                onChange={(e) => handleInputChange(modal, field, e.target.value)}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </TextField>
            );
          }

          if (field === 'date') {
            return (
              <TextField
                key={field}
                label="Date"
                fullWidth
                sx={{ mb: 2 }}
                value={formData[modal][field]}
                onChange={(e) => handleInputChange(modal, field, e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon />
                    </InputAdornment>
                  ),
                }}
                type="date"
              />
            );
          }

          if (field === 'category') {
            return (
              <TextField
                select
                key={field}
                label="Category"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.asset.category}
                onChange={(e) => handleInputChange('asset', 'category', e.target.value)}
              >
                <MenuItem value="Fixed Assets">Fixed Assets</MenuItem>
                <MenuItem value="Consumables">Consumables</MenuItem>
              </TextField>
            );
          }

          if (field === 'file') {
            return (
              <Button key={field} variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
                Upload File
                <input type="file" hidden onChange={(e) => handleFileChange(modal, e.target.files[0])} />
              </Button>
            );
          }

          return (
            <TextField
              key={field}
              label={field.charAt(0).toUpperCase() + field.replace(/_/g, ' ').slice(1)}
              fullWidth
              sx={{ mb: 2 }}
              value={formData[modal][field]}
              onChange={(e) => handleInputChange(modal, field, e.target.value)}
            />
          );
        })
      )}
      <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => handleSubmit(modal)}>
        Submit
      </Button>
    </>
  );

  const [collectedData, setCollectedData] = useState(null);

  const handleViewData = () => {
    setCollectedData(formData);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Your Inventory
              </Typography>
              <Typography variant="h5">{dashboardData.totalAssets}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Your Pending Incidents
              </Typography>
              <Typography variant="h5">{dashboardData.pendingIncidents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Your Maintenance Tasks
              </Typography>
              <Typography variant="h5">{dashboardData.maintenanceTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Your Meter Readings
              </Typography>
              {dashboardData.meterReadings && dashboardData.meterReadings.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={dashboardData.meterReadings}
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {dashboardData.meterReadings.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || '#8884d8'}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No meter readings available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 4 }}>
        {['incident', 'asset', 'task', 'meterReading', 'Report'].map((modal) => (
          <Grid item xs={12} md={6} lg={3} key={modal}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Add />}
              onClick={() => toggleModal(modal)}
            >
              Add {modal.charAt(0).toUpperCase() + modal.slice(1)}
            </Button>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button
            variant="contained"
            style={{ backgroundColor: 'blue', color: 'white', marginBottom: '10px' }}
            onClick={() => window.location.href = '/total'}
          >
            Available Services
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            style={{ backgroundColor: 'green', color: 'white', marginBottom: '10px' }}
            onClick={handleViewData}
          >
            View Collected Data
          </Button>
        </Grid>
      </Grid>

      {Object.keys(showModal).map((modal) => (
        <Modal
          key={modal}
          open={showModal[modal]}
          onClose={() => toggleModal(modal)}
        >
          <Box sx={modalStyle}>{renderModalContent(modal)}</Box>
        </Modal>
      ))}

      {collectedData && <DataDisplay data={collectedData} />}
    </Box>
  );
};

const DataDisplay = ({ data }) => {
  const theme = useTheme();

  // Define animation variants for Framer Motion
  const animationVariants = {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  };

  // Helper function to format JSON data into a readable format
  const formatData = (data) => {
    if (data === null) {
      return 'null'; // Handle null values explicitly
    } else if (typeof data === 'object') {
      return Object.entries(data).map(([key, value]) => (
        <Box key={key} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:
          </Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            {formatData(value)}
          </Typography>
        </Box>
      ));
    } else {
      return data.toString(); // Handle other primitive values
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationVariants}
      transition={{ type: 'spring', stiffness: 280, damping: 60 }}
    >
      <Paper elevation={3} sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          Collected Data
        </Typography>
        <Grid container spacing={2}>
          {Object.keys(data).map((key) => (
            <Grid item xs={12} md={6} lg={4} key={key}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main, mb: 2 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>
                  <Box sx={{ ml: 1 }}>
                    {formatData(data[key])}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </motion.div>
  );
};

export default Hssm;
