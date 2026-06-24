import { Box, Typography, List, ListItem } from '@mui/material';
import { PageCard, OverflowTooltip } from '@rld-engineering/base-camp-react';
import type { Alert } from '../types/alerts';

interface AlertCardProps {
  alert: Alert;
  isSelected: boolean;
  onClick: () => void;
}

export function AlertCard({ alert, isSelected, onClick }: AlertCardProps) {
  return (
    <PageCard
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: '8px',
        px: '13px',
        py: '11px',
        border: '1px solid',
        transition: 'background-color 0.15s, border-color 0.15s',
        bgcolor: isSelected ? '#e4f3ff' : '#fff',
        borderColor: isSelected ? '#1f4cb3' : '#cccccc',
        '&:hover': isSelected
          ? {}
          : { borderColor: '#aaaaaa', bgcolor: '#f8fbff' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', mb: '5px' }}>
        <OverflowTooltip
          text={alert.auditType}
          width="100%"
          typographyProps={{
            sx: { flex: 1, minWidth: 0, fontSize: 16, color: '#000', letterSpacing: '0.15px', fontWeight: 500 },
          }}
        />
        <Typography sx={{ flexShrink: 0, fontSize: 12, color: 'rgba(0,0,0,0.87)', letterSpacing: '0.4px' }}>
          {alert.date}
        </Typography>
      </Box>

      <Typography sx={{ fontSize: 14, color: '#000', letterSpacing: '0.17px', lineHeight: 1.43, mb: '4px' }}>
        {alert.unit}
      </Typography>

      {alert.events.length === 0 ? (
        <Typography sx={{ fontSize: 14, color: '#0f7a5c', letterSpacing: '0.17px', lineHeight: 1.43 }}>
          No issues found
        </Typography>
      ) : alert.events.length === 1 ? (
        <Typography sx={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', letterSpacing: '0.17px', lineHeight: 1.43 }}>
          {alert.events[0]}
        </Typography>
      ) : (
        <List sx={{ listStyleType: 'disc', pl: '21px', py: 0 }}>
          {alert.events.map((event) => (
            <ListItem
              key={event}
              sx={{
                display: 'list-item',
                p: 0,
                fontSize: 14,
                color: 'rgba(0,0,0,0.6)',
                letterSpacing: '0.17px',
                lineHeight: 1.43,
              }}
            >
              {event}
            </ListItem>
          ))}
        </List>
      )}
    </PageCard>
  );
}
