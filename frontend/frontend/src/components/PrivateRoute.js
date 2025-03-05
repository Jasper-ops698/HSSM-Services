import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, role }) => {
  // Retrieve token and user data from localStorage
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');

  // Parse the userData, if exists
  const user = token && userData ? JSON.parse(userData) : null;

  // If no token or user data, redirect to login
  if (!token || !user) {
    console.log('No user or token found. Redirecting to login.');
    return <Navigate to="/login" />;
  }

  // If the role is provided and user doesn't have the required role, redirect to access-denied
  if (role && user.role !== role) {
    console.log(`Access Denied. User role: ${user.role}, Required role: ${role}`);
    return <Navigate to="/" />;
  }

  // Render the protected component if user is authenticated and has the correct role
  return children;
};

export default PrivateRoute;
