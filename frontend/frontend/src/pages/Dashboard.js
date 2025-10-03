import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import HodDashboard from './HodDashboard';
import CreditControllerDashboard from './CreditControllerDashboard';
import HssmProviderDashboard from './HssmProviderDashboard';
// Import other role-specific dashboards here
// e.g., import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Render different dashboards based on user role
  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'HOD':
      return <HodDashboard />;
    case 'credit-controller':
      return <CreditControllerDashboard />;
    case 'HSSM-provider':
      return <HssmProviderDashboard />;
    // case 'admin':
    //   return <AdminDashboard />;
    default:
      // Fallback for other roles or if role is not defined
      return <div>Welcome to your dashboard.</div>;
  }
};

export default Dashboard;