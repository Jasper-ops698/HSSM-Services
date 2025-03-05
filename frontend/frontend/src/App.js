import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import Breadcrumbs from './components/Breadcrumbs';
import AuthProvider from './context/AuthContext'; 
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary'; // New error boundary component
import Loading from './components/Loading'; // Fallback loading component

// Lazy-loaded components
const Home = React.lazy(() => import('./pages/Home'));
const ServiceRequestForm = React.lazy(() => import('./pages/ServicePage'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Footer = React.lazy(() => import('./pages/AboutPage'));
const AdminDashboard = React.lazy(() => import('./pages/Admin'));
const Hssm = React.lazy(() => import('./pages/HSSM'));
const NotFound = React.lazy(() => import('../src/NotFound')); // 404 Page
const Total = React.lazy(() => import('./pages/Total'));

// Updated MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0052cc', // Modern vibrant blue
    },
    secondary: {
      main: '#ff4081', // Trendy magenta
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif", // Default modern typography
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Navbar />
          <Breadcrumbs language="en" />
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/service" element={<ServiceRequestForm />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about" element={<Footer />} />
                <Route path="/total" element={<Total />} />

                {/* Protected Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <PrivateRoute role="admin">
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute role="service-provider">
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route 
                  path="/hssm" 
                  element={
                    <PrivateRoute role="HSSM-provider">
                      <Hssm />
                    </PrivateRoute>
                  }
                />

                {/* Catch-All Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
