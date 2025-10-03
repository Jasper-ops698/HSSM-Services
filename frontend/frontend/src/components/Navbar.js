import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import ncmtc from './assests/ncmtc.png';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClose = () => {
    setMobileOpen(false);
  };

  const menuItems = [
    { text: 'Home', path: '/' },
    { text: 'Sign Up', path: '/signup' },
    { text: 'Login', path: '/login' },
  ];

  // 2FA menu item for logged-in users
  const twoFAMenuItem = { text: '2FA', path: '/2fa' };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <img src={ncmtc} alt= "ncmtc logo" className='ncmtc'/>
          <span>HSSM Services</span>
        </Typography>

        {/* Desktop Nav Links */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
          {menuItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              component={Link}
              to={item.path}
              sx={{ textDecoration: 'none' }}
            >
              {item.text}
            </Button>
          ))}
          {user && (
            <>
              {/* Classes link removed */}
              {user.role === 'admin' && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/admin-panel"
                  sx={{ textDecoration: 'none' }}
                >
                  Admin Panel
                </Button>
              )}
              {user.role === 'teacher' && (
                <>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/teacher-dashboard"
                    sx={{ textDecoration: 'none' }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/manage-classes"
                    sx={{ textDecoration: 'none' }}
                  >
                    Manage Classes
                  </Button>
                </>
              )}
              {user.role === 'HOD' && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/hod-dashboard"
                  sx={{ textDecoration: 'none' }}
                >
                  HOD Dashboard
                </Button>
              )}
              {user.role === 'student' && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/student-dashboard"
                  sx={{ textDecoration: 'none' }}
                >
                  Student Dashboard
                </Button>
              )}
              {user.role === 'credit-controller' && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/credit-dashboard"
                  sx={{ textDecoration: 'none' }}
                >
                  Credit Dashboard
                </Button>
              )}
              {user.role === 'HSSM-provider' && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/hssm-dashboard"
                  sx={{ textDecoration: 'none' }}
                >
                  HSSM Dashboard
                </Button>
              )}
              <Button
                color="inherit"
                component={Link}
                to="/profile"
                sx={{ textDecoration: 'none' }}
              >
                Profile
              </Button>
              {/* AI Chat moved to the homepage floating widget; route/link removed */}
              <Button
                color="inherit"
                component={Link}
                to={twoFAMenuItem.path}
                sx={{ textDecoration: 'none' }}
              >
                {twoFAMenuItem.text}
              </Button>
              <NotificationCenter />
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </Box>

        {/* Mobile Menu Icon */}
        <IconButton
          color="inherit"
          edge="end"
          onClick={toggleMobileMenu}
          sx={{ display: { xs: 'block', sm: 'none' } }}
          aria-label="open drawer"
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleMenuClose}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                onClick={handleMenuClose}
              >
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            {user && (
              <>
                {/* Classes link removed from mobile drawer */}
                {user.role === 'admin' && (
                  <ListItem
                    button
                    component={Link}
                    to="/admin-panel"
                    onClick={handleMenuClose}
                  >
                    <ListItemText primary="Admin Panel" />
                  </ListItem>
                )}
                {user.role === 'teacher' && (
                  <>
                    <ListItem
                      button
                      component={Link}
                      to="/teacher-dashboard"
                      onClick={handleMenuClose}
                    >
                      <ListItemText primary="Dashboard" />
                    </ListItem>
                    <ListItem
                      button
                      component={Link}
                      to="/manage-classes"
                      onClick={handleMenuClose}
                    >
                      <ListItemText primary="Manage Classes" />
                    </ListItem>
                  </>
                )}
                {user.role === 'HOD' && (
                  <ListItem
                    button
                    component={Link}
                    to="/hod-dashboard"
                    onClick={handleMenuClose}
                  >
                    <ListItemText primary="HOD Dashboard" />
                  </ListItem>
                )}
                {user.role === 'student' && (
                  <ListItem
                    button
                    component={Link}
                    to="/student-dashboard"
                    onClick={handleMenuClose}
                  >
                    <ListItemText primary="Student Dashboard" />
                  </ListItem>
                )}
                {user.role === 'credit-controller' && (
                  <ListItem
                    button
                    component={Link}
                    to="/credit-dashboard"
                    onClick={handleMenuClose}
                  >
                    <ListItemText primary="Credit Dashboard" />
                  </ListItem>
                )}
                {user.role === 'HSSM-provider' && (
                  <ListItem
                    button
                    component={Link}
                    to="/hssm-dashboard"
                    onClick={handleMenuClose}
                  >
                    <ListItemText primary="HSSM Dashboard" />
                  </ListItem>
                )}
                <ListItem
                  button
                  component={Link}
                  to="/profile"
                  onClick={handleMenuClose}
                >
                  <ListItemText primary="Profile" />
                </ListItem>
                {/* Mobile AI Chat link removed - chat is available on the homepage as a floating widget */}
                <ListItem
                  button
                  component={Link}
                  to={twoFAMenuItem.path}
                  onClick={handleMenuClose}
                >
                  <ListItemText primary={twoFAMenuItem.text} />
                </ListItem>
                <ListItem button onClick={() => { logout(); handleMenuClose(); }}>
                  <ListItemText primary="Logout" />
                </ListItem>
              </>
            )}
          </List>
        {user && <NotificationCenter />}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;