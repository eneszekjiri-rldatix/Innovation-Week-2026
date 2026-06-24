import { Box, Typography } from '@mui/material';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        borderRadius: '8px',
        bgcolor: '#f5f7fa',
        border: '1px solid #c1cacb',
        px: 1,
        py: '9px',
        minHeight: 40,
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', flex: 1, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ color: '#151d1e', fontSize: 16, lineHeight: 1.4, fontWeight: 600 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            noWrap
            sx={{ color: 'rgba(0,0,0,0.62)', fontSize: 14, lineHeight: 1.3 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
