import { useCallback } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';
import type { AttendanceStatus } from '../../types/api';

interface AttendanceRow {
  studentId: number;
  studentName: string;
  admissionNo: string;
  status: AttendanceStatus;
}

interface AttendanceGridProps {
  rows: AttendanceRow[];
  onChange: (studentId: number, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

/**
 * Grid for marking attendance for all students in a class.
 * Keyboard navigable between cells.
 * Requirements: 7.3, 7.4, 14.12
 */
export function AttendanceGrid({ rows, onChange, onMarkAllPresent }: AttendanceGridProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, rowIdx: number) => {
      const selects = document.querySelectorAll<HTMLElement>('[data-attendance-select]');
      if (e.key === 'ArrowDown' && rowIdx < selects.length - 1) {
        selects[rowIdx + 1].focus();
      }
      if (e.key === 'ArrowUp' && rowIdx > 0) {
        selects[rowIdx - 1].focus();
      }
    },
    []
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" size="small" onClick={onMarkAllPresent}>
          Mark All Present
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Admission No</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={row.studentId}>
                <TableCell>
                  <Typography variant="body2">{row.admissionNo}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.studentName}</Typography>
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={row.status}
                    onChange={(e) => onChange(row.studentId, e.target.value as AttendanceStatus)}
                    inputProps={{
                      'data-attendance-select': true,
                      'aria-label': `Attendance status for ${row.studentName}`,
                    }}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    sx={{ minWidth: 120 }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
