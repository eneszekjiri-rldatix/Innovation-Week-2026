import { AppBar, Toolbar, Typography, Avatar, Box, IconButton } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useNavigate } from '@tanstack/react-router';

export function TopBar() {
  const navigate = useNavigate();

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            aria-label="Alerts"
            onClick={() => navigate({ to: '/alerts' })}
            sx={{ color: '#fff', p: 0.5 }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 22 }} />
          </IconButton>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
}
