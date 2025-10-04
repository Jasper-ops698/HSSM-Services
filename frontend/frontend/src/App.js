import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import Breadcrumbs from './components/Breadcrumbs';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/PrivateRoute'; 
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading'; // Fallback loading component

// Lazy-loaded components
const Home = React.lazy(() => import('./pages/Home'));
// ClassEnrollmentPage removed (classes feature deprecated)
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const WaitingForRole = React.lazy(() => import('./pages/WaitingForRole'));
const Footer = React.lazy(() => import('./pages/AboutPage'));
const AdminDashboard = React.lazy(() => import('./pages/Admin'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const ClassTimetableManager = React.lazy(() => import('./pages/ClassTimetableManager'));
const Hssm = React.lazy(() => import('./pages/HSSM'));
const HssmDashboard = React.lazy(() => import('./pages/HssmDashboard'));
const NotFound = React.lazy(() => import('../src/NotFound')); // 404 Page
const Profile2FA = React.lazy(() => import('./pages/Profile2FA'));
const ReportCenter = React.lazy(() => import('./pages/ReportCenter'));
const ReportEditor = React.lazy(() => import('./pages/ReportEditor'));
const TeacherClassManagement = React.lazy(() => import('./pages/TeacherClassManagement'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const HodDashboard = React.lazy(() => import('./pages/HodDashboard'));
const CreditControllerDashboard = React.lazy(() => import('./pages/CreditControllerDashboard'));
const CreateClass = React.lazy(() => import('./pages/CreateClass'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const VenueBooking = React.lazy(() => import('./pages/VenueBooking'));
const ClassManagement = React.lazy(() => import('./pages/ClassManagement'));
// Add an Unauthorized page component (you'll need to create this simple page)
const UnauthorizedPage = React.lazy(() => import('./pages/UnauthorizedPage'));
const EmailVerification = React.lazy(() => import('./pages/EmailVerification'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
// Chat page removed: chat is provided as a floating widget on the home page

// Updated MUI theme (keep your theme)
const theme = createTheme({
  palette: {
    primary: {
      main: '#0052cc',
    },
    secondary: {
      main: '#ff4081',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* AuthProvider should wrap everything related to auth/routing */}
        <AuthProvider>
          <Navbar />
          <Breadcrumbs language="en" />
          <ErrorBoundary>
            {/* Suspense wraps all lazy-loaded routes */}
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about" element={<Footer />} />
                <Route path="/waiting-for-role" element={<WaitingForRole />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                {/* Route for unauthorized access */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                {/* User 2FA self-service page */}
                <Route path="/2fa" element={<Profile2FA />} />

                {/* --- Protected Routes --- */}

                {/* Group 1: Routes requiring login, but no specific role (like individual users) */}
                {/* The ProtectedRoute component without 'allowedRoles' just checks for login */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<UserProfile />} />
                  {/* Add other general authenticated routes here if needed */}
                </Route>

                {/* Group 2: Routes requiring 'admin', 'HOD', or 'teacher' role */}
                {/* Pass the required roles as an array to 'allowedRoles' */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'HOD', 'teacher']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin-panel" element={<AdminPanel />} />
                  <Route path="/class-timetable" element={<ClassTimetableManager />} />
                  <Route path="/manage-classes" element={<ClassManagement />} />
                </Route>


                {/* Group 3: Dashboard route for multiple roles */}
                <Route element={<ProtectedRoute allowedRoles={['student', 'teacher']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                {/* Group 6: Student-specific routes */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                  <Route path="/student-dashboard" element={<StudentDashboard />} />
                </Route>

                {/* Group 4: Teacher-specific routes */}
                <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                  <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                  <Route path="/manage-classes" element={<TeacherClassManagement />} />
                  <Route path="/create-class" element={<CreateClass />} />
                  <Route path="/book-venue" element={<VenueBooking />} />
                </Route>

                {/* Group 7: HOD-specific routes */}
                <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
                  <Route path="/hod-dashboard" element={<HodDashboard />} />
                </Route>

                {/* Group 8: Credit Controller-specific routes */}
                <Route element={<ProtectedRoute allowedRoles={['credit-controller']} />}>
                  <Route path="/credit-dashboard" element={<CreditControllerDashboard />} />
                </Route>

                {/* Group 5: Routes requiring 'HSSM-provider' role */}
                <Route element={<ProtectedRoute allowedRoles={['HSSM-provider']} />}> 
                  <Route path="/hssm" element={<Hssm />} />
                  <Route path="/report-center" element={<ReportCenter />} />
                  <Route path="/report-editor/:id" element={<ReportEditor />} />
                  <Route path="/hssm-dashboard" element={<HssmDashboard />} />
                </Route>

                {/* Catch-All Route for 404 Not Found - Must be last */}
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