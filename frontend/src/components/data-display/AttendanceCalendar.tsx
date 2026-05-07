import { useState, useCallback, useMemo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import type { AttendanceRecord, AttendanceStatus } from '../../types/api';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  month: Date;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { color: string; label: string; icon: React.ReactElement }
> = {
  present: { color: '#4caf50', label: 'Present', icon: <CheckCircleIcon fontSize="small" /> },
  absent: { color: '#f44336', label: 'Absent', icon: <CancelIcon fontSize="small" /> },
  late: { color: '#ff9800', label: 'Late', icon: <AccessTimeIcon fontSize="small" /> },
  excused: { color: '#9e9e9e', label: 'Excused', icon: <EventBusyIcon fontSize="small" /> },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Monthly attendance calendar with color + icon coding.
 * Keyboard navigable with arrow keys.
 * Requirements: 7.7, 7.13, 14.9, 14.12
 */
export function AttendanceCalendar({ records, month }: AttendanceCalendarProps) {
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const r of records) {
      map.set(format(r.date, 'yyyy-MM-dd'), r.status);
    }
    return map;
  }, [records]);

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  const firstDayOffset = getDay(startOfMonth(month));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, date: Date) => {
      const idx = days.findIndex((d) => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      if (e.key === 'ArrowRight' && idx < days.length - 1) setFocusedDate(days[idx + 1]);
      if (e.key === 'ArrowLeft' && idx > 0) setFocusedDate(days[idx - 1]);
      if (e.key === 'ArrowDown' && idx + 7 < days.length) setFocusedDate(days[idx + 7]);
      if (e.key === 'ArrowUp' && idx - 7 >= 0) setFocusedDate(days[idx - 7]);
    },
    [days]
  );

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
        {format(month, 'MMMM yyyy')}
      </Typography>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
            <Typography variant="caption">{cfg.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Day headers */}
      <Grid container columns={7} sx={{ mb: 1 }}>
        {DAY_LABELS.map((d) => (
          <Grid key={d} size={1}>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {d}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Grid container columns={7}>
        {/* Offset for first day */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <Grid key={`offset-${i}`} size={1} />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const status = recordMap.get(key);
          const cfg = status ? STATUS_CONFIG[status] : null;
          const isFocused =
            focusedDate && format(focusedDate, 'yyyy-MM-dd') === key;

          return (
            <Grid key={key} size={1}>
              <Tooltip title={cfg ? `${format(day, 'd')}: ${cfg.label}` : format(day, 'd')}>
                <Box
                  tabIndex={0}
                  role="gridcell"
                  aria-label={`${format(day, 'MMMM d')}${cfg ? `: ${cfg.label}` : ''}`}
                  onKeyDown={(e) => handleKeyDown(e, day)}
                  onFocus={() => setFocusedDate(day)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 0.5,
                    borderRadius: 1,
                    border: isFocused ? '2px solid' : '2px solid transparent',
                    borderColor: isFocused ? 'primary.main' : 'transparent',
                    cursor: 'default',
                    '&:focus': { outline: 'none' },
                  }}
                >
                  <Typography variant="caption">{format(day, 'd')}</Typography>
                  {cfg && (
                    <Box sx={{ color: cfg.color, lineHeight: 1 }}>{cfg.icon}</Box>
                  )}
                </Box>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
