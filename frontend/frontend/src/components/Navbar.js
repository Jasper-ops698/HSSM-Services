import React, { useContext, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClose = () => {
    setMobileOpen(false);
  };

  const menuItems = [
    { text: 'Home', path: '/' },
    { text: 'Services', path: '/services' },
    { text: 'Sign Up', path: '/signup' },
    { text: 'Login', path: '/login' }
  ];

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Jasper Services
        </Typography>

        {/* Desktop Nav Links */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          {menuItems.map((item) => (
            <Button key={item.text} color="inherit" component={Link} to={item.path}>
              {item.text}
            </Button>
          ))}
          {user && (
            <>
              <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          )}
        </Box>

        {/* Mobile Menu Icon */}
        <IconButton
          color="inherit"
          edge="end"
          onClick={toggleMobileMenu}
          sx={{ display: { xs: 'block', sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleMenuClose}
          sx={{ display: { xs: 'block', sm: 'none' } }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} component={Link} to={item.path} onClick={handleMenuClose}>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            {user && (
              <>
                <ListItem button component={Link} to="/dashboard" onClick={handleMenuClose}>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={logout}>
                  <ListItemText primary="Logout" />
                </ListItem>
              </>
            )}
          </List>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
