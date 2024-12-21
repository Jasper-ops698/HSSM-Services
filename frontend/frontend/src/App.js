import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import Breadcrumbs from './components/Breadcrumbs';
import Home from './pages/Home';
import ServiceRequestForm from './pages/ServicePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AuthProvider from './context/AuthContext'; 
import PrivateRoute from './components/PrivateRoute';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import PaymentPage from './pages/PaymentPage';
import About from './pages/AboutPage';
import AdminDashboard from './pages/Admin';
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', 
    },
    secondary: {
      main: '#dc004e', 
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Navbar />
          <Breadcrumbs language="en" /> {/* multilingual support */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/service" element={<ServiceRequestForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/paymentHistory" element={<PaymentHistoryPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/about" element={<About />} />
            <Route 
            path="/admin" element={ 
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
