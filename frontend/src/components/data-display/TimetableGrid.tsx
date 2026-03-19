import React, { useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import type { TimetableEntry, DayOfWeek } from '../../types/api';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};

interface TimetableGridProps {
  entries: TimetableEntry[];
  periods: number[];
  onCellClick: (day: DayOfWeek, period: number, existing?: TimetableEntry) => void;
}

/**
 * Weekly timetable grid with keyboard navigation.
 * Requirements: 10.1, 10.10, 14.12
 */
export function TimetableGrid({ entries, periods, onCellClick }: TimetableGridProps) {
  const today = format(new Date(), 'EEEE').toLowerCase() as DayOfWeek;

  const entryMap = React.useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    for (const e of entries) {
      map.set(`${e.dayOfWeek}-${e.periodNumber}`, e);
    }
    return map;
  }, [entries]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, day: DayOfWeek, period: number) => {
      const dayIdx = DAYS.indexOf(day);
      const periodIdx = periods.indexOf(period);

      const move = (newDayIdx: number, newPeriodIdx: number) => {
        if (
          newDayIdx >= 0 &&
          newDayIdx < DAYS.length &&
          newPeriodIdx >= 0 &&
          newPeriodIdx < periods.length
        ) {
          const selector = `[data-cell="${DAYS[newDayIdx]}-${periods[newPeriodIdx]}"]`;
          (document.querySelector(selector) as HTMLElement)?.focus();
        }
      };

      if (e.key === 'ArrowRight') move(dayIdx + 1, periodIdx);
      if (e.key === 'ArrowLeft') move(dayIdx - 1, periodIdx);
      if (e.key === 'ArrowDown') move(dayIdx, periodIdx + 1);
      if (e.key === 'ArrowUp') move(dayIdx, periodIdx - 1);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCellClick(day, period, entryMap.get(`${day}-${period}`));
      }
    },
    [periods, entryMap, onCellClick]
  );

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }}>Period</TableCell>
            {DAYS.map((day) => (
              <TableCell
                key={day}
                align="center"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: day === today ? 'primary.50' : 'inherit',
                  color: day === today ? 'primary.main' : 'inherit',
                  minWidth: 120,
                }}
              >
                {DAY_LABELS[day]}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {periods.map((period) => (
            <TableRow key={period}>
              <TableCell sx={{ fontWeight: 'medium' }}>{period}</TableCell>
              {DAYS.map((day) => {
                const entry = entryMap.get(`${day}-${period}`);
                return (
                  <TableCell
                    key={day}
                    align="center"
                    tabIndex={0}
                    role="button"
                    data-cell={`${day}-${period}`}
                    aria-label={
                      entry
                        ? `${DAY_LABELS[day]} period ${period}: ${entry.subject}`
                        : `${DAY_LABELS[day]} period ${period}: empty`
                    }
                    onClick={() => onCellClick(day, period, entry)}
                    onKeyDown={(e) => handleKeyDown(e, day, period)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: day === today ? 'primary.50' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:focus': { outline: '2px solid', outlineColor: 'primary.main' },
                      borderRadius: 1,
                    }}
                  >
                    {entry ? (
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {entry.subject}
                        </Typography>
                        {entry.teacherName && (
                          <Typography variant="caption" color="text.secondary">
                            {entry.teacherName}
                          </Typography>
                        )}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {entry.startTime}–{entry.endTime}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
