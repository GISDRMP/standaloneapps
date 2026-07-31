import { createTheme } from '@mui/material/styles';

export const palette = {
  background: '#020712',
  panel: '#06111f',
  panelAlt: '#081829',
  border: 'rgba(70, 190, 255, 0.22)',
  borderStrong: 'rgba(78, 213, 255, 0.48)',
  text: '#e6f4ff',
  textMuted: '#8ea8bc',
  electric: '#2f9cff',
  cyan: '#31d7ff',
  normal: '#39d353',
  warning: '#ffd23f',
  high: '#ff8c1a',
  critical: '#ff3b30',
};

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: palette.background,
      paper: palette.panel,
    },
    primary: {
      main: palette.electric,
    },
    secondary: {
      main: palette.cyan,
    },
    success: {
      main: palette.normal,
    },
    warning: {
      main: palette.warning,
    },
    error: {
      main: palette.critical,
    },
    text: {
      primary: palette.text,
      secondary: palette.textMuted,
    },
  },
  typography: {
    fontFamily:
      '"Inter", "Roboto Condensed", "Segoe UI", Roboto, Arial, sans-serif',
    h1: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: '1rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    body2: {
      letterSpacing: 0,
    },
    caption: {
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${palette.electric} ${palette.background}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(2, 10, 20, 0.62)',
          '& fieldset': {
            borderColor: 'rgba(110, 204, 255, 0.24)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(110, 204, 255, 0.42)',
          },
          '&.Mui-focused fieldset': {
            borderColor: palette.cyan,
            boxShadow: '0 0 16px rgba(49, 215, 255, 0.16)',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: palette.electric,
          height: 4,
        },
        thumb: {
          width: 14,
          height: 14,
          boxShadow: '0 0 12px rgba(49, 215, 255, 0.9)',
        },
        rail: {
          opacity: 0.32,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: palette.cyan,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#03101d',
          border: `1px solid ${palette.border}`,
          color: palette.text,
        },
      },
    },
  },
});
