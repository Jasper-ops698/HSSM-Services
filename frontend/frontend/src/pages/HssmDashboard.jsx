import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { rateLimitedRequest } from '../utils/rateLimitedRequest';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const HssmDashboard = () => {
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await rateLimitedRequest({
                    url: `${API_BASE_URL}/api/hssm/dashboard`,
                    method: 'get',
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDashboardData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    const kpis = dashboardData?.kpis || {};
    const charts = dashboardData?.charts || {};

    const incidentsByPriorityData = {
        labels: charts.incidentsByPriority?.map(item => item._id) || [],
        datasets: [{
            label: 'Incidents by Priority',
            data: charts.incidentsByPriority?.map(item => item.count) || [],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
        }],
    };

    const tasksByStatusData = {
        labels: charts.tasksByStatus?.map(item => item._id) || [],
        datasets: [{
            label: 'Tasks by Status',
            data: charts.tasksByStatus?.map(item => item.count) || [],
            backgroundColor: ['#FF9F40', '#4BC0C0', '#FF6384', '#36A2EB'],
        }],
    };

    const KpiCard = ({ title, value }) => (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="h4">{value}</Typography>
        </Paper>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
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
                <Typography variant="h4" component="h1">
                    HSSM Dashboard
                </Typography>
                <Box sx={{ width: 140 }} /> {/* Spacer for centering */}
            </Box>
            
            {/* KPIs */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}><KpiCard title="Total Incidents" value={kpis.totalIncidents} /></Grid>
                <Grid item xs={12} sm={6} md={3}><KpiCard title="Open Incidents" value={kpis.openIncidents} /></Grid>
                <Grid item xs={12} sm={6} md={3}><KpiCard title="Total Assets" value={kpis.totalAssets} /></Grid>
                <Grid item xs={12} sm={6} md={3}><KpiCard title="Overdue Tasks" value={kpis.overdueTasks} /></Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Incidents by Priority</Typography>
                        <Pie data={incidentsByPriorityData} />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Tasks by Status</Typography>
                        <Bar data={tasksByStatusData} />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default HssmDashboard;
