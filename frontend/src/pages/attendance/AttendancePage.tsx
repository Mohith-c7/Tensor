import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { AttendanceGrid } from '../../components/data-display/AttendanceGrid';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { useClassAttendance, useMarkAttendance } from '../../hooks/useAttendance';
import { useToast } from '../../hooks/useToast';
import type { AttendanceStatus } from '../../types/api';
import { toApiDate } from '../../services/prettyPrinter';

interface AttendanceRow {
  studentId: number;
  studentName: string;
  admissionNo: string;
  status: AttendanceStatus;
}

const todayStr = () => new Date().toISOString().split('T')[0];

/**
 * Class attendance marking page.
 * Requirements: 7.1, 7.2, 7.5, 7.6, 7.10, 7.11, 7.12
 */
export default function AttendancePage() {
  const { showToast } = useToast();
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  const isToday = date === todayStr();
  const isFuture = date > todayStr();

  const { data: existing, isLoading, isError, refetch } = useClassAttendance(
    Number(classId) || 0,
    Number(sectionId) || 0,
    date
  );

  const markAttendance = useMarkAttendance();

  // Pre-populate rows from existing records
  useEffect(() => {
    if (existing && existing.length > 0) {
      setRows(
        existing.map((r) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          admissionNo: r.admissionNo,
          status: r.status,
        }))
      );
    }
  }, [existing]);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => r.studentId === studentId ? { ...r, status } : r));
  };

  const handleMarkAllPresent = () => {
    setRows((prev) => prev.map((r) => ({ ...r, status: 'present' as AttendanceStatus })));
  };

  const handleSubmit = async () => {
    if (rows.length === 0) return;
    try {
      await markAttendance.mutateAsync({
        records: rows.map((r) => ({
          studentId: r.studentId,
          date: toApiDate(new Date(date)),
          status: r.status,
        })),
      });
      showToast({ variant: 'success', message: `Attendance saved for ${rows.length} students` });
    } catch {
      showToast({ variant: 'error', message: 'Failed to save attendance. Please retry.' });
    }
  };

  const selectionComplete = classId && sectionId && date;

  return (
    <Box>
      <PageHeader title="Mark Attendance" />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Class ID"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          size="small"
          type="number"
          sx={{ width: 120 }}
        />
        <TextField
          label="Section ID"
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          size="small"
          type="number"
          sx={{ width: 120 }}
        />
        <TextField
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          size="small"
          type="date"
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
        />
        {isToday && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="primary" fontWeight="bold">Today</Typography>
          </Box>
        )}
      </Stack>

      {isFuture && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Attendance cannot be marked for future dates.
        </Alert>
      )}

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
        >
          Failed to load attendance records.
        </Alert>
      )}

      {isLoading && selectionComplete && <SkeletonLoader variant="table-row" count={5} />}

      {!isLoading && !isFuture && rows.length > 0 && (
        <>
          <AttendanceGrid
            rows={rows}
            onChange={handleStatusChange}
            onMarkAllPresent={handleMarkAllPresent}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={markAttendance.isPending || isFuture}
            >
              {markAttendance.isPending ? <CircularProgress size={20} /> : 'Save Attendance'}
            </Button>
          </Box>
        </>
      )}

      {!isLoading && selectionComplete && !isFuture && rows.length === 0 && (
        <Typography color="text.secondary">
          No students found for this class/section. Select a valid class and section.
        </Typography>
      )}
    </Box>
  );
}
