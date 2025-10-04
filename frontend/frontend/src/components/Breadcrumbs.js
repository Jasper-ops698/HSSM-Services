import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Breadcrumbs as MUIBreadcrumbs, Typography, Link, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Multilingual support
const breadcrumbLabels = {
  home: { en: 'Home', es: 'Inicio' },
  services: { en: 'Services', es: 'Servicios' },
  plumbing: { en: 'Plumbing', es: 'Fontanería' },
  dashboard: { en: 'Dashboard', es: 'Tablero' },
};

const getLabel = (key, lang = 'en') => {
  return breadcrumbLabels[key]?.[lang] || key.charAt(0).toUpperCase() + key.slice(1);
};

const Breadcrumbs = ({ language = 'en' }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <MUIBreadcrumbs
      aria-label="breadcrumb"
      sx={{
        padding: '8px 16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        margin: '16px 0',
      }}
    >
      {/* Home link */}
      <Tooltip title="Go to Home">
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon fontSize="small" sx={{ marginRight: 0.5 }} />
          {getLabel('home', language)}
        </Link>
      </Tooltip>

      {/* Dynamic Breadcrumbs */}
      {pathnames.map((value, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        const getIcon = (value) => {
          switch (value.toLowerCase()) {
            case 'services':
              return <FolderIcon fontSize="small" sx={{ marginRight: 0.5 }} />;
            case 'dashboard':
              return <AssignmentIcon fontSize="small" sx={{ marginRight: 0.5 }} />;
            default:
              return null;
          }
        };

        return isLast ? (
          <Typography
            color="textPrimary"
            key={index}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {getIcon(value)}
            {getLabel(value, language)}
          </Typography>
        ) : (
          <Tooltip title={`Go to ${getLabel(value, language)}`} key={index}>
            <Link
              component={RouterLink}
              to={routeTo}
              underline="hover"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {getIcon(value)}
              {getLabel(value, language)}
            </Link>
          </Tooltip>
        );
      })}
    </MUIBreadcrumbs>
  );
};

export default Breadcrumbs;