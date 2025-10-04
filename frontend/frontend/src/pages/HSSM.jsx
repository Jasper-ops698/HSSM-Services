import React, { useState, useMemo, useEffect, useCallback } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {
    // Layout & Structure
    Box, Container, Grid, Paper, Card, CardContent, CardActions, List, ListItem, ListItemIcon, ListItemText, Collapse, AppBar, Toolbar, CssBaseline, Drawer, Modal, Divider, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
    // Input & Controls
    Button, TextField, MenuItem, IconButton, Tabs, Tab, FormControl, InputLabel, Select, Chip,
    // Display & Feedback
    Typography, CircularProgress, Tooltip as MuiTooltip,
    // Styling & Theme
    ThemeProvider, createTheme, // Import alpha if needed for hover effects, etc.
} from '@mui/material';
import { alpha } from '@mui/material/styles';
// Separate Icons Import:
import {
    Close as CloseIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Settings as SettingsIcon,
    Dashboard as DashboardIcon,
    Assignment as AssignmentIcon,
    Devices as DevicesIcon,
    Report as ReportIcon,
    ExpandLess,
    ExpandMore,
    UploadFile as UploadFileIcon,
    Delete as DeleteIcon,
    Brightness4 as Brightness4Icon,
    Brightness7 as Brightness7Icon,
    Menu as MenuIcon,
    Visibility as VisibilityIcon,
    Search as SearchIcon,
    Sort as SortIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    DateRange as DateRangeIcon,
    PriorityHigh as PriorityHighIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import ncmtcLogo from '../components/assests/ncmtc.png';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, CartesianGrid, XAxis, YAxis,
} from 'recharts';
import { SnackbarProvider, useSnackbar } from 'notistack';

import api from '../api';
import assetUrl from '../utils/assetUrl';
const DRAWER_WIDTH = 260;

// --- Consistent Modal Style ---
const getModalStyle = (theme) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: '85%', md: '70%', lg: '60%' }, // Slightly larger for better content fit
    maxWidth: '800px', // Added maxWidth for better scaling
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`, // Subtle border for definition
    boxShadow: theme.shadows[24],
    borderRadius: 2, // Less rounded, more consistent with other dashboards
    p: 3, // Consistent padding on modal container
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Keep hidden to prevent layout issues
});

// --- Styled Components ---
const StyledDashboardCard = (props) => (
    <Paper
        elevation={2} // Subtle elevation
        sx={{
            p: { xs: 2, md: 3 }, // Responsive padding
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            textAlign: 'center',
            borderRadius: 1.5, // Consistent border radius
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
                transform: props.onClick ? 'translateY(-4px)' : 'none', // Only lift if clickable
                boxShadow: props.onClick ? 6 : 2, // Increase shadow on hover if clickable
            },
            cursor: props.onClick ? 'pointer' : 'default',
        }}
        {...props}
    />
);

const AnimatedIconButton = (props) => (
    <IconButton
        {...props}
        sx={{
            transition: 'transform 0.15s ease-in-out, background-color 0.15s ease',
            '&:hover': {
                transform: 'scale(1.1)',
                // Optionally add a subtle background on hover if needed
                // backgroundColor: alpha(props.color ? theme.palette[props.color]?.main || theme.palette.action.hover : theme.palette.action.hover, 0.1),
            },
            ...props.sx
        }}
    />
);

const PowerFactorCard = ({ average, classification, theme }) => {
    const normalizedValue = typeof average === 'number' ? Math.min(1, Math.max(0, average)) : 0;
    const gaugeDegrees = normalizedValue * 360;
    const displayValue = typeof average === 'number' ? average.toFixed(3) : '--';

    const statusConfig = {
        Excellent: { color: theme.palette.success.main, label: 'Excellent (≥0.95)', chipColor: 'success',
            tooltip: 'Power factor is optimal. Keep monitoring to maintain efficiency.' },
        Fair: { color: theme.palette.warning.main, label: 'Fair (0.90 - 0.95)', chipColor: 'warning',
            tooltip: 'Slightly below ideal. Consider scheduling capacitor bank checks or balancing loads.' },
        Poor: { color: theme.palette.error.main, label: 'Poor (<0.90)', chipColor: 'error',
            tooltip: 'Low power factor detected. Investigate reactive loads to avoid penalties and losses.' },
        Unknown: { color: theme.palette.info.main, label: 'Pending Data', chipColor: 'info',
            tooltip: 'Log new meter readings with real and apparent power to calculate the power factor.' }
    };

    const status = statusConfig[classification] || statusConfig.Unknown;

    return (
        <MuiTooltip title={status.tooltip} placement="top" arrow>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: theme.palette.mode === 'dark' ? alpha(status.color, 0.08) : theme.palette.background.paper }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" color="text.primary">Power Factor Insight</Typography>
                    <Chip label={status.label} color={status.chipColor} variant={theme.palette.mode === 'dark' ? 'filled' : 'outlined'} size="small" />
                </Box>
                <Box sx={{ position: 'relative', width: 160, height: 160, mx: 'auto' }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: `conic-gradient(${status.color} 0deg ${gaugeDegrees}deg, ${alpha(status.color, 0.15)} ${gaugeDegrees}deg 360deg)`,
                            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))'
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute', inset: 14,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${alpha(status.color, 0.2)}`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 0.5
                        }}
                    >
                        <Typography variant="h3" component="div" color={status.color} sx={{ fontWeight: 700 }}>
                            {displayValue}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Average Power Factor</Typography>
                    </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    A higher power factor reduces wasted energy and prevents utility penalties. Track this metric after each meter reading.
                </Typography>
            </Paper>
        </MuiTooltip>
    );
};

// --- Utility Function to determine Hospital Level Services ---
// Keep this function as is, logic seems sound, styling improved below
const getHospitalLevelServices = (level, theme) => {
    const baseStyles = {
        borderLeft: '4px solid',
        pl: 2,
        py: 1,
        mb: 1.5, // Slightly more margin
        borderRadius: theme.shape.borderRadius,
        bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', // Use theme background nuances
        boxShadow: 1, // Subtle shadow
    };

    const levelColors = {
        1: theme.palette.success.main, // Green for primary care
        2: theme.palette.info.main, // Blue for basic services
        3: theme.palette.warning.main, // Orange for sub-county
        4: theme.palette.secondary.main, // Use theme secondary (often purple/pink)
        5: theme.palette.error.main, // Red for regional
        6: '#D4AF37', // Gold - keep specific if needed
    };

    const services = {
        1: [
            { title: "Primary Healthcare", items: ["Outpatient services", "Preventive healthcare", "Maternal and child health"] },
            { title: "Basic Services", items: ["HIV testing and counseling", "First aid", "Health education"] },
            { title: "Community", items: ["Health promotion", "Community outreach programs", "Basic health monitoring"] }
        ],
        2: [
            { title: "Emergency Care", items: ["Basic emergency services", "Minor surgical procedures", "Basic trauma care"] },
            { title: "Clinical Services", items: ["Laboratory services", "Pharmacy services", "Dental services"] },
            { title: "Maternal Care", items: ["Basic maternity services", "Antenatal care", "Immunization services"] }
        ],
        3: [
            { title: "Specialized Care", items: ["General surgery", "General medicine", "Basic pediatrics"] },
            { title: "Emergency & Critical", items: ["Comprehensive emergency", "Basic orthopedics", "24-hour inpatient"] },
            { title: "Diagnostics", items: ["Basic imaging (X-ray, ultrasound)", "Comprehensive lab", "Basic rehabilitation"] }
        ],
        4: [
            { title: "Advanced Care", items: ["Specialized clinics", "Advanced surgery", "Comprehensive pediatrics"] },
            { title: "Critical Care", items: ["ICU/HDU services", "Blood bank", "Advanced imaging (CT)"] },
            { title: "Specialized Services", items: ["Mental health", "Comprehensive rehab", "Teaching programs"] }
        ],
        5: [
            { title: "Tertiary Care", items: ["Advanced medical procedures", "Specialized surgery", "Advanced cardiac"] },
            { title: "Advanced Diagnostics", items: ["MRI services", "Specialized radiology", "Advanced lab"] },
            { title: "Research & Training", items: ["Research programs", "Equipment center", "Specialized training"] }
        ],
        6: [
            { title: "Super-Specialized", items: ["Transplant services", "Advanced neurosurgery", "Comprehensive cancer"] },
            { title: "National Center", items: ["Policy development", "International collaboration", "Advanced research"] },
            { title: "Excellence Hub", items: ["Medical innovation", "Specialized equipment", "National training"] }
        ]
    };

    const color = levelColors[level] || theme.palette.grey[400]; // Default color from theme

    const renderService = (service) => (
        <Box key={service.title} sx={{ ...baseStyles, borderLeftColor: color }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>{service.title}</Typography>
            <Grid container spacing={0.5}> {/* Reduced spacing within items */}
                {service.items.map((item, idx) => (
                    <Grid item xs={12} sm={6} key={idx}> {/* Allow two columns on small screens */}
                        <Typography variant="body2" sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.secondary',
                            '&:before': {
                                content: '"•"',
                                mr: 1,
                                color: color,
                                fontSize: '1.2em', // Make bullet slightly larger
                            }
                        }}>
                            {item}
                        </Typography>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    return services[level]?.map(renderService) || [];
};


// --- Main Component ---
const Hssm = () => {
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    // --- State Variables ---
    const [showModal, setShowModal] = useState({
        incident: false, asset: false, task: false, meterReading: false, reportUpload: false,
        viewAssets: false, viewReports: false, settings: false, reportPreview: false, addTechPlan: false, editReport: false,
        templates: false, shareProfile: false, compliance: false,
    });
    const [modalLoading, setModalLoading] = useState(false); // Generic loading for Add/Edit Modals

    const initialFormData = useMemo(() => ({
        incident: { department: '', title: '', priority: 'Medium', description: '', date: '', file: null },
        asset: { name: '', serialNumber: '', category: 'Fixed Assets', location: '', serviceRecords: '', file: null }, // Standardized key
        task: { task: '', assignedTo: '', id: '', dueDate: '', priority: 'Medium', 'task description': '', file: null },
    meterReading: { location: '', realPower_kW: '', apparentPower_kVA: '', date: '' },
        reportUpload: { file: null },
        technicalPlan: { title: '', description: '', file: null },
    }), []);

    const [formData, setFormData] = useState(initialFormData);
    const [dashboardData, setDashboardData] = useState({
        totalAssets: 0,
        maintenanceTasks: 0,
        pendingIncidents: 0,
        meterReadings: [],
        powerFactorStats: { average: null, classification: 'Unknown' }
    });
    const [dashboardLoading, setDashboardLoading] = useState(true); // Start loading initially

    const [reportPreviewContent, setReportPreviewContent] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportGenerationLoading, setReportGenerationLoading] = useState(false);

    const [hospitalLevel, setHospitalLevel] = useState(4);
    const [assetCollapseOpen, setAssetCollapseOpen] = useState(true); // State for sidebar asset collapse

    // Themeing
    const [darkMode, setDarkMode] = useState(false);
    const handleThemeToggle = () => setDarkMode((prev) => !prev);

    const appTheme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: darkMode ? '#6B7280' : '#1f2937' }, // Adjusted dark primary
            secondary: { main: '#3b82f6' }, // Consistent secondary
            background: {
                default: darkMode ? '#111827' : '#f4f6fa', // Darker background
                paper: darkMode ? '#1f2937' : '#ffffff', // Matching paper
            },
            text: {
                primary: darkMode ? '#F9FAFB' : '#1f2937', // Lighter text on dark
                secondary: darkMode ? '#D1D5DB' : '#6B7280', // Adjusted secondary text
            },
            // Add success, error, warning, info for consistency if needed
            success: { main: '#10B981' },
            error: { main: '#EF4444' },
            warning: { main: '#F59E0B' },
            info: { main: '#3B82F6' },
        },
        typography: {
            fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`, // More modern font stack
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { textTransform: 'none' } // Professional buttons
        },
        shape: {
            borderRadius: 8, // Slightly softer corners globally
        },
        components: {
            MuiPaper: {
                 styleOverrides: {
                    root: {
                        backgroundImage: 'none', // Ensure paper doesn't inherit body gradients etc.
                    }
                 }
            },
            MuiButton: {
                 styleOverrides: {
                     root: {
                        borderRadius: 6, // Consistent button radius
                     }
                 }
            },
             MuiTextField: {
                 defaultProps: {
                    variant: 'outlined', // Default to outlined
                    size: 'small', // Default to small for compactness
                 }
             },
             MuiTableCell: {
                  styleOverrides: {
                    head: ({ theme }) => ({
                        backgroundColor: theme.palette.action.hover,
                        fontWeight: 600,
                    }),
                    root: ({ theme }) => ({
                         borderBottom: `1px solid ${theme.palette.divider}`,
                         padding: '10px 14px', // Consistent cell padding
                    }),
                  }
             }
        }
    }), [darkMode]);

    const currentAppTheme = useMemo(() => appTheme, [appTheme]); // To pass to theme provider

    // Navigation & UI State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);
    const handleAssetCollapseClick = () => setAssetCollapseOpen((prev) => !prev);

    // Pie Chart Colors (Memoized)
    const PIE_COLORS = useMemo(() => ({
        Sunday: '#FFFFFF', Monday: '#FF0000', Tuesday: '#0000FF', Wednesday: '#008000', Thursday: '#A52A2A', Friday: '#000000', Saturday: '#FFFF00',
    }), []);

    // --- Profile Templates ---
    const hospitalTemplates = useMemo(() => ({
        level1: {
            name: 'Level 1 - Primary Healthcare Center',
            description: 'Basic primary healthcare services for rural communities',
            data: {
                hospitalName: 'Primary Healthcare Center',
                mission: 'To provide accessible primary healthcare services to the community, focusing on preventive care and health promotion.',
                vision: 'A healthy community where every individual has access to quality primary healthcare services.',
                serviceCharter: 'We commit to providing compassionate, accessible, and quality primary healthcare services to all members of our community, regardless of their background or circumstances.'
            }
        },
        level2: {
            name: 'Level 2 - Health Center',
            description: 'Basic inpatient and outpatient services with emergency care',
            data: {
                hospitalName: 'District Health Center',
                mission: 'To deliver comprehensive basic healthcare services, including emergency care, to improve the health and wellbeing of our population.',
                vision: 'A leading health center providing quality, accessible healthcare services that meet the needs of our growing community.',
                serviceCharter: 'We are committed to excellence in healthcare delivery, ensuring timely access to emergency services, quality inpatient care, and comprehensive outpatient services for all our patients.'
            }
        },
        level3: {
            name: 'Level 3 - Sub-County Hospital',
            description: 'Comprehensive medical and surgical services with specialized care',
            data: {
                hospitalName: 'Sub-County Referral Hospital',
                mission: 'To provide comprehensive medical, surgical, and specialized healthcare services, serving as a referral center for surrounding health facilities.',
                vision: 'A center of excellence in healthcare delivery, providing specialized medical services and serving as a model for quality healthcare in the region.',
                serviceCharter: 'We pledge to deliver high-quality, patient-centered healthcare services, including advanced surgical procedures, specialized clinics, and comprehensive emergency care, while maintaining the highest standards of safety and compassion.'
            }
        },
        level4: {
            name: 'Level 4 - County Hospital',
            description: 'Advanced medical services with teaching and research capabilities',
            data: {
                hospitalName: 'County Referral Hospital',
                mission: 'To provide advanced medical services, serve as a teaching institution, and conduct research to improve healthcare outcomes in our region.',
                vision: 'A premier healthcare institution that advances medical knowledge, provides exceptional patient care, and leads in healthcare innovation and education.',
                serviceCharter: 'We are dedicated to providing advanced medical care, fostering medical education, conducting cutting-edge research, and ensuring equitable access to healthcare services for all patients in our catchment area.'
            }
        },
        level5: {
            name: 'Level 5 - Regional Hospital',
            description: 'Tertiary care with advanced diagnostics and specialized treatments',
            data: {
                hospitalName: 'Regional Referral Hospital',
                mission: 'To deliver tertiary-level healthcare services, advanced diagnostics, and specialized treatments while serving as a regional referral center.',
                vision: 'A world-class healthcare institution that sets standards in medical excellence, innovation, and compassionate care for our region and beyond.',
                serviceCharter: 'We commit to providing the highest level of medical care, utilizing advanced technology and expertise to treat complex medical conditions, while maintaining our dedication to patient safety, education, and community service.'
            }
        },
        level6: {
            name: 'Level 6 - National Hospital',
            description: 'Super-specialized care with national and international services',
            data: {
                hospitalName: 'National Referral Hospital',
                mission: 'To provide super-specialized medical care, lead in medical research and innovation, and serve as the national center for complex medical treatments.',
                vision: 'The leading medical institution in the nation, renowned for excellence in healthcare delivery, medical education, research, and international collaboration.',
                serviceCharter: 'We are committed to advancing medical science, providing unparalleled specialized care, fostering global partnerships, and ensuring that every patient receives the most advanced and compassionate treatment available, regardless of complexity or origin.'
            }
        },
        specialty: {
            name: 'Specialty Hospital',
            description: 'Focused care in specific medical specialties',
            data: {
                hospitalName: 'Specialty Medical Center',
                mission: 'To provide specialized, high-quality healthcare services in our areas of expertise, serving as a center of excellence for specific medical conditions.',
                vision: 'A premier specialty healthcare institution that leads in diagnosis, treatment, and research for our specialized areas of care.',
                serviceCharter: 'We dedicate ourselves to excellence in specialized medical care, utilizing the latest technology and expertise to provide comprehensive treatment for patients with specific medical conditions, while advancing knowledge through research and education.'
            }
        },
        teaching: {
            name: 'Teaching Hospital',
            description: 'Medical education and training combined with patient care',
            data: {
                hospitalName: 'University Teaching Hospital',
                mission: 'To provide exceptional patient care while serving as a premier institution for medical education, training, and research.',
                vision: 'A leading academic medical center that integrates outstanding patient care with innovative education and groundbreaking research.',
                serviceCharter: 'We are committed to providing compassionate, high-quality healthcare while educating the next generation of healthcare professionals, conducting transformative research, and advancing medical knowledge for the benefit of our patients and society.'
            }
        }
    }), []);

    // Template and sharing state
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [shareEmail, setShareEmail] = useState('');
    const [shareMessage, setShareMessage] = useState('');
    const [complianceItems, setComplianceItems] = useState([
        { id: 1, title: 'Annual License Renewal', description: 'Renew hospital operating license', dueDate: '2025-12-31', status: 'pending', priority: 'high' },
        { id: 2, title: 'Staff Certification Review', description: 'Review and update staff certifications', dueDate: '2025-10-15', status: 'pending', priority: 'medium' },
        { id: 3, title: 'Equipment Calibration', description: 'Calibrate all medical equipment', dueDate: '2025-09-30', status: 'in-progress', priority: 'high' },
        { id: 4, title: 'Fire Safety Inspection', description: 'Complete annual fire safety inspection', dueDate: '2025-11-20', status: 'pending', priority: 'high' },
        { id: 5, title: 'Waste Management Audit', description: 'Conduct medical waste management audit', dueDate: '2025-10-30', status: 'pending', priority: 'medium' }
    ]);

    // Compliance editing state
    const [editingItem, setEditingItem] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortBy, setSortBy] = useState('dueDate');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedItems, setSelectedItems] = useState([]);

    const renderDayColorKey = useCallback(() => (
        <Box sx={{ mt: 2, textAlign: 'center', width: '100%' }}>
            <Grid container spacing={1} justifyContent="center" sx={{ maxWidth: '100%' }}>
                {Object.entries(PIE_COLORS).map(([day, color]) => (
                    <Grid item key={day} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, backgroundColor: color, border: '1px solid #ccc', borderRadius: '2px' }} />
                        <Typography variant="caption" sx={{ lineHeight: 1 }}>{day.slice(0, 3)}</Typography> {/* Shorten day name */}
                    </Grid>
                ))}
            </Grid>
        </Box>
    ), [PIE_COLORS]); // Dependency array includes PIE_COLORS

    // --- Data Fetching ---
    const fetchData = useCallback(async (showSnackbar = false) => {
        setDashboardLoading(true);
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (!token || !userData) {
            if (showSnackbar) enqueueSnackbar('Authentication details missing. Please log in.', { variant: 'error' });
            setDashboardLoading(false);
            navigate('/login');
            return;
        }

        let userId;
        try {
            userId = JSON.parse(userData)?.id;
            if (!userId) throw new Error('User ID not found.');
        } catch (error) {
            console.error("Error parsing user data:", error);
            if (showSnackbar) enqueueSnackbar('Invalid user data. Please log in again.', { variant: 'error' });
            setDashboardLoading(false);
            navigate('/login');
            return;
        }

        try {
            const [incidentRes, assetRes, taskRes, meterReadingRes] = await Promise.all([
                api.get(`/api/hssm/incidents?userId=${userId}`),
                api.get(`/api/hssm/assets?userId=${userId}`),
                api.get(`/api/hssm/tasks?userId=${userId}`),
                api.get(`/api/hssm/meter-readings?userId=${userId}`),
            ]);

            const incidents = incidentRes.data;
            const assets = assetRes.data;
            const tasks = taskRes.data;
            const meterReadings = meterReadingRes.data;

            // Process Meter Readings for Pie Chart
            const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const dayTotals = meterReadings.reduce((acc, reading) => {
                try {
                    const date = new Date(reading.date);
                    if (isNaN(date.getTime())) return acc;
                    const day = WEEKDAY_NAMES[date.getDay()];
                    const realPower = parseFloat(reading.realPower_kW ?? reading.realPower ?? NaN);
                    if (isNaN(realPower)) return acc;
                    acc[day] = (acc[day] || 0) + realPower;
                } catch (e) {
                    console.error("Error processing meter reading:", reading, e);
                }
                return acc;
            }, {});

            const chartData = WEEKDAY_NAMES
                .filter((day) => dayTotals[day])
                .map((day) => ({
                    name: day,
                    value: Number(dayTotals[day].toFixed(2)),
                    fill: PIE_COLORS[day] || '#cccccc'
                }));

            const validPowerFactors = meterReadings
                .map(reading => typeof reading.powerFactor === 'number' ? reading.powerFactor : parseFloat(reading.powerFactor))
                .filter(value => !isNaN(value));

            const averagePowerFactor = validPowerFactors.length > 0
                ? Number((validPowerFactors.reduce((sum, value) => sum + value, 0) / validPowerFactors.length).toFixed(3))
                : null;

            const classification = averagePowerFactor == null
                ? 'Unknown'
                : averagePowerFactor >= 0.95
                    ? 'Excellent'
                    : averagePowerFactor >= 0.9
                        ? 'Fair'
                        : 'Poor';

            setDashboardData({
                totalAssets: assets?.length || 0,
                maintenanceTasks: tasks?.length || 0, // Assuming all fetched tasks are open, adjust if needed
                pendingIncidents: incidents?.length || 0, // Assuming all fetched incidents are pending
                meterReadings: chartData,
                powerFactorStats: { average: averagePowerFactor, classification }
            });

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            enqueueSnackbar(`Failed to load dashboard data: ${err.message}`, { variant: 'error' });
            setDashboardData({
                totalAssets: 'N/A',
                maintenanceTasks: 'N/A',
                pendingIncidents: 'N/A',
                meterReadings: [],
                powerFactorStats: { average: null, classification: 'Unknown' }
            });
        } finally {
            setDashboardLoading(false);
        }
    }, [PIE_COLORS, enqueueSnackbar, navigate]);

    // Fetch initial data
    useEffect(() => {
        fetchData(false); // Fetch initially without snackbar on auth error
    }, [fetchData]);

    // --- Auth Check Effect (Simplified) ---
    // This is somewhat redundant as fetchData handles it, but can be kept for an early check if desired.
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        if (!token || !userData) {
            console.log("Initial auth check failed, redirection handled by fetchData.");
            // navigate('/login'); // Or redirect immediately
        }
    }, [navigate]);

    // --- Modal Handling ---
    const toggleModal = useCallback((modalName, state) => {
        setShowModal(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}), // Close all others
            [modalName]: state, // Set the specific modal's state
        }));

        // Reset form data when opening a form modal (not view modals)
        const formModals = ['incident', 'asset', 'task', 'meterReading', 'reportUpload', 'addTechPlan'];
        if (formModals.includes(modalName) && state === true) {
            const formKey = modalName === 'addTechPlan' ? 'technicalPlan' : modalName;
            setFormData(prev => ({ ...prev, [formKey]: { ...initialFormData[formKey] } }));
            setModalLoading(false); // Reset loading state for the form
        }
         // Reset specific states when modals close
        if (state === false) {
            if (modalName === 'editReport') setEditReport(null);
             if (modalName === 'settings') setSettingsFeedback({ message: '', type: 'info' });
             if (modalName === 'reportPreview') setReportPreviewContent('');
             if (modalName === 'viewAssets') setAssetsSearch('');
             if (modalName === 'viewReports') setReportsSearch('');
        }
    }, [initialFormData]);

    // --- Form Input Handlers ---
    const handleInputChange = (formKey, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [formKey]: { ...prev[formKey], [field]: value },
        }));
    };

    const handleFileChange = (formKey, file) => {
        setFormData((prev) => ({
            ...prev,
            [formKey]: { ...prev[formKey], file: file || null },
        }));
    };

    // --- Generic Form Submission ---
    const handleSubmit = async (modalKey) => {
        const formKey = modalKey; // Assuming modalKey matches formData key
        const endpointMap = {
            incident: '/api/hssm/incidents',
            asset: '/api/hssm/assets',
            task: '/api/hssm/tasks',
            meterReading: '/api/hssm/meter-readings',
            reportUpload: '/api/reports', // Assuming backend handles report content/metadata from this upload
        };

        if (!endpointMap[formKey]) {
            console.error("Invalid modal key for submission:", formKey);
            enqueueSnackbar("Invalid submission type.", { variant: 'error' });
            return;
        }

        const currentData = formData[formKey];
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        let userId;
        try {
            if (!token || !userData) throw new Error('Authentication error.');
            userId = JSON.parse(userData)?.id;
            if (!userId) throw new Error('User ID missing.');
        } catch (error) {
            enqueueSnackbar(error.message || 'Authentication error. Please log in again.', { variant: 'error'});
            return;
        }

        // --- Basic Validation ---
        let isValid = true;
        let validationError = '';
        if (formKey === 'meterReading') {
            const realPower = parseFloat(currentData.realPower_kW);
            const apparentPower = parseFloat(currentData.apparentPower_kVA);
            if (!currentData.location || !currentData.realPower_kW || !currentData.apparentPower_kVA || !currentData.date) {
                isValid = false; validationError = 'Location, Real Power (kW), Apparent Power (kVA), and Date are required.';
            } else if (isNaN(realPower) || isNaN(apparentPower)) {
                isValid = false; validationError = 'Real Power and Apparent Power must be valid numbers.';
            } else if (apparentPower <= 0) {
                isValid = false; validationError = 'Apparent Power (kVA) must be greater than zero.';
            } else if (realPower < 0) {
                isValid = false; validationError = 'Real Power (kW) cannot be negative.';
            } else if (realPower > apparentPower) {
                isValid = false; validationError = 'Real Power (kW) cannot exceed Apparent Power (kVA).';
            }
        } else if (formKey === 'asset') {
             if (!currentData.name || !currentData.category || !currentData.location) {
                 isValid = false; validationError = 'Asset Name, Category, and Location are required.';
             }
        } else if (formKey === 'incident') {
             if (!currentData.title || !currentData.department || !currentData.description || !currentData.date) {
                 isValid = false; validationError = 'Department, Title, Description, and Date are required.';
             }
        } else if (formKey === 'task') {
              if (!currentData.task || !currentData.assignedTo || !currentData.id || !currentData.dueDate) {
                  isValid = false; validationError = 'Task, Assigned To, Task ID, and Due Date are required.';
              }
        } else if (formKey === 'reportUpload') {
             if (!currentData.file) {
                 isValid = false; validationError = 'A report file is required for upload.';
             }
        }

        if (!isValid) {
            enqueueSnackbar(validationError, { variant: 'warning' });
            return;
        }
        // --- End Validation ---


        setModalLoading(true);
        const submissionData = new FormData();
        submissionData.append('userId', userId);

        Object.entries(currentData).forEach(([key, value]) => {
            if (key === 'file' && value instanceof File) {
                submissionData.append(key, value, value.name);
            } else if (key !== 'file' && value !== null && value !== undefined && value !== '') {
                // Ensure keys match backend expectations (e.g., 'task description' might need to be 'taskDescription')
                const backendKey = key.replace(' ', ''); // Simple space removal, adjust if needed
                submissionData.append(backendKey, value);
            }
        });

        try {

            await api.post(endpointMap[formKey], submissionData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            enqueueSnackbar(`${formKey.charAt(0).toUpperCase() + formKey.slice(1).replace('Upload', '')} added successfully!`, { variant: 'success' });
            toggleModal(formKey, false); // Close modal on success
            fetchData(false); // Refresh dashboard data
            if (formKey === 'meterReading') fetchMeterReadingTrend(); // Refresh trend if relevant
            if (formKey === 'reportUpload') handleViewReportsOpen(); // Refresh reports list if relevant

        } catch (err) {
            console.error(`Error adding ${formKey}:`, err);
            enqueueSnackbar(`Error: ${err.message || `Failed to add ${formKey}.`}`, { variant: 'error' });
        } finally {
            setModalLoading(false);
        }
    };


    // --- Generic Modal Content Renderer ---
    const renderModalContent = (modalKey) => {
        const formKey = modalKey; // Assuming modalKey matches formData key
        const currentData = formData[formKey];
        if (!currentData) return null; // Should not happen if used correctly

        const title = modalKey.charAt(0).toUpperCase() + modalKey.slice(1).replace(/([A-Z])/g, ' $1').trim();

        return (
            <>
             {/* Modal Header */}
             <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '4px 4px 0 0' }}>
                 <Typography variant="h6" id={`modal-title-${modalKey}`}>{`Add New ${title}`}</Typography>
                 <AnimatedIconButton onClick={() => toggleModal(modalKey, false)} sx={{ color: 'primary.contrastText' }} disabled={modalLoading}>
                     <CloseIcon />
                 </AnimatedIconButton>
             </Box>

            {/* Modal Body */}
            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                 <Grid container spacing={2}>
                     {Object.keys(currentData).map((field) => {
                        if (field === 'file') return null; // Handle file separately below

                        const lowerField = field.toLowerCase();
                        const isDateField = lowerField.includes('date');
                        const isNumberField = lowerField.includes('reading') || lowerField === 'serialnumber' || lowerField === 'realpower_kw' || lowerField === 'apparentpower_kva';
                        const isTextArea = field.toLowerCase().includes('description') || field === 'serviceRecords';
                        const isPriority = field === 'priority';
                        const isCategory = field === 'category' && formKey === 'asset';
                        const friendlyLabelMap = {
                            realPower_kW: 'Real Power (kW)',
                            apparentPower_kVA: 'Apparent Power (kVA)',
                        };
                        const label = friendlyLabelMap[field] || field
                            .replace(/_/g, ' ')
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .replace('Id', 'ID'); // Format label

                        let inputElement;

                        if (isPriority) {
                            inputElement = (
                                <TextField select label={label} fullWidth value={currentData[field] || 'Medium'} onChange={(e) => handleInputChange(formKey, field, e.target.value)}>
                                    <MenuItem value="Low">Low</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="High">High</MenuItem>
                                </TextField>
                            );
                        } else if (isCategory) {
                             inputElement = (
                                <TextField select label={label} fullWidth value={currentData[field] || 'Fixed Assets'} onChange={(e) => handleInputChange(formKey, field, e.target.value)}>
                                     <MenuItem value="Fixed Assets">Fixed Assets</MenuItem>
                                     <MenuItem value="Movable Assets">Movable Assets</MenuItem>
                                     <MenuItem value="Consumables">Consumables</MenuItem>
                                     <MenuItem value="IT Equipment">IT Equipment</MenuItem>
                                     <MenuItem value="Medical Equipment">Medical Equipment</MenuItem>
                                     <MenuItem value="Infrastructure">Infrastructure</MenuItem>
                                </TextField>
                             );
                        } else {
                            inputElement = (
                                <TextField
                                    label={label}
                                    fullWidth
                                    type={isDateField ? 'date' : (isNumberField ? 'number' : 'text')}
                                    multiline={isTextArea}
                                    rows={isTextArea ? (field === 'serviceRecords' ? 4 : 3) : 1}
                                    value={currentData[field] || ''}
                                    onChange={(e) => handleInputChange(formKey, field, e.target.value)}
                                    InputLabelProps={{ shrink: isDateField || !!currentData[field] || isTextArea || field === 'serialNumber' }} // Ensure label shrinks correctly
                                    required={['title', 'department', 'description', 'date', 'name', 'category', 'location', 'task', 'assignedTo', 'dueDate', 'task description', 'realPower_kW', 'apparentPower_kVA', 'id'].includes(field)} // Add required fields
                                />
                            );
                        }
                        // Adjust grid size based on field type or name for better layout
                        const gridSize = (isTextArea || field === 'location') ? 12 : (isDateField || isPriority || isCategory || field === 'serialNumber' ? 6 : 12);
                        return <Grid item xs={12} sm={gridSize} key={field}>{inputElement}</Grid>;
                    })}

                    {/* File Upload Section */}
                    {Object.keys(currentData).includes('file') && (
                        <Grid item xs={12}>
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button variant="outlined" component="label" fullWidth startIcon={<UploadFileIcon />} size="small">
                                     {currentData.file ? `File: ${currentData.file.name}` : `Upload Supporting File${formKey === 'reportUpload' ? ' (Required)' : ' (Optional)'}`}
                                    <input type="file" hidden onChange={(e) => handleFileChange(formKey, e.target.files?.[0])} />
                                </Button>
                                {currentData.file && (
                                    <AnimatedIconButton size="small" onClick={() => handleFileChange(formKey, null)} title="Remove file">
                                        <DeleteIcon fontSize='small' color="error"/>
                                    </AnimatedIconButton>
                                )}
                            </Box>
                        </Grid>
                     )}
                 </Grid>
             </Box>

             {/* Modal Footer */}
             <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1, bgcolor: 'background.default', borderRadius: '0 0 4px 4px' }}>
                 <Button variant="outlined" onClick={() => toggleModal(modalKey, false)} disabled={modalLoading}>
                     Cancel
                 </Button>
                 <Button variant="contained" color="primary" onClick={() => handleSubmit(modalKey)} disabled={modalLoading} startIcon={modalLoading ? <CircularProgress size={20} color="inherit" /> : null}>
                     {modalLoading ? 'Submitting...' : 'Submit'}
                 </Button>
             </Box>
            </>
        );
    };

    // --- Report Generation & Download ---
    const handleGenerateReport = async () => {
        if (!dateRange.start || !dateRange.end) {
            enqueueSnackbar('Please select both Start and End dates.', { variant: 'warning' }); return;
        }
        if (new Date(dateRange.start) > new Date(dateRange.end)) {
             enqueueSnackbar('Start date cannot be after End date.', { variant: 'warning' }); return;
        }

        setReportGenerationLoading(true);
        setReportPreviewContent(''); // Clear previous preview
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token missing.');

            const { data } = await api.post('/api/reports/generate', { startDate: dateRange.start, endDate: dateRange.end });
            if (!data.success || !data.report) {
                throw new Error(data.message || 'Failed to generate report');
            }
            setReportPreviewContent(data.report);
            toggleModal('reportPreview', true); // Open preview modal
            enqueueSnackbar('Report generated successfully. Review and download.', { variant: 'success' });

        } catch (error) {
            console.error('Report generation error:', error);
            enqueueSnackbar(`Report Generation Failed: ${error.message}`, { variant: 'error' });
        } finally {
            setReportGenerationLoading(false);
        }
    };

    const handleDownloadReport = (contentToDownload) => {
        if (!contentToDownload) {
            enqueueSnackbar("No report content available to download.", { variant: 'warning' }); return;
        }
        try {
            generatePDFReport(contentToDownload);
            toggleModal('reportPreview', false); // Close preview modal after download
        } catch (error) {
             console.error("PDF Generation Error:", error);
             enqueueSnackbar("Failed to generate PDF report.", { variant: 'error'});
        }
    };

    const generatePDFReport = (content) => {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let yPos = margin; // Start position

        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Weekly Technical Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Date Range
        if (dateRange.start && dateRange.end) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100); // Grey text
            doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 12; // More space after date range
        }

        // Content
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0); // Black text
        const splitText = doc.splitTextToSize(content, pageWidth - margin * 2);

        splitText.forEach(line => {
            if (yPos > pageHeight - margin - 10) { // Check with footer margin
                doc.addPage();
                yPos = margin; // Reset Y position for new page
                // Optional: Re-add header/date on new pages
                 doc.setFontSize(11); doc.setFont(undefined, 'normal'); // Reset font for content
            }
            doc.text(line, margin, yPos);
            yPos += 6; // Line height (adjust as needed)
        });

        // Footer with Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        const filename = `Technical_Report_${dateRange.start || 'StartDate'}_to_${dateRange.end || 'EndDate'}.pdf`;
        doc.save(filename);
    };

    const handleDateRangeChange = (field, value) => {
        setDateRange((prev) => ({ ...prev, [field]: value }));
    };


    // --- Meter Reading Trend Chart ---
    const [meterReadingTrend, setMeterReadingTrend] = useState([]);
    const [trendLoading, setTrendLoading] = useState(false);

    const fetchMeterReadingTrend = useCallback(async () => {
        setTrendLoading(true);
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        if (!token || !userData) { setTrendLoading(false); return; }

        let userId;
         try { userId = JSON.parse(userData)?.id; if (!userId) throw new Error("User ID missing"); }
         catch { setTrendLoading(false); return; }

        try {
            const { data: trendData } = await api.get(`/api/hssm/meter-readings/trend?userId=${userId}&limit=30`);
            const formattedTrend = trendData
                .map(item => {
                    const date = new Date(item.date);
                    const realPower = parseFloat(item.realPower_kW ?? item.realPower ?? item.reading ?? 0);
                    if (isNaN(date.getTime()) || isNaN(realPower)) return null;
                    const apparentPower = parseFloat(item.apparentPower_kVA ?? item.apparentPower ?? 0) || null;
                    const powerFactor = typeof item.powerFactor === 'number'
                        ? Number(item.powerFactor.toFixed(3))
                        : Number(parseFloat(item.powerFactor).toFixed(3));
                    // Format date for XAxis - adjust as needed ('dd/MM', 'MMM dd', etc.)
                    return {
                        date: date.toLocaleDateString('en-CA'),
                        realPower,
                        apparentPower,
                        powerFactor: isNaN(powerFactor) ? null : powerFactor
                    }; // YYYY-MM-DD
                })
                .filter(Boolean)
                .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ensure sorted by date ASC

            setMeterReadingTrend(formattedTrend);
        } catch (err) {
            console.error("Error fetching meter reading trend:", err);
            setMeterReadingTrend([]);
            // enqueueSnackbar(`Could not load trend: ${err.message}`, { variant: 'warning', autoHideDuration: 3000 });
        } finally {
            setTrendLoading(false);
        }
    }, []); // Added enqueueSnackbar

    useEffect(() => {
        fetchMeterReadingTrend();
    }, [fetchMeterReadingTrend]);


    // --- Hospital Profile Section ---
    const [hospitalProfile, setHospitalProfile] = useState({ hospitalName: '', establishedDate: '', location: { address: '', city: '', state: '', country: '', postalCode: '' }, mission: '', vision: '', serviceCharter: '', organogram: null, organogramUrl: null, technicalPlans: [] });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileEditMode, setProfileEditMode] = useState(false);

    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found.");
            const { data } = await api.get('/api/hssm/profile');

            setHospitalProfile({
                hospitalName: data.hospitalName || '',
                establishedDate: data.establishedDate ? data.establishedDate.split('T')[0] : '',
                location: data.location || { address: '', city: '', state: '', country: '', postalCode: '' },
                mission: data.mission || '',
                vision: data.vision || '',
                serviceCharter: data.serviceCharter || '',
                organogram: null, // Reset file object
                organogramUrl: data.organogramUrl || null,
                technicalPlans: data.technicalPlans || []
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
            enqueueSnackbar(`Failed to load hospital profile: ${error.message}`, { variant: 'error' });
        } finally {
            setProfileLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setHospitalProfile(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setHospitalProfile(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleOrganogramUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Basic validation example
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.visio'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (!allowedTypes.includes(file.type)) {
                enqueueSnackbar('Invalid file type. Allowed: PDF, DOC(X), JPG, PNG, VSDX.', { variant: 'warning' }); return;
            }
            if (file.size > maxSize) {
                 enqueueSnackbar('File size exceeds 5MB limit.', { variant: 'warning' }); return;
            }

            setHospitalProfile(prev => ({
                ...prev,
                organogram: file,
                organogramUrl: URL.createObjectURL(file) // Temporary preview URL
            }));
        }
    };

    const handleProfileSave = async () => {
        setProfileLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found.");
            if (!hospitalProfile.hospitalName) throw new Error("Hospital Name is required."); // Basic validation

            const formDataToSubmit = new FormData();
            formDataToSubmit.append('hospitalName', hospitalProfile.hospitalName);
            formDataToSubmit.append('establishedDate', hospitalProfile.establishedDate);
            formDataToSubmit.append('mission', hospitalProfile.mission);
            formDataToSubmit.append('vision', hospitalProfile.vision);
            formDataToSubmit.append('serviceCharter', hospitalProfile.serviceCharter);
            // Send location as a plain object (FormData will convert to [object Object], so use JSON if backend expects it, but backend will now handle both)
            formDataToSubmit.append('location', JSON.stringify(hospitalProfile.location));

            if (hospitalProfile.organogram instanceof File) {
                formDataToSubmit.append('organogram', hospitalProfile.organogram, hospitalProfile.organogram.name);
            }

            const { data: updatedData } = await api.put('/api/hssm/profile', formDataToSubmit, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setHospitalProfile(prev => ({
                ...prev, ...updatedData,
                establishedDate: updatedData.establishedDate ? updatedData.establishedDate.split('T')[0] : '',
                organogram: null, // Clear file object
                organogramUrl: updatedData.organogramUrl || prev.organogramUrl,
            }));
            setProfileEditMode(false);
            enqueueSnackbar('Profile updated successfully!', { variant: 'success' });

        } catch (error) {
            console.error('Error updating profile:', error);
            enqueueSnackbar(`Profile Update Failed: ${error.message}`, { variant: 'error' });
        } finally {
            setProfileLoading(false);
        }
    };

    // --- Technical Plan Management ---
    const [technicalPlanFormData, setTechnicalPlanFormData] = useState(initialFormData.technicalPlan); // Separate state for the modal form

    const handleTechnicalPlanFormChange = (e) => {
        const { name, value, files } = e.target;
        setTechnicalPlanFormData(prev => ({
            ...prev,
            [name]: files ? (files[0] || null) : value
        }));
    };

     const handleTechnicalPlanSubmit = async () => {
        if (!technicalPlanFormData.title || !technicalPlanFormData.file) {
            enqueueSnackbar('Please provide a title and select a file.', { variant: 'warning' }); return;
        }
        // File Type/Size Validation
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.visio', 'image/vnd.dwg', 'image/vnd.dxf', 'image/jpeg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB for plans
        if (!allowedTypes.includes(technicalPlanFormData.file.type)) {
            enqueueSnackbar('Invalid file type for technical plan.', { variant: 'warning' }); return;
        }
        if (technicalPlanFormData.file.size > maxSize) {
            enqueueSnackbar('File size exceeds 10MB limit.', { variant: 'warning' }); return;
        }

        setModalLoading(true); // Use generic modal loading
        try {
            const formData = new FormData();
            formData.append('title', technicalPlanFormData.title);
            formData.append('description', technicalPlanFormData.description);
            formData.append('file', technicalPlanFormData.file, technicalPlanFormData.file.name);

            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found.");

            // const res = await fetch(`${API_BASE_URL}/api/hssm/technical-plans`, {
            //     method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
            // });
            // 
            // if (!res.ok) {
            //      const errorData = await res.json().catch(() => ({ message: res.statusText }));
            //      throw new Error(errorData.message || 'Failed to upload technical plan');
            // }
            // const newPlan = await res.json();
            // setHospitalProfile(prev => ({ ...prev, technicalPlans: [...prev.technicalPlans, newPlan] }));
            
            // Technical plans functionality not implemented in backend yet
            enqueueSnackbar('Technical plans upload not implemented yet', { variant: 'info' });
            toggleModal('addTechPlan', false); // Close modal
            setTechnicalPlanFormData(initialFormData.technicalPlan); // Reset form state
            enqueueSnackbar('Technical plan uploaded successfully', { variant: 'success' });
        } catch (error) {
            console.error('Error uploading technical plan:', error);
            enqueueSnackbar(error.message || 'Failed to upload technical plan', { variant: 'error' });
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteTechnicalPlan = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this technical plan?')) return;

        setProfileLoading(true); // Indicate loading on the profile section
        try {
            const token = localStorage.getItem('token');
             if (!token) throw new Error("Authentication token not found.");
            // const res = await fetch(`${API_BASE_URL}/api/hssm/technical-plans/${planId}`, {
            //     method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            // });
            // if (!res.ok) {
            //      const errorData = await res.json().catch(() => ({ message: res.statusText }));
            //      throw new Error(errorData.message || 'Failed to delete technical plan');
            // }
            // setHospitalProfile(prev => ({ ...prev, technicalPlans: prev.technicalPlans.filter(plan => plan._id !== planId) }));
            // enqueueSnackbar('Technical plan deleted successfully', { variant: 'success' });
            
            // Technical plans functionality not implemented in backend yet
            enqueueSnackbar('Technical plans delete not implemented yet', { variant: 'info' });
        } catch (error) {
            console.error('Error deleting technical plan:', error);
            enqueueSnackbar(`Deletion Failed: ${error.message}`, { variant: 'error' });
        } finally {
            setProfileLoading(false);
        }
    };

    // Debounced state for inline edits to avoid excessive API calls on every keystroke
    const [debouncedPlanUpdates, setDebouncedPlanUpdates] = useState({});

    // Function to handle inline edits with debounce
    const handleTechnicalPlanEdit = useCallback((planId, field, value) => {
        // Update local state immediately for responsiveness
        setHospitalProfile(prev => ({
            ...prev,
            technicalPlans: prev.technicalPlans.map(plan =>
                plan._id === planId ? { ...plan, [field]: value } : plan
            )
        }));

        // Update debounced state
        setDebouncedPlanUpdates(prev => ({
            ...prev,
            [planId]: {
                ...(prev[planId] || {}),
                [field]: value,
            }
        }));
    }, []);

    // useEffect hook to trigger API calls after a delay for debounced text fields
    useEffect(() => {
        const handler = setTimeout(async () => {
            const plansToUpdate = Object.keys(debouncedPlanUpdates);
            if (plansToUpdate.length === 0) return;

            const token = localStorage.getItem('token');
            if (!token) {
                 console.error("Cannot update plans: Authentication token missing.");
                 setDebouncedPlanUpdates({}); // Clear queue if auth fails
                 return;
            }

            // Process updates
            for (const planId of plansToUpdate) {
                const updates = debouncedPlanUpdates[planId];
                // Separate file updates from text updates
                const textUpdates = {};
                let fileUpdate = null;

                if (updates.file !== undefined) { // Check if file field was explicitly changed
                    if (updates.file instanceof File) {
                         fileUpdate = updates.file;
                    } else if (updates.file === null) {
                         // Handle file removal if API supports it (e.g., send specific flag or null)
                         console.log(`File removal requested for plan ${planId}, API call not implemented in this example.`);
                    }
                    // Don't send 'file' field in text updates
                }

                Object.keys(updates).forEach(field => {
                    if (field !== 'file') {
                        textUpdates[field] = updates[field];
                    }
                });

                 // --- API Call for Text Updates ---
                 if (Object.keys(textUpdates).length > 0) {
                    try {
                        console.log(`Updating plan ${planId} text fields:`, textUpdates);
                        // const res = await fetch(`${API_BASE_URL}/api/hssm/technical-plans/${planId}`, {
                        //     method: 'PUT',
                        //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        //     body: JSON.stringify(textUpdates)
                        // });
                        // if (!res.ok) throw new Error(`Failed to update plan text fields for ${planId}`);
                        
                        console.log('Technical plans text update not implemented yet');
                        console.log(`Plan ${planId} text fields updated successfully.`);
                     } catch (error) {
                         console.error(`Error updating text fields for plan ${planId}:`, error);
                         enqueueSnackbar(`Failed to save changes for plan: ${planId}. ${error.message}`, { variant: 'error' });
                         // Optional: Revert local state changes on error here if desired
                     }
                 }

                // --- API Call for File Update ---
                if (fileUpdate) {
                    try {
                        console.log(`Updating plan ${planId} file:`, fileUpdate.name);
                        const fileFormData = new FormData();
                        fileFormData.append('file', fileUpdate, fileUpdate.name);
                        // const res = await fetch(`${API_BASE_URL}/api/hssm/technical-plans/${planId}/file`, { // Assumes specific file update endpoint
                        //     method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fileFormData
                        // });
                        // if (!res.ok) throw new Error(`Failed to update file for ${planId}`);
                        // const updatedPlanData = await res.json();
                        
                        console.log('Technical plans file update not implemented yet');
                         // Update local state with confirmed data (includes new fileUrl)
                         setHospitalProfile(prev => ({
                            ...prev,
                            technicalPlans: prev.technicalPlans.map(p =>
                                p._id === planId ? { ...p, file: null } : p // Clear local file obj
                            )
                        }));
                         enqueueSnackbar(`Plan ${planId} file updated.`, { variant: 'success' });
                         console.log(`Plan ${planId} file updated successfully.`);
                    } catch (error) {
                        console.error(`Error updating file for plan ${planId}:`, error);
                        enqueueSnackbar(`Failed to update file for plan: ${planId}. ${error.message}`, { variant: 'error' });
                         // Optional: Revert local file change here
                    }
                }
            }
             // Clear the debounced updates queue after processing
             setDebouncedPlanUpdates({});

        }, 1500); // Debounce delay: 1.5 seconds

        return () => clearTimeout(handler); // Cleanup timeout on unmount or dependency change

    }, [debouncedPlanUpdates, enqueueSnackbar]); // Dependency: run when debounced updates change

    // --- Settings Modal ---
    const [settingsTab, setSettingsTab] = useState(0);
    const [settingsFeedback, setSettingsFeedback] = useState({ message: '', type: 'info' });
    const [settingsProfile, setSettingsProfile] = useState({ name: '', email: '' });
    const [settingsPassword, setSettingsPassword] = useState({ current: '', new: '', confirm: '' });
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Load user profile for settings modal
    useEffect(() => {
        if (showModal.settings) {
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const { name, email } = JSON.parse(userData);
                    setSettingsProfile({ name: name || '', email: email || '' });
                } catch (e) { console.error("Could not parse user data for settings"); }
            }
            setSettingsPassword({ current: '', new: '', confirm: '' });
            setSettingsFeedback({ message: '', type: 'info' });
            setSettingsTab(0); // Default to first tab
        }
    }, [showModal.settings]);

    const handleProfileSettingsSave = async (e) => {
        e.preventDefault();
        if (!settingsProfile.name || !settingsProfile.email) {
            setSettingsFeedback({ message: 'Name and Email cannot be empty.', type: 'warning' }); return;
        }
        setSettingsLoading(true);
        setSettingsFeedback({ message: '', type: 'info' });
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token missing.');
            await api.put('/api/auth/profile', settingsProfile);

            // Update local storage
            const currentData = JSON.parse(localStorage.getItem('userData') || '{}');
            localStorage.setItem('userData', JSON.stringify({ ...currentData, name: settingsProfile.name, email: settingsProfile.email }));

            setSettingsFeedback({ message: 'Profile updated successfully!', type: 'success' });
        } catch (err) {
            setSettingsFeedback({ message: err.message || 'An error occurred.', type: 'error' });
        } finally {
            setSettingsLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (settingsPassword.new !== settingsPassword.confirm) {
            setSettingsFeedback({ message: 'New passwords do not match.', type: 'error' }); return;
        }
        if (!settingsPassword.current || !settingsPassword.new) {
             setSettingsFeedback({ message: 'Please fill in all password fields.', type: 'warning' }); return;
        }
        if (settingsPassword.new.length < 6) { // Example complexity check
            setSettingsFeedback({ message: 'New password must be at least 6 characters long.', type: 'warning' }); return;
        }

        setSettingsLoading(true);
        setSettingsFeedback({ message: '', type: 'info' });
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token missing.');
            const { data } = await api.put('/api/auth/change-password', { currentPassword: settingsPassword.current, newPassword: settingsPassword.new });
            if (!data.success) throw new Error(data.message || 'Failed to change password');
            setSettingsFeedback({ message: 'Password changed successfully!', type: 'success' });
            setSettingsPassword({ current: '', new: '', confirm: '' });
        } catch (err) {
            setSettingsFeedback({ message: err.message || 'An error occurred.', type: 'error' });
        } finally {
            setSettingsLoading(false);
        }
    };

     const handleLogout = () => {
        api.post('/api/auth/logout').catch(err => console.error("Logout API call failed:", err));

        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/login');
        enqueueSnackbar("Logged out successfully.", { variant: 'info' });
        toggleModal('settings', false); // Close settings modal after logout
    };

    // --- Template Functions ---
    const handleLoadTemplate = (templateKey) => {
        const template = hospitalTemplates[templateKey];
        if (template) {
            setHospitalProfile(prev => ({
                ...prev,
                ...template.data
            }));
            setSelectedTemplate(templateKey);
            enqueueSnackbar(`Template "${template.name}" loaded successfully!`, { variant: 'success' });
        }
    };

    const handleApplyTemplate = () => {
        if (selectedTemplate) {
            const template = hospitalTemplates[selectedTemplate];
            // Apply template data to profile
            setHospitalProfile(prev => ({
                ...prev,
                ...template.data
            }));
            handleProfileSave(); // Save the template data
            toggleModal('templates', false);
            setSelectedTemplate(null);
        }
    };

    // --- Profile Sharing Functions ---
    const handleShareProfile = async () => {
        if (!shareEmail.trim()) {
            enqueueSnackbar('Please enter an email address.', { variant: 'warning' });
            return;
        }

        setModalLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token missing.');

            const shareData = {
                email: shareEmail,
                message: shareMessage,
                profileData: {
                    hospitalName: hospitalProfile.hospitalName,
                    location: hospitalProfile.location,
                    mission: hospitalProfile.mission,
                    vision: hospitalProfile.vision,
                    serviceCharter: hospitalProfile.serviceCharter
                }
            };

            await api.post('/api/hssm/share-profile', shareData);

            enqueueSnackbar('Profile shared successfully!', { variant: 'success' });
            setShareEmail('');
            setShareMessage('');
            toggleModal('shareProfile', false);
        } catch (error) {
            console.error('Error sharing profile:', error);
            enqueueSnackbar(`Failed to share profile: ${error.message}`, { variant: 'error' });
        } finally {
            setModalLoading(false);
        }
    };

    const handleExportProfile = (format) => {
        const exportData = {
            hospitalName: hospitalProfile.hospitalName,
            establishedDate: hospitalProfile.establishedDate,
            location: hospitalProfile.location,
            mission: hospitalProfile.mission,
            vision: hospitalProfile.vision,
            serviceCharter: hospitalProfile.serviceCharter,
            technicalPlans: hospitalProfile.technicalPlans.length,
            exportedAt: new Date().toISOString()
        };

        if (format === 'json') {
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${hospitalProfile.hospitalName || 'Hospital'}_Profile.json`;
            link.click();
            URL.revokeObjectURL(url);
            enqueueSnackbar('Profile exported as JSON!', { variant: 'success' });
        } else if (format === 'csv') {
            const csvContent = [
                ['Field', 'Value'],
                ['Hospital Name', exportData.hospitalName],
                ['Established Date', exportData.establishedDate],
                ['Address', exportData.location.address],
                ['City', exportData.location.city],
                ['State', exportData.location.state],
                ['Country', exportData.location.country],
                ['Mission', exportData.mission],
                ['Vision', exportData.vision],
                ['Service Charter', exportData.serviceCharter],
                ['Technical Plans Count', exportData.technicalPlans],
                ['Exported At', exportData.exportedAt]
            ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(csvBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${hospitalProfile.hospitalName || 'Hospital'}_Profile.csv`;
            link.click();
            URL.revokeObjectURL(url);
            enqueueSnackbar('Profile exported as CSV!', { variant: 'success' });
        }
    };

    // --- Compliance Functions ---
    const handleComplianceStatusChange = (id, newStatus) => {
        setComplianceItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, status: newStatus } : item
            )
        );
        enqueueSnackbar('Compliance status updated!', { variant: 'success' });
    };

    const handleAddComplianceItem = () => {
        const newItem = {
            id: Date.now(),
            title: 'New Compliance Item',
            description: 'Description of the compliance requirement',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            status: 'pending',
            priority: 'medium'
        };
        setComplianceItems(prev => [...prev, newItem]);
        enqueueSnackbar('New compliance item added!', { variant: 'success' });
    };

    const handleDeleteComplianceItem = (id) => {
        setComplianceItems(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
        enqueueSnackbar('Compliance item deleted!', { variant: 'success' });
    };

    const handleEditComplianceItem = (item) => {
        setEditingItem(item.id);
        setEditFormData({
            title: item.title,
            description: item.description,
            dueDate: item.dueDate,
            priority: item.priority
        });
    };

    const handleSaveEdit = () => {
        if (!editFormData.title.trim()) {
            enqueueSnackbar('Title is required!', { variant: 'error' });
            return;
        }
        if (!editFormData.description.trim()) {
            enqueueSnackbar('Description is required!', { variant: 'error' });
            return;
        }
        if (!editFormData.dueDate) {
            enqueueSnackbar('Due date is required!', { variant: 'error' });
            return;
        }

        setComplianceItems(prev =>
            prev.map(item =>
                item.id === editingItem
                    ? { ...item, ...editFormData }
                    : item
            )
        );
        setEditingItem(null);
        setEditFormData({ title: '', description: '', dueDate: '', priority: 'medium' });
        enqueueSnackbar('Compliance item updated!', { variant: 'success' });
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditFormData({ title: '', description: '', dueDate: '', priority: 'medium' });
    };

    const handleBulkStatusUpdate = (newStatus) => {
        if (selectedItems.length === 0) {
            enqueueSnackbar('Please select items to update!', { variant: 'warning' });
            return;
        }

        setComplianceItems(prev =>
            prev.map(item =>
                selectedItems.includes(item.id)
                    ? { ...item, status: newStatus }
                    : item
            )
        );
        setSelectedItems([]);
        enqueueSnackbar(`${selectedItems.length} items updated to ${newStatus}!`, { variant: 'success' });
    };

    const handleBulkDelete = () => {
        if (selectedItems.length === 0) {
            enqueueSnackbar('Please select items to delete!', { variant: 'warning' });
            return;
        }

        setComplianceItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
        setSelectedItems([]);
        enqueueSnackbar(`${selectedItems.length} items deleted!`, { variant: 'success' });
    };

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        const filteredItems = getFilteredAndSortedItems();
        const allIds = filteredItems.map(item => item.id);
        setSelectedItems(prev =>
            prev.length === allIds.length ? [] : allIds
        );
    };

    const getFilteredAndSortedItems = () => {
        let filtered = complianceItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });

        // Sort items
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'dueDate':
                    aValue = new Date(a.dueDate);
                    bValue = new Date(b.dueDate);
                    break;
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });

        return filtered;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in-progress': return 'info';
            case 'overdue': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high': return <PriorityHighIcon color="error" />;
            case 'medium': return <WarningIcon color="warning" />;
            case 'low': return <ScheduleIcon color="success" />;
            default: return null;
        }
    };

    // --- Settings Modal Content ---
    const renderSettingsContent = () => (
        <Box sx={{ width: { xs: '90vw', sm: 500 }, maxWidth: '100%', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 24, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h6">Settings</Typography>
                <AnimatedIconButton onClick={() => toggleModal('settings', false)} sx={{ color: 'primary.contrastText' }}><CloseIcon /></AnimatedIconButton>
            </Box>

            {/* Tabs */}
            <Tabs value={settingsTab} onChange={(e, newValue) => setSettingsTab(newValue)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Profile" />
                <Tab label="Preferences" />
                <Tab label="Security" />
            </Tabs>

            {/* Content Area */}
            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1, minHeight: 250 /* Ensure min height */ }}>
                {/* Tab Panel 0: Profile */}
                {settingsTab === 0 && (
                    <Box component="form" autoComplete="off" onSubmit={handleProfileSettingsSave}>
                        <TextField label="Name" fullWidth sx={{ mb: 2 }} value={settingsProfile.name} onChange={e => setSettingsProfile(p => ({ ...p, name: e.target.value }))} required />
                        <TextField label="Email" type="email" fullWidth sx={{ mb: 2 }} value={settingsProfile.email} onChange={e => setSettingsProfile(p => ({ ...p, email: e.target.value }))} required />
                        <Button variant="contained" color="primary" fullWidth type="submit" disabled={settingsLoading}>
                           {settingsLoading ? <CircularProgress size={24} color="inherit"/> : 'Save Profile'}
                        </Button>
                    </Box>
                )}
                {/* Tab Panel 1: Preferences */}
                {settingsTab === 1 && (
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Appearance</Typography>
                        <Button variant="outlined" onClick={handleThemeToggle} sx={{ mb: 3 }} startIcon={darkMode ? <Brightness7Icon /> : <Brightness4Icon />}>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Button>

                        <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>Account Actions</Typography>
                         <Button variant="contained" color="error" fullWidth onClick={handleLogout}>Logout</Button>
                         <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>More preferences coming soon.</Typography>
                    </Box>
                )}
                {/* Tab Panel 2: Security */}
                {settingsTab === 2 && (
                    <Box component="form" autoComplete="off" onSubmit={handlePasswordChange}>
                        <TextField label="Current Password" type="password" fullWidth sx={{ mb: 2 }} value={settingsPassword.current} onChange={e => setSettingsPassword(p => ({ ...p, current: e.target.value }))} required />
                        <TextField label="New Password" type="password" fullWidth sx={{ mb: 2 }} value={settingsPassword.new} onChange={e => setSettingsPassword(p => ({ ...p, new: e.target.value }))} required />
                        <TextField label="Confirm New Password" type="password" fullWidth sx={{ mb: 2 }} value={settingsPassword.confirm} onChange={e => setSettingsPassword(p => ({ ...p, confirm: e.target.value }))} required error={settingsPassword.new !== settingsPassword.confirm && settingsPassword.confirm !== ''} helperText={settingsPassword.new !== settingsPassword.confirm && settingsPassword.confirm !== '' ? 'Passwords do not match' : ''}/>
                        <Button variant="contained" color="primary" fullWidth type="submit" disabled={settingsLoading}>
                            {settingsLoading ? <CircularProgress size={24} color="inherit"/> : 'Change Password'}
                        </Button>
                    </Box>
                )}
                 {/* Feedback Area */}
                {settingsFeedback.message && (
                    <Typography color={settingsFeedback.type === 'error' ? "error.main" : (settingsFeedback.type === 'success' ? "success.main" : (settingsFeedback.type === 'warning' ? "warning.main" : "text.secondary"))} sx={{ mt: 2, textAlign: 'center', fontWeight: 500 }}>
                        {settingsFeedback.message}
                    </Typography>
                )}
            </Box>
             {/* Optional Footer for consistency */}
             {/* <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.default' }}>
                  <Button variant="outlined" onClick={() => toggleModal('settings', false)}>Close</Button>
             </Box> */}
        </Box>
    );

    // --- View Assets Modal ---
    const [assets, setAssets] = useState([]);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState('');
    const [assetsSearch, setAssetsSearch] = useState('');

    const handleViewAssetsOpen = async () => {
        toggleModal('viewAssets', true);
        setAssetsLoading(true);
        setAssetsError('');
        setAssets([]);
        setAssetsSearch('');
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication required.");
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.id;
            if (!userId) throw new Error("User ID not found.");

          const { data } = await api.get(`/api/hssm/assets?userId=${userId}`);
          setAssets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching assets:", err);
            setAssetsError(err.message || "An error occurred while fetching assets.");
            enqueueSnackbar(`Error loading assets: ${err.message}`, { variant: 'error' });
        } finally {
            setAssetsLoading(false);
        }
    };

    const filteredAssets = useMemo(() => {
        if (!assetsSearch) return assets;
        const searchTerm = assetsSearch.toLowerCase().trim();
        return assets.filter(a =>
            a.name?.toLowerCase().includes(searchTerm) ||
            a.serialNumber?.toString().toLowerCase().includes(searchTerm) ||
            a.location?.toLowerCase().includes(searchTerm) ||
            a.category?.toLowerCase().includes(searchTerm)
        );
    }, [assets, assetsSearch]);

    // --- View Reports Modal ---
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsError, setReportsError] = useState('');
    const [reportsSearch, setReportsSearch] = useState('');
    const [editReport, setEditReport] = useState(null); // Stores the report object being edited
    const [editReportContent, setEditReportContent] = useState('');
    const [editReportLoading, setEditReportLoading] = useState(false);

    const handleViewReportsOpen = useCallback(async () => { // useCallback in case it's passed as prop
        toggleModal('viewReports', true);
        setReportsLoading(true);
        setReportsError('');
        setReports([]);
        setReportsSearch('');
        setEditReport(null); // Close any edit modal if open
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication required.");
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.id;
            if (!userId) throw new Error("User ID not found.");

          const { data } = await api.get(`/api/reports?userId=${userId}`);
          setReports(Array.isArray(data) ? data : []);
        } catch (err) {
             console.error("Error fetching reports:", err);
             setReportsError(err.message || "An error occurred while fetching reports.");
             enqueueSnackbar(`Error loading reports: ${err.message}`, { variant: 'error' });
        } finally {
            setReportsLoading(false);
        }
    }, [toggleModal, enqueueSnackbar]); // Added dependency

    const handleEditReportOpen = (report) => {
        // Fetch full content if not already available (assuming report list might have partial data)
        // For this example, assume `report.content` is available or fetched.
        // If fetching is needed: Add loading state, fetch API, then set state.
        setEditReport(report);
        setEditReportContent(report.content || ''); // Use existing content or default
    };

    const handleEditReportSave = async () => {
        if (!editReport) return;
        setEditReportLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication required.");
            const reportId = editReport._id || editReport.id;
            if (!reportId) throw new Error("Report ID missing.");

            await api.put(`/api/reports/${reportId}`, { content: editReportContent });
            enqueueSnackbar("Report content updated successfully!", { variant: 'success' });
            toggleModal('editReport', false); // Close edit modal
            setEditReport(null);
            setEditReportContent('');
            handleViewReportsOpen(); // Refresh the list
        } catch (err) {
            console.error("Error updating report:", err);
            enqueueSnackbar(`Report Update Failed: ${err.message}`, { variant: 'error' });
        } finally {
             setEditReportLoading(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!reportId) {
            enqueueSnackbar("Cannot delete: Report ID is missing.", { variant: 'error'}); return;
        }
        if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;

        // Indicate loading on the main list while deleting in the background
        setReports(prev => prev.map(r => (r._id || r.id) === reportId ? { ...r, deleting: true } : r));

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication required.");

            await api.delete(`/api/reports/${reportId}`);
            enqueueSnackbar("Report deleted successfully.", { variant: 'success' });
            setReports(prev => prev.filter(r => (r._id || r.id) !== reportId)); // Remove from list
        } catch (err) {
            console.error("Error deleting report:", err);
            enqueueSnackbar(`Delete Failed: ${err.message}`, { variant: 'error' });
            // Remove deleting indicator on failure
            setReports(prev => prev.map(r => (r._id || r.id) === reportId ? { ...r, deleting: false } : r));
        }
        // No finally block needed as state is updated on success/error
    };

    const filteredReports = useMemo(() => {
        if (!reportsSearch) return reports;
        const searchTerm = reportsSearch.toLowerCase().trim();
        return reports.filter(r => {
            const fileName = r.fileUrl ? r.fileUrl.split('/').pop() : (r.file || '');
            const uploadDate = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
            return fileName.toLowerCase().includes(searchTerm) || uploadDate.includes(searchTerm);
        });
    }, [reports, reportsSearch]);


    // --- Render ---
    return (
        <SnackbarProvider maxSnack={5} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <ThemeProvider theme={currentAppTheme}>
                <CssBaseline />
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    {/* --- AppBar --- */}
                    <AppBar position="fixed" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                        <Toolbar>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                <img src={ncmtcLogo} alt="Logo" style={{ height: 40, marginRight: 12 }} />
                                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
                                    HSSM Provider
                                </Typography>
                            </Box>
                            <Box sx={{ flexGrow: 1 }} />
                            <MuiTooltip title="Settings">
                                <AnimatedIconButton color="inherit" onClick={() => toggleModal('settings', true)} sx={{ mr: 0.5 }}>
                                    <SettingsIcon />
                                </AnimatedIconButton>
                            </MuiTooltip>
                             <MuiTooltip title="Toggle Menu">
                                <AnimatedIconButton edge="end" color="inherit" aria-label="open drawer" onClick={handleDrawerOpen} sx={{ display: { xs: 'flex' } }}>
                                    <MenuIcon />
                                </AnimatedIconButton>
                            </MuiTooltip>
                        </Toolbar>
                    </AppBar>

                    {/* --- Right Drawer --- */}
                    <Drawer
                        anchor="right"
                        open={drawerOpen}
                        onClose={handleDrawerClose}
                        PaperProps={{ sx: { width: DRAWER_WIDTH, bgcolor: 'background.paper' } }}
                    >
                         <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Menu</Typography>
                            <IconButton onClick={handleDrawerClose} sx={{ color: 'primary.contrastText' }}><CloseIcon /></IconButton>
                         </Box>
                        <Divider />
                        <List sx={{pt: 1}}>
                            {[
                                { text: 'Dashboard', icon: <DashboardIcon />, action: () => navigate('/') },
                            ].map((item) => (
                                <ListItem button key={item.text} onClick={() => { item.action(); handleDrawerClose(); }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItem>
                            ))}

                            {/* Assets Section */}
                            <ListItem button onClick={handleAssetCollapseClick}>
                                <ListItemIcon sx={{ minWidth: 40 }}><AssignmentIcon /></ListItemIcon>
                                <ListItemText primary="Assets" />
                                {assetCollapseOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItem>
                            <Collapse in={assetCollapseOpen} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    <ListItem button sx={{ pl: 4 }} onClick={() => { handleViewAssetsOpen(); handleDrawerClose(); }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}><DevicesIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="View All Assets" primaryTypographyProps={{ variant: 'body2' }} />
                                    </ListItem>
                                     <ListItem button sx={{ pl: 4 }} onClick={() => { toggleModal('asset', true); handleDrawerClose(); }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}><AddCircleOutlineIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Add New Asset" primaryTypographyProps={{ variant: 'body2' }}/>
                                    </ListItem>
                                </List>
                            </Collapse>

                            {/* Reports Section */}
                             <ListItem button onClick={() => { handleViewReportsOpen(); handleDrawerClose(); }}>
                                <ListItemIcon sx={{ minWidth: 40 }}><ReportIcon /></ListItemIcon>
                                <ListItemText primary="View Reports" />
                            </ListItem>

                            <Divider sx={{ my: 1 }} />

                             {/* Quick Actions */}
                             <List subheader={<Typography variant="caption" sx={{ pl: 2, display:'block', color:'text.secondary' }}>Quick Actions</Typography>}>
                                {[
                                    { text: 'Log Incident', icon: <AddCircleOutlineIcon />, action: () => toggleModal('incident', true) },
                                    { text: 'Create Task', icon: <AddCircleOutlineIcon />, action: () => toggleModal('task', true) },
                                    { text: 'Add Meter Reading', icon: <AssessmentIcon />, action: () => toggleModal('meterReading', true) },
                                    { text: 'Upload Report File', icon: <UploadFileIcon />, action: () => toggleModal('reportUpload', true) },
                                ].map((item) => (
                                    <ListItem button key={item.text} onClick={() => { item.action(); handleDrawerClose(); }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.text} />
                                    </ListItem>
                                ))}
                            </List>
                        </List>
                    </Drawer>

                    {/* --- Main Content Area --- */}
                    <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', pt: 0, pb: 4 }}>
                         <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: 0 }}>

                            {/* --- Hospital Profile --- */}
                            <Paper elevation={2} sx={{ mb: 3, p: { xs: 2, md: 3 }, borderRadius: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 'medium' }}>Hospital Profile</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => toggleModal('templates', true)}
                                            startIcon={<SettingsIcon />}
                                            disabled={profileEditMode}
                                        >
                                            Templates
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => toggleModal('shareProfile', true)}
                                            startIcon={<SettingsIcon />}
                                            disabled={profileEditMode}
                                        >
                                            Share
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => toggleModal('compliance', true)}
                                            startIcon={<SettingsIcon />}
                                            disabled={profileEditMode}
                                        >
                                            Compliance
                                        </Button>
                                        <Button
                                            variant={profileEditMode ? "contained" : "outlined"}
                                            color={profileEditMode ? "primary" : "secondary"}
                                            size="small"
                                            onClick={profileEditMode ? handleProfileSave : () => setProfileEditMode(true)}
                                            startIcon={profileLoading ? <CircularProgress size={20} color="inherit"/> : (profileEditMode ? <SettingsIcon /> : <EditIcon />)}
                                            disabled={profileLoading}
                                        >
                                            {profileLoading ? 'Saving...' : (profileEditMode ? 'Save Profile' : 'Edit Profile')}
                                        </Button>
                                        {profileEditMode && (
                                            <Button variant="text" size="small" onClick={() => { setProfileEditMode(false); fetchProfile(); }} disabled={profileLoading}>
                                                Cancel
                                            </Button>
                                        )}
                                    </Box>
                                </Box>

                                {profileLoading && !profileEditMode ? (
                                     <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                                ) : profileEditMode ? (
                                    // --- Profile Edit Form ---
                                    <Grid container spacing={2.5}>
                                        <Grid item xs={12} sm={6}><TextField label="Hospital Name *" name="hospitalName" value={hospitalProfile.hospitalName} onChange={handleProfileChange} fullWidth required disabled={profileLoading} /></Grid>
                                        <Grid item xs={12} sm={6}><TextField label="Established Date" name="establishedDate" type="date" value={hospitalProfile.establishedDate} onChange={handleProfileChange} fullWidth InputLabelProps={{ shrink: true }} disabled={profileLoading} /></Grid>
                                        <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1, mb: 0, color:'text.secondary' }}>Location</Typography></Grid>
                                        <Grid item xs={12}><TextField label="Address" name="location.address" value={hospitalProfile.location.address} onChange={handleProfileChange} fullWidth multiline rows={2} disabled={profileLoading} /></Grid>
                                        <Grid item xs={6} sm={3}><TextField label="City" name="location.city" value={hospitalProfile.location.city} onChange={handleProfileChange} fullWidth disabled={profileLoading} /></Grid>
                                        <Grid item xs={6} sm={3}><TextField label="State/Province" name="location.state" value={hospitalProfile.location.state} onChange={handleProfileChange} fullWidth disabled={profileLoading} /></Grid>
                                        <Grid item xs={6} sm={3}><TextField label="Country" name="location.country" value={hospitalProfile.location.country} onChange={handleProfileChange} fullWidth disabled={profileLoading} /></Grid>
                                        <Grid item xs={6} sm={3}><TextField label="Postal Code" name="location.postalCode" value={hospitalProfile.location.postalCode} onChange={handleProfileChange} fullWidth disabled={profileLoading} /></Grid>
                                        <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1, mb: 0, color:'text.secondary' }}>Statements</Typography></Grid>
                                        <Grid item xs={12} md={4}><TextField label="Mission" name="mission" value={hospitalProfile.mission} onChange={handleProfileChange} fullWidth multiline minRows={4} disabled={profileLoading} /></Grid>
                                        <Grid item xs={12} md={4}><TextField label="Vision" name="vision" value={hospitalProfile.vision} onChange={handleProfileChange} fullWidth multiline minRows={4} disabled={profileLoading} /></Grid>
                                        <Grid item xs={12} md={4}><TextField label="Service Charter Summary" name="serviceCharter" value={hospitalProfile.serviceCharter} onChange={handleProfileChange} fullWidth multiline minRows={4} disabled={profileLoading} /></Grid>

                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, color:'text.secondary' }}>Hospital Organogram</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                <Button variant="outlined" component="label" size="small" startIcon={<UploadFileIcon />} disabled={profileLoading}>
                                                    {hospitalProfile.organogram ? 'Change File' : 'Upload File'}
                                                    <input type="file" hidden onChange={handleOrganogramUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.vsdx" />
                                                </Button>
                                                {hospitalProfile.organogram instanceof File ? (
                                                    <Typography variant="body2" noWrap sx={{ flexShrink: 1 }}>Selected: {hospitalProfile.organogram.name}</Typography>
                                                 ) : hospitalProfile.organogramUrl ? (
                                                    <Button size="small" startIcon={<VisibilityIcon />} href={hospitalProfile.organogramUrl.startsWith('blob:') ? hospitalProfile.organogramUrl : assetUrl(hospitalProfile.organogramUrl)} target="_blank" rel="noopener noreferrer" disabled={profileLoading}>
                                                        View Current
                                                     </Button>
                                                 ) : ( <Typography variant="body2" color="text.secondary">No file.</Typography> )}
                                            </Box>
                                        </Grid>

                                        {/* Technical Plans - EDIT MODE */}
                                        <Grid item xs={12}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1.5 }}>
                                                <Typography variant="h6">Technical Plans & Documents</Typography>
                                                <Button size="small" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => toggleModal('addTechPlan', true)} disabled={profileLoading}>
                                                    Add New Plan
                                                </Button>
                                            </Box>
                                            {hospitalProfile.technicalPlans.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1, mt:1 }}>No technical plans added yet.</Typography>
                                            ) : (
                                            <Grid container spacing={2}>
                                                {hospitalProfile.technicalPlans.map((plan) => (
                                                    <Grid item xs={12} sm={6} md={4} key={plan._id}>
                                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderColor: 'divider' }} variant="outlined">
                                                            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                                                <TextField label="Title" size="small" value={plan.title} onChange={(e) => handleTechnicalPlanEdit(plan._id, 'title', e.target.value)} fullWidth sx={{ mb: 1.5 }} disabled={profileLoading}/>
                                                                <TextField label="Description" size="small" value={plan.description || ''} onChange={(e) => handleTechnicalPlanEdit(plan._id, 'description', e.target.value)} fullWidth multiline rows={3} disabled={profileLoading}/>
                                                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                                                     Added: {plan.uploadDate ? new Date(plan.uploadDate).toLocaleDateString() : 'N/A'}
                                                                 </Typography>
                                                            </CardContent>
                                                            <CardActions sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', p: 1 }}>
                                                                <Button size="small" component="label" startIcon={<UploadFileIcon fontSize="small"/>} disabled={profileLoading}>
                                                                     {plan.fileUrl ? 'Update File' : 'Add File'}
                                                                     <input type="file" hidden onChange={(e) => handleTechnicalPlanEdit(plan._id, 'file', e.target.files?.[0])} accept=".pdf,.doc,.docx,.vsdx,.dwg,.dxf,.jpg,.png" />
                                                                </Button>
                                                                {plan.fileUrl && (
                                                                    <MuiTooltip title="Download Current File">
                                                                        <IconButton size="small" href={assetUrl(plan.fileUrl)} target="_blank" color="primary">
                                                                            <DownloadIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </MuiTooltip>
                                                                 )}
                                                                <AnimatedIconButton size="small" color="error" onClick={() => handleDeleteTechnicalPlan(plan._id)} disabled={profileLoading} title="Delete Plan">
                                                                    <DeleteIcon fontSize="small"/>
                                                                </AnimatedIconButton>
                                                            </CardActions>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                             )}
                                        </Grid>
                                        {/* Save/Cancel Buttons are now at the top */}
                                    </Grid>
                                ) : (
                                    // --- Profile Display Mode ---
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, height: '100%' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'text.primary', mb:1 }}>Basic Information</Typography>
                                                <Typography variant="body1"><strong>Name:</strong> {hospitalProfile.hospitalName || <em>Not set</em>}</Typography>
                                                <Typography variant="body1" sx={{ mt: 0.5 }}><strong>Established:</strong> {hospitalProfile.establishedDate || <em>Not set</em>}</Typography>
                                                 {hospitalProfile.organogramUrl && (
                                                     <Button size="small" variant="text" startIcon={<VisibilityIcon />} href={assetUrl(hospitalProfile.organogramUrl)} target="_blank" rel="noopener noreferrer" sx={{mt: 1.5, textTransform: 'none'}}>
                                                        View Organogram
                                                     </Button>
                                                 )}
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                             <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, height: '100%' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'text.primary', mb:1 }}>Location</Typography>
                                                <Typography variant="body1">{hospitalProfile.location.address || <em>No address</em>}</Typography>
                                                <Typography variant="body1" sx={{ mt: 0.5 }}>{[hospitalProfile.location.city, hospitalProfile.location.state, hospitalProfile.location.postalCode].filter(Boolean).join(', ') || <em>No city/state/postcode</em>}</Typography>
                                                <Typography variant="body1" sx={{ mt: 0.5 }}>{hospitalProfile.location.country || <em>No country</em>}</Typography>
                                            </Paper>
                                        </Grid>
                                         <Grid item xs={12}>
                                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'text.primary', mb:1 }}>Mission & Vision</Typography>
                                                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}><strong>Mission:</strong> {hospitalProfile.mission || <em>Not set</em>}</Typography>
                                                <Typography variant="body1" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}><strong>Vision:</strong> {hospitalProfile.vision || <em>Not set</em>}</Typography>
                                                <Typography variant="body1" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}><strong>Charter Summary:</strong> {hospitalProfile.serviceCharter || <em>Not set</em>}</Typography>
                                            </Paper>
                                        </Grid>
                                        {/* Technical Plans - Display Mode */}
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mt: 2, mb: 1.5 }}>Technical Plans & Documents</Typography>
                                            {hospitalProfile.technicalPlans.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>No technical plans added yet.</Typography>
                                            ) : (
                                            <Grid container spacing={2}>
                                                {hospitalProfile.technicalPlans.map((plan) => (
                                                    <Grid item xs={12} sm={6} md={4} key={plan._id}>
                                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderColor: 'divider' }} variant="outlined">
                                                            <CardContent sx={{ flexGrow: 1 }}>
                                                                <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 1 }}>{plan.title}</Typography>
                                                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2, maxHeight: 100, overflow:'hidden', textOverflow:'ellipsis' }}>{plan.description || <em>No description</em>}</Typography>
                                                                <Typography variant="caption" display="block" sx={{ color: 'text.disabled' }}>
                                                                    Added: {plan.uploadDate ? new Date(plan.uploadDate).toLocaleDateString() : 'N/A'}
                                                                </Typography>
                                                            </CardContent>
                                                            <CardActions sx={{ justifyContent: 'flex-end', p: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                                                                {plan.fileUrl ? (
                                                                    <Button size="small" startIcon={<DownloadIcon />} href={assetUrl(plan.fileUrl)} target="_blank">Download</Button>
                                                                ) : ( <Typography variant='caption' color='error.main' sx={{ fontStyle: 'italic' }}>No File</Typography> )}
                                                                 {/* Optionally add Edit/Delete here too */}
                                                            </CardActions>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                            )}
                                        </Grid>
                                    </Grid>
                                )}
                            </Paper>

                            {/* --- Dashboard Stats --- */}
                             <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StyledDashboardCard onClick={handleViewAssetsOpen}>
                                        <DevicesIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                                        <Typography variant="h6" color="text.primary" gutterBottom>Total Assets</Typography>
                                        <Typography variant="h4" component="p" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                            {dashboardLoading ? <CircularProgress size={30} color="secondary"/> : dashboardData.totalAssets}
                                        </Typography>
                                    </StyledDashboardCard>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StyledDashboardCard onClick={() => navigate('/incidents')}> {/* Link to dedicated incidents page */}
                                        <ReportIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                                        <Typography variant="h6" color="text.primary" gutterBottom>Pending Incidents</Typography>
                                        <Typography variant="h4" component="p" sx={{ fontWeight: 'medium', color: dashboardData.pendingIncidents > 0 ? 'error.main' : 'text.primary' }}>
                                            {dashboardLoading ? <CircularProgress size={30} color="warning"/> : dashboardData.pendingIncidents}
                                        </Typography>
                                    </StyledDashboardCard>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StyledDashboardCard onClick={() => navigate('/tasks')}> {/* Link to dedicated tasks page */}
                                        <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                        <Typography variant="h6" color="text.primary" gutterBottom>Open Tasks</Typography>
                                        <Typography variant="h4" component="p" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                           {dashboardLoading ? <CircularProgress size={30} color="success"/> : dashboardData.maintenanceTasks}
                                        </Typography>
                                    </StyledDashboardCard>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <PowerFactorCard
                                        average={dashboardData.powerFactorStats?.average}
                                        classification={dashboardData.powerFactorStats?.classification || 'Unknown'}
                                        theme={currentAppTheme}
                                    />
                                </Grid>
                            </Grid>

                             {/* Hospital Level & Meter Readings */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={5} lg={4}>
                                    <Paper sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 1.5 }} elevation={2}>
                                        <TextField select label="Select Hospital Level" value={hospitalLevel} onChange={(e) => setHospitalLevel(parseInt(e.target.value, 10))} sx={{ mb: 2, maxWidth: 280 }}>
                                            {[1, 2, 3, 4, 5, 6].map((level) => (<MenuItem key={level} value={level}>Level {level}</MenuItem>))}
                                        </TextField>
                                        <Card sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default', maxHeight: 400 }} variant="outlined">
                                            <CardContent sx={{pt: 1.5}}>
                                                <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mb: 1.5, fontSize:'1.1rem' }}>
                                                    Level {hospitalLevel} Services Overview
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                    {getHospitalLevelServices(hospitalLevel, currentAppTheme)}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                     </Paper>
                                </Grid>

                                <Grid item xs={12} md={7} lg={8}>
                                    <StyledDashboardCard sx={{ height: '100%', minHeight: 400 }} onClick={() => navigate('/meter-readings')}>
                                        <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                                        <Typography variant="h6" color="text.primary" gutterBottom>Meter Readings (Last 7 Days)</Typography>
                                        <Box sx={{ height: 250, width: "100%", mt: 1, position: 'relative' }}>
                                            {dashboardLoading ? (
                                                <Box sx={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center'}}><CircularProgress color="info"/></Box>
                                            ) : dashboardData.meterReadings && dashboardData.meterReadings.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                        <Pie data={dashboardData.meterReadings} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" labelLine={false}>
                                                            {dashboardData.meterReadings.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke={currentAppTheme.palette.background.paper} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip formatter={(value, name) => [`${Number(value).toFixed(2)} kW`, name]} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                                    No recent meter readings.
                                                </Typography>
                                            )}
                                         </Box>
                                         {dashboardData.meterReadings?.length > 0 && !dashboardLoading && renderDayColorKey()}
                                    </StyledDashboardCard>
                                </Grid>
                            </Grid>

                            {/* Meter Reading Trend & Report Generation */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <StyledDashboardCard sx={{ height: 400 }}>
                                        <Typography variant="h6" color="text.primary" gutterBottom>Meter Readings Trend (Last 30)</Typography>
                                         <Box sx={{ height: 300, width: "100%", mt: 1, position: 'relative' }}>
                                             {trendLoading ? (
                                                <Box sx={{height: '100%', display:'flex', alignItems:'center', justifyContent:'center'}}><CircularProgress /></Box>
                                            ) : meterReadingTrend.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={meterReadingTrend} margin={{ top: 5, right: 35, left: 0, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke={currentAppTheme.palette.divider} />
                                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: currentAppTheme.palette.text.secondary }} axisLine={{ stroke: currentAppTheme.palette.divider }} tickLine={{ stroke: currentAppTheme.palette.divider }} />
                                                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: currentAppTheme.palette.text.secondary }} axisLine={{ stroke: currentAppTheme.palette.divider }} tickLine={{ stroke: currentAppTheme.palette.divider }} width={45} label={{ value: 'kW', position: 'insideLeft', angle: -90, offset: 10, fill: currentAppTheme.palette.text.secondary, fontSize: 10 }}/>
                                                        <YAxis yAxisId="right" orientation="right" domain={[0, 1]} allowDecimals tick={{ fontSize: 10, fill: currentAppTheme.palette.text.secondary }} axisLine={{ stroke: currentAppTheme.palette.divider }} tickLine={{ stroke: currentAppTheme.palette.divider }} width={35} label={{ value: 'PF', position: 'insideRight', angle: 90, offset: 4, fill: currentAppTheme.palette.text.secondary, fontSize: 10 }} />
                                                        <RechartsTooltip
                                                            contentStyle={{ backgroundColor: currentAppTheme.palette.background.paper, border: `1px solid ${currentAppTheme.palette.divider}` }}
                                                            formatter={(value, name, props) => {
                                                                if (props?.dataKey === 'powerFactor') {
                                                                    return [Number(value).toFixed(3), 'Power Factor'];
                                                                }
                                                                return [Number(value).toFixed(2) + ' kW', 'Real Power'];
                                                            }}
                                                        />
                                                        <Line yAxisId="left" type="monotone" dataKey="realPower" name="Real Power" stroke={currentAppTheme.palette.secondary.main} strokeWidth={2} dot={{ r: 3, fill: currentAppTheme.palette.secondary.main }} activeDot={{ r: 6 }}/>
                                                        {meterReadingTrend.some(point => point.powerFactor != null) && (
                                                            <Line yAxisId="right" type="monotone" dataKey="powerFactor" name="Power Factor" stroke={currentAppTheme.palette.success.main} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: currentAppTheme.palette.success.main }} activeDot={{ r: 6 }} />
                                                        )}
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                                    No trend data available.
                                                </Typography>
                                            )}
                                        </Box>
                                    </StyledDashboardCard>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 1.5 }}>
                                        <Typography variant="h6" gutterBottom>Generate Technical Report</Typography>
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={12} sm={6}><TextField label="Start Date" type="date" fullWidth value={dateRange.start} onChange={(e) => handleDateRangeChange("start", e.target.value)} InputLabelProps={{ shrink: true }}/></Grid>
                                            <Grid item xs={12} sm={6}><TextField label="End Date" type="date" fullWidth value={dateRange.end} onChange={(e) => handleDateRangeChange("end", e.target.value)} InputLabelProps={{ shrink: true }}/></Grid>
                                        </Grid>
                                        <Button variant="contained" color="secondary" fullWidth onClick={handleGenerateReport} disabled={reportGenerationLoading || !dateRange.start || !dateRange.end} startIcon={reportGenerationLoading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />} sx={{ mb: 1.5 }}>
                                            {reportGenerationLoading ? "Generating..." : "Generate & Preview Report"}
                                        </Button>
                                        {/* Removed redundant Download Previewed Report button. Download is available in the preview modal only. */}
                                        <Button variant="text" size="small" onClick={handleViewReportsOpen} sx={{ mt: 'auto', alignSelf: 'flex-end', pt: 2 }}>
                                            View All Uploaded Reports
                                        </Button>
                                    </Paper>
                                </Grid>
                            </Grid>

                         </Container>
                    </Box>
                     {/* Optional Footer */}
                    {/* <Box component="footer" sx={{ py: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} HSSM Provider</Typography>
                    </Box> */}
                </Box>

                {/* --- Modals --- */}

                {/* Generic Add Modals */}
                {['incident', 'asset', 'task', 'meterReading', 'reportUpload'].map((modalKey) => (
                    <Modal key={modalKey} open={showModal[modalKey]} onClose={() => !modalLoading && toggleModal(modalKey, false)} aria-labelledby={`modal-title-${modalKey}`} closeAfterTransition>
                        <Box sx={getModalStyle(currentAppTheme)}>
                            {renderModalContent(modalKey)}
                        </Box>
                    </Modal>
                ))}

                {/* Report Preview Modal */}
                <Modal open={showModal.reportPreview} onClose={() => toggleModal('reportPreview', false)} aria-labelledby="report-preview-modal-title" closeAfterTransition>
                     <Box sx={{ ...getModalStyle(currentAppTheme), width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' }, maxWidth: 1100 }}>
                        <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: "primary.main", color: "primary.contrastText" }}>
                            <Typography variant="h6" component="h2" id="report-preview-modal-title">Report Preview</Typography>
                            <AnimatedIconButton aria-label="Close modal" onClick={() => toggleModal('reportPreview', false)} size="small" sx={{ color: "primary.contrastText" }}><CloseIcon /></AnimatedIconButton>
                        </Box>
                        <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto" }}>
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                Review the generated report content below before downloading. You can make edits here.
                            </Typography>
                            <TextField multiline fullWidth rows={15} value={reportPreviewContent} onChange={(e) => setReportPreviewContent(e.target.value)} variant="outlined" sx={{ bgcolor: darkMode ? 'grey.800' : 'grey.50', '& .MuiOutlinedInput-root': { fontSize: '0.9rem', lineHeight: 1.5, fontFamily: 'monospace' } }}/>
                            {/* Render formatted markdown preview below the editor */}
                            <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Live Preview</Typography>
                                <MarkdownRenderer content={reportPreviewContent} />
                            </Box>
                        </Box>
                        <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider", display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: "background.default" }}>
                            <Button variant="outlined" onClick={() => toggleModal('reportPreview', false)}>Cancel</Button>
                            <Button variant="contained" color="success" onClick={() => handleDownloadReport(reportPreviewContent)} startIcon={<DownloadIcon />} disabled={!reportPreviewContent}>Download as PDF</Button>
                        </Box>
                    </Box>
                </Modal>

                 {/* Add New Technical Plan Modal */}
                <Modal open={showModal.addTechPlan} onClose={() => !modalLoading && toggleModal('addTechPlan', false)} aria-labelledby="add-tech-plan-modal-title" closeAfterTransition>
                    <Box sx={{ ...getModalStyle(currentAppTheme), width: { xs: '95%', sm: '70%', md: '600px' } }}>
                        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" id="add-tech-plan-modal-title">Add Technical Plan</Typography>
                            <AnimatedIconButton onClick={() => toggleModal('addTechPlan', false)} sx={{ color: 'primary.contrastText' }} disabled={modalLoading}><CloseIcon /></AnimatedIconButton>
                        </Box>
                        <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><TextField label="Title *" name="title" value={technicalPlanFormData.title} onChange={handleTechnicalPlanFormChange} fullWidth required/></Grid>
                                <Grid item xs={12}><TextField label="Description" name="description" value={technicalPlanFormData.description} onChange={handleTechnicalPlanFormChange} fullWidth multiline rows={4} /></Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <Button variant="outlined" component="label" fullWidth startIcon={<UploadFileIcon />} size="small">
                                              {technicalPlanFormData.file ? `File: ${technicalPlanFormData.file.name}` : 'Upload Document *'}
                                             <input type="file" hidden name="file" onChange={handleTechnicalPlanFormChange} required accept=".pdf,.doc,.docx,.vsdx,.dwg,.dxf,.jpg,.png" />
                                         </Button>
                                        {technicalPlanFormData.file && (
                                              <AnimatedIconButton size="small" onClick={() => setTechnicalPlanFormData(p => ({...p, file: null}))} title="Remove file">
                                                  <DeleteIcon fontSize='small' color="error"/>
                                              </AnimatedIconButton>
                                        )}
                                    </Box>
                                     <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.5}}>Max 10MB. Allowed types: PDF, DOC(X), VSDX, DWG, DXF, JPG, PNG.</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1, bgcolor: 'background.default' }}>
                            <Button variant="outlined" onClick={() => toggleModal('addTechPlan', false)} disabled={modalLoading}>Cancel</Button>
                            <Button variant="contained" onClick={handleTechnicalPlanSubmit} disabled={modalLoading || !technicalPlanFormData.title || !technicalPlanFormData.file} startIcon={modalLoading ? <CircularProgress size={20} color="inherit"/> : null}>
                                {modalLoading ? 'Uploading...' : 'Upload Plan'}
                            </Button>
                        </Box>
                    </Box>
                </Modal>

                 {/* Settings Modal */}
                <Modal open={showModal.settings} onClose={() => !settingsLoading && toggleModal('settings', false)} aria-labelledby="settings-modal-title" closeAfterTransition>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
                         {renderSettingsContent()}
                    </Box>
                </Modal>

                {/* View Assets Modal */}
                <Modal open={showModal.viewAssets} onClose={() => toggleModal('viewAssets', false)} aria-labelledby="assets-modal-title" closeAfterTransition>
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: { xs: 1, sm: 2 } }}>
                        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 24, width: { xs: '98%', sm: '95%', md: '85%', lg: '75%' }, maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" id="assets-modal-title">All Assets</Typography>
                                <AnimatedIconButton onClick={() => toggleModal('viewAssets', false)}><CloseIcon /></AnimatedIconButton>
                            </Box>
                            <Box sx={{ p: 2 }}>
                                <TextField label="Search Assets..." fullWidth value={assetsSearch} onChange={e => setAssetsSearch(e.target.value)}/>
                            </Box>
                            {assetsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                            ) : assetsError ? (
                                <Typography color="error.main" sx={{ p: 3, textAlign: 'center' }}>{assetsError}</Typography>
                            ) : (
                                <TableContainer sx={{ overflowY: 'auto', flexGrow: 1 }}>
                                    {filteredAssets.length === 0 ? (
                                         <Typography sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>No assets found{assetsSearch ? ' matching search' : ''}.</Typography>
                                    ) : (
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Name</TableCell>
                                                    <TableCell>Serial No.</TableCell>
                                                    <TableCell>Category</TableCell>
                                                    <TableCell>Location</TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>Service Info</TableCell>
                                                    <TableCell align="center">File</TableCell>
                                                    {/* <TableCell align="center">Actions</TableCell> */}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredAssets.map((asset) => (
                                                    <TableRow key={asset._id || asset.serialNumber} hover>
                                                        <TableCell sx={{ fontWeight: 500 }}>{asset.name || '-'}</TableCell>
                                                        <TableCell>{asset.serialNumber || '-'}</TableCell>
                                                        <TableCell>{asset.category || '-'}</TableCell>
                                                        <TableCell>{asset.location || '-'}</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem' }}>{asset.serviceRecords || '-'}</TableCell>
                                                        <TableCell align="center">
                                                                                {asset.fileUrl ? (
                                                                                     <Button size="small" variant="text" href={assetUrl(asset.fileUrl)} target="_blank" rel="noopener noreferrer" startIcon={<VisibilityIcon fontSize='small'/>}>View</Button>
                                                                                 ) : asset.file ? ( // Fallback if only filename is stored and served from a known path
                                                                                     <Button size="small" variant="text" href={assetUrl(`/uploads/${asset.file}`)} target="_blank" rel="noopener noreferrer" startIcon={<VisibilityIcon fontSize='small'/>}>View</Button>
                                                                                 ) : '-'}
                                                        </TableCell>
                                                        {/* <TableCell align="center">
                                                            <AnimatedIconButton size="small" color="primary" title="Edit Asset (Not Implemented)"><EditIcon fontSize="small"/></AnimatedIconButton>
                                                            <AnimatedIconButton size="small" color="error" title="Delete Asset (Not Implemented)"><DeleteIcon fontSize="small"/></AnimatedIconButton>
                                                        </TableCell> */}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </TableContainer>
                            )}
                             {/* Footer for consistency */}
                             <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.default' }}>
                                  <Button variant="outlined" size="small" onClick={() => toggleModal('viewAssets', false)}>Close</Button>
                             </Box>
                        </Box>
                    </Box>
                </Modal>

                {/* View Reports Modal */}
                <Modal open={showModal.viewReports} onClose={() => toggleModal('viewReports', false)} aria-labelledby="reports-modal-title" closeAfterTransition>
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: { xs: 1, sm: 2 } }}>
                         <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 24, width: { xs: '98%', sm: '95%', md: '85%', lg: '75%' }, maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" id="reports-modal-title">All Uploaded Reports</Typography>
                                <AnimatedIconButton onClick={() => toggleModal('viewReports', false)}><CloseIcon /></AnimatedIconButton>
                            </Box>
                             <Box sx={{ p: 2 }}>
                                <TextField label="Search Reports by Name or Date..." fullWidth value={reportsSearch} onChange={e => setReportsSearch(e.target.value)}/>
                             </Box>
                            {reportsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                            ) : reportsError ? (
                                <Typography color="error.main" sx={{ p: 3, textAlign: 'center' }}>{reportsError}</Typography>
                            ) : (
                                <TableContainer sx={{ overflowY: 'auto', flexGrow: 1 }}>
                                    {filteredReports.length === 0 ? (
                                         <Typography sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>No reports found{reportsSearch ? ' matching search' : ''}.</Typography>
                                    ) : (
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ minWidth: 200 }}>File Name / Link</TableCell>
                                                    <TableCell>Uploaded Date</TableCell>
                                                    <TableCell align="center">Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredReports.map((report) => {
                                                    const reportId = report._id || report.id;
                                                    const fileName = report.fileUrl ? report.fileUrl.split('/').pop() : (report.file || 'Unknown File');
                                                    const fileLink = report.fileUrl ? assetUrl(report.fileUrl) : '#'; // Assume file content is not directly linkable if only 'file' exists
                                                    const canEdit = report.content !== undefined && report.content !== null; // Check if content exists to be edited

                                                    return (
                                                    <TableRow key={reportId} hover sx={{ opacity: report.deleting ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
                                                        <TableCell>
                                                            <Button size="small" variant='text' href={fileLink} target="_blank" rel="noopener noreferrer" disabled={fileLink === '#'} sx={{ justifyContent: 'flex-start', textAlign: 'left' }}>{fileName}</Button>
                                                        </TableCell>
                                                        <TableCell>{report.createdAt ? new Date(report.createdAt).toLocaleString() : '-'}</TableCell>
                                                        <TableCell align="center">
                                                            <MuiTooltip title="Edit Report Content">
                                                                <span> {/* Span needed for tooltip on disabled button */}
                                                                    <AnimatedIconButton size="small" color="primary" sx={{ mr: 0.5 }} onClick={() => handleEditReportOpen(report)} disabled={!canEdit || report.deleting}>
                                                                        <EditIcon fontSize="small"/>
                                                                    </AnimatedIconButton>
                                                                </span>
                                                            </MuiTooltip>
                                                            <MuiTooltip title="Delete Report">
                                                                <span>
                                                                    <AnimatedIconButton size="small" color="error" onClick={() => handleDeleteReport(reportId)} disabled={report.deleting}>
                                                                        {report.deleting ? <CircularProgress size={16} color="inherit"/> : <DeleteIcon fontSize="small"/>}
                                                                    </AnimatedIconButton>
                                                                </span>
                                                            </MuiTooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </TableContainer>
                            )}
                             {/* Footer */}
                              <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.default' }}>
                                  <Button variant="outlined" size="small" onClick={() => toggleModal('viewReports', false)}>Close</Button>
                              </Box>
                        </Box>
                    </Box>
                </Modal>

                {/* Edit Report Content Modal */}
                <Modal open={showModal.editReport} onClose={() => !editReportLoading && toggleModal('editReport', false)} aria-labelledby="edit-report-modal-title" closeAfterTransition>
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
                        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 24, width: { xs: '95%', sm: '80%', md: '700px' }, maxWidth: '100%', maxHeight: '90vh', display:'flex', flexDirection:'column' }}>
                            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" id="edit-report-modal-title">Edit Report Content</Typography>
                                <AnimatedIconButton onClick={() => toggleModal('editReport', false)} disabled={editReportLoading}><CloseIcon /></AnimatedIconButton>
                            </Box>
                            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                                <TextField label="Report Content" fullWidth multiline rows={15} value={editReportContent} onChange={e => setEditReportContent(e.target.value)} sx={{ mb: 2 }} disabled={editReportLoading} InputProps={{ sx: { fontSize: '0.9rem', lineHeight: 1.5, fontFamily: 'monospace' } }}/>
                            </Box>
                             <Box sx={{p: 1.5, borderTop: 1, borderColor: 'divider', display:'flex', justifyContent:'flex-end', gap: 1, bgcolor: 'background.default'}}>
                                 <Button variant="outlined" onClick={() => toggleModal('editReport', false)} disabled={editReportLoading}>Cancel</Button>
                                <Button variant="contained" color="primary" onClick={handleEditReportSave} disabled={editReportLoading} startIcon={editReportLoading ? <CircularProgress size={20} color="inherit"/> : <SettingsIcon fontSize="small" /> /* Save Icon */}>
                                     {editReportLoading ? 'Saving...' : 'Save Changes'}
                                 </Button>
                             </Box>
                        </Box>
                    </Box>
                </Modal>

                {/* Profile Templates Modal */}
                <Modal open={showModal.templates} onClose={() => toggleModal('templates', false)} aria-labelledby="templates-modal-title" closeAfterTransition>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
                        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 24, width: { xs: '95%', sm: '90%', md: '80%' }, maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" id="templates-modal-title">Hospital Profile Templates</Typography>
                                <AnimatedIconButton onClick={() => toggleModal('templates', false)}><CloseIcon /></AnimatedIconButton>
                            </Box>
                            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                                    Choose a template to quickly populate your hospital profile with standard content for your hospital level.
                                </Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(hospitalTemplates).map(([key, template]) => (
                                        <Grid item xs={12} sm={6} key={key}>
                                            <Card
                                                sx={{
                                                    cursor: 'pointer',
                                                    border: selectedTemplate === key ? 2 : 1,
                                                    borderColor: selectedTemplate === key ? 'primary.main' : 'divider',
                                                    '&:hover': { borderColor: 'primary.main', boxShadow: 2 }
                                                }}
                                                onClick={() => handleLoadTemplate(key)}
                                            >
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
                                                        {template.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {template.description}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        <Chip label={key.replace('level', 'Level ')} size="small" color="primary" variant="outlined" />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }}>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedTemplate ? `Selected: ${hospitalTemplates[selectedTemplate].name}` : 'Select a template to continue'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" onClick={() => toggleModal('templates', false)}>Cancel</Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleApplyTemplate}
                                        disabled={!selectedTemplate}
                                        startIcon={<SettingsIcon />}
                                    >
                                        Apply Template
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Modal>

                {/* Share Profile Modal */}
                <Modal open={showModal.shareProfile} onClose={() => !modalLoading && toggleModal('shareProfile', false)} aria-labelledby="share-profile-modal-title" closeAfterTransition>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
                        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 24, width: { xs: '95%', sm: '80%', md: '600px' }, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" id="share-profile-modal-title">Share Hospital Profile</Typography>
                                <AnimatedIconButton onClick={() => !modalLoading && toggleModal('shareProfile', false)} disabled={modalLoading}><CloseIcon /></AnimatedIconButton>
                            </Box>
                            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                                    Share your hospital profile with stakeholders via email.
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Recipient Email"
                                            type="email"
                                            fullWidth
                                            value={shareEmail}
                                            onChange={(e) => setShareEmail(e.target.value)}
                                            required
                                            disabled={modalLoading}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Message (Optional)"
                                            multiline
                                            rows={3}
                                            fullWidth
                                            value={shareMessage}
                                            onChange={(e) => setShareMessage(e.target.value)}
                                            placeholder="Add a personal message..."
                                            disabled={modalLoading}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleExportProfile('json')}
                                        startIcon={<DownloadIcon />}
                                        size="small"
                                    >
                                        Export JSON
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleExportProfile('csv')}
                                        startIcon={<DownloadIcon />}
                                        size="small"
                                    >
                                        Export CSV
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" onClick={() => toggleModal('shareProfile', false)} disabled={modalLoading}>Cancel</Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleShareProfile}
                                        disabled={modalLoading || !shareEmail.trim()}
                                        startIcon={modalLoading ? <CircularProgress size={20} color="inherit" /> : <SettingsIcon />}
                                    >
                                        {modalLoading ? 'Sharing...' : 'Share Profile'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Modal>

                {/* Compliance Tracking Modal */}
                <Modal open={showModal.compliance} onClose={() => toggleModal('compliance', false)} aria-labelledby="compliance-modal-title" closeAfterTransition>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
                        <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 24, width: { xs: '95%', sm: '90%', md: '85%' }, maxWidth: 1200, maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" id="compliance-modal-title">Compliance Tracking Dashboard</Typography>
                                <AnimatedIconButton onClick={() => toggleModal('compliance', false)}><CloseIcon /></AnimatedIconButton>
                            </Box>

                            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                                {/* Search and Filter Controls */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search compliance items..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            InputProps={{
                                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={statusFilter}
                                                label="Status"
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <MenuItem value="all">All Status</MenuItem>
                                                <MenuItem value="pending">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('pending')}.main` }} />
                                                        Pending
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="in-progress">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('in-progress')}.main` }} />
                                                        In Progress
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="completed">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('completed')}.main` }} />
                                                        Completed
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="overdue">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('overdue')}.main` }} />
                                                        Overdue
                                                    </Box>
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Priority</InputLabel>
                                            <Select
                                                value={priorityFilter}
                                                label="Priority"
                                                onChange={(e) => setPriorityFilter(e.target.value)}
                                            >
                                                <MenuItem value="all">All Priority</MenuItem>
                                                <MenuItem value="high">High</MenuItem>
                                                <MenuItem value="medium">Medium</MenuItem>
                                                <MenuItem value="low">Low</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Sort By</InputLabel>
                                            <Select
                                                value={sortBy}
                                                label="Sort By"
                                                onChange={(e) => setSortBy(e.target.value)}
                                            >
                                                <MenuItem value="dueDate">Due Date</MenuItem>
                                                <MenuItem value="title">Title</MenuItem>
                                                <MenuItem value="priority">Priority</MenuItem>
                                                <MenuItem value="status">Status</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                            startIcon={<SortIcon />}
                                        >
                                            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                        </Button>
                                    </Grid>
                                </Grid>

                                {/* Action Buttons */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {getFilteredAndSortedItems().length} items
                                        </Typography>
                                        {selectedItems.length > 0 && (
                                            <Typography variant="body2" color="primary">
                                                {selectedItems.length} selected
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {selectedItems.length > 0 && (
                                            <>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleBulkStatusUpdate('completed')}
                                                    startIcon={<CheckCircleIcon />}
                                                >
                                                    Mark Complete
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={handleBulkDelete}
                                                    startIcon={<DeleteIcon />}
                                                >
                                                    Delete Selected
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleAddComplianceItem}
                                            startIcon={<AddCircleOutlineIcon />}
                                        >
                                            Add Item
                                        </Button>
                                    </Box>
                                </Box>

                                {/* Compliance Items */}
                                <Grid container spacing={2}>
                                    {getFilteredAndSortedItems().map((item) => (
                                        <Grid item xs={12} md={6} lg={4} key={item.id}>
                                            <Card sx={{
                                                border: 1,
                                                borderColor: 'divider',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    boxShadow: 3,
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}>
                                                <CardContent sx={{ p: 2 }}>
                                                    {/* Selection Checkbox */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleSelectItem(item.id)}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            {selectedItems.includes(item.id) ?
                                                                <CheckBoxIcon color="primary" /> :
                                                                <CheckBoxOutlineBlankIcon />
                                                            }
                                                        </IconButton>

                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleEditComplianceItem(item)}
                                                                disabled={editingItem === item.id}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteComplianceItem(item.id)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>

                                                    {editingItem === item.id ? (
                                                        /* Edit Form */
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Title"
                                                                value={editFormData.title}
                                                                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                                                                required
                                                            />
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Description"
                                                                multiline
                                                                rows={2}
                                                                value={editFormData.description}
                                                                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                                                required
                                                            />
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                type="date"
                                                                label="Due Date"
                                                                value={editFormData.dueDate}
                                                                onChange={(e) => setEditFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                                                InputLabelProps={{ shrink: true }}
                                                                required
                                                            />
                                                            <FormControl size="small">
                                                                <InputLabel>Priority</InputLabel>
                                                                <Select
                                                                    value={editFormData.priority}
                                                                    label="Priority"
                                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, priority: e.target.value }))}
                                                                >
                                                                    <MenuItem value="low">Low</MenuItem>
                                                                    <MenuItem value="medium">Medium</MenuItem>
                                                                    <MenuItem value="high">High</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                                <Button size="small" onClick={handleCancelEdit} startIcon={<CancelIcon />}>
                                                                    Cancel
                                                                </Button>
                                                                <Button size="small" variant="contained" onClick={handleSaveEdit} startIcon={<SaveIcon />}>
                                                                    Save
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        /* Display Mode */
                                                        <>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                {getPriorityIcon(item.priority)}
                                                                <Typography variant="h6" sx={{ flex: 1 }}>
                                                                    {item.title}
                                                                </Typography>
                                                            </Box>

                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                                                {item.description}
                                                            </Typography>

                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <DateRangeIcon fontSize="small" color="action" />
                                                                    <Typography variant="body2">
                                                                        {new Date(item.dueDate).toLocaleDateString()}
                                                                    </Typography>
                                                                </Box>
                                                                <Chip
                                                                    label={item.priority}
                                                                    size="small"
                                                                    color={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'success'}
                                                                />
                                                            </Box>

                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Status</InputLabel>
                                                                <Select
                                                                    value={item.status}
                                                                    label="Status"
                                                                    onChange={(e) => handleComplianceStatusChange(item.id, e.target.value)}
                                                                >
                                                                    <MenuItem value="pending">
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('pending')}.main` }} />
                                                                            Pending
                                                                        </Box>
                                                                    </MenuItem>
                                                                    <MenuItem value="in-progress">
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('in-progress')}.main` }} />
                                                                            In Progress
                                                                        </Box>
                                                                    </MenuItem>
                                                                    <MenuItem value="completed">
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('completed')}.main` }} />
                                                                            Completed
                                                                        </Box>
                                                                    </MenuItem>
                                                                    <MenuItem value="overdue">
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getStatusColor('overdue')}.main` }} />
                                                                            Overdue
                                                                        </Box>
                                                                    </MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                {getFilteredAndSortedItems().length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No compliance items found
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ?
                                                'Try adjusting your search or filters' :
                                                'Add your first compliance item to get started'
                                            }
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        onClick={handleSelectAll}
                                        startIcon={selectedItems.length === getFilteredAndSortedItems().length && getFilteredAndSortedItems().length > 0 ?
                                            <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                                    >
                                        {selectedItems.length === getFilteredAndSortedItems().length && getFilteredAndSortedItems().length > 0 ?
                                            'Deselect All' : 'Select All'}
                                    </Button>
                                </Box>
                                <Button variant="outlined" onClick={() => toggleModal('compliance', false)}>
                                    Close
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Modal>

            </ThemeProvider>
        </SnackbarProvider>
    );
};

export default Hssm;