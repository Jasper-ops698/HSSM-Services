import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  // Retrieve token and user data from localStorage
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');

  // Parse the userData, if exists
  const user = token && userData ? JSON.parse(userData) : null;

  // Debugging log for user state
  console.log('PrivateRoute: user:', user);

  // If no token or user data, redirect to login
  if (!token || !user) {
    console.log('No user or token found. Redirecting to login.');
    return <Navigate to="/login" />;
  }

  // If allowedRoles is provided and user doesn't have one of the required roles, redirect to unauthorized page
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log(`Access Denied. User role: ${user.role}, Required roles: ${allowedRoles.join(', ')}`);
    // If the user is authenticated but has no assigned role yet, redirect them to the
    // friendly waiting page so staff accounts created by sign-up see a pending message
    // rather than a stark 'Unauthorized' page.
    if (!user.role) {
      return <Navigate to="/waiting-for-role" />;
    }
    return <Navigate to="/unauthorized" />;
  }

  // Render the protected component if user is authenticated and has the correct role
  return <Outlet />;
};

export default PrivateRoute;
