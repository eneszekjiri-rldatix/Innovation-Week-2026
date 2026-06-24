import { createTheme } from "@mui/material/styles";
import { themeOptions } from "@rld-engineering/base-camp-react";

export const muiTheme = createTheme(themeOptions, {
  palette: {
    primary: {
      main: '#0F4146',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#14716D',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Geist', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '0 !important',
          padding: '0 !important',
        },
      },
    },
  },
});
