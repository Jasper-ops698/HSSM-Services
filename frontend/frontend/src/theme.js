import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1f2937',
      light: '#374151',
      dark: '#111827',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6fa',
      paper: '#ffffff',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#000000',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: '2.5rem',
      '@media (min-width:600px)': {
        fontSize: '3rem',
      },
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.75rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          '&:focus-visible': {
            outline: '2px solid #3b82f6',
            outlineOffset: '2px',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#3b82f6',
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '1px 0 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          fontSize: '0.75rem',
          padding: '8px 12px',
          borderRadius: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

export default theme;