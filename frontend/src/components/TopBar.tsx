import { AppBar, Toolbar, Typography, Avatar, Box } from '@mui/material';

export function TopBar() {
  return (
    <AppBar
      position="fixed"
      sx={{ height: 44, bgcolor: '#14716d', zIndex: (theme) => theme.zIndex.appBar }}
    >
      <Toolbar
        sx={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        <Typography sx={{ color: '#fff', fontSize: 16, letterSpacing: '0.15px' }}>
          Audits and standards
        </Typography>
        <Box aria-label="User: AS">
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: '#d3e4d6',
              border: '1px solid #185956',
              color: '#0f4146',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            AS
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
