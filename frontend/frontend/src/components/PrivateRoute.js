import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();  // Use useAuth hook to get user

  // If user is not logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, render the children components
  return children;
};

export default PrivateRoute;
