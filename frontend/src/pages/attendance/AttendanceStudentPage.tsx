import { useState } from 'react';
import { Box, Grid, Typography, TextField, Stack, Paper } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { AttendanceCalendar } from '../../components/data-display/AttendanceCalendar';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { useStudentAttendance } from '../../hooks/useAttendance';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import { calculatePercentage } from '../../utils/attendanceCalculator';
import { ROUTES } from '../../router/routes';

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight="bold">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

/**
 * Student attendance calendar and statistics page.
 * Requirements: 7.7, 7.8, 7.9
 */
export default function AttendanceStudentPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const id = validatePositiveInt(idParam);

  const today = new Date();
  const [month] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data: records, isLoading } = useStudentAttendance(id ?? 0, startDate, endDate);

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  const present = records?.filter((r) => r.status === 'present').length ?? 0;
  const absent = records?.filter((r) => r.status === 'absent').length ?? 0;
  const late = records?.filter((r) => r.status === 'late').length ?? 0;
  const excused = records?.filter((r) => r.status === 'excused').length ?? 0;
  const total = records?.length ?? 0;
  const percentage = records ? calculatePercentage(records) : 0;

  return (
    <Box>
      <PageHeader title="Student Attendance" />

      {/* Date range filter */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="From"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {isLoading ? (
        <SkeletonLoader variant="chart" />
      ) : (
        <>
          {/* Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}><StatBox label="Total Days" value={total} /></Grid>
            <Grid item xs={6} sm={4} md={2}><StatBox label="Present" value={present} /></Grid>
            <Grid item xs={6} sm={4} md={2}><StatBox label="Absent" value={absent} /></Grid>
            <Grid item xs={6} sm={4} md={2}><StatBox label="Late" value={late} /></Grid>
            <Grid item xs={6} sm={4} md={2}><StatBox label="Excused" value={excused} /></Grid>
            <Grid item xs={6} sm={4} md={2}><StatBox label="Percentage" value={`${percentage.toFixed(1)}%`} /></Grid>
          </Grid>

          {/* Calendar */}
          <AttendanceCalendar records={records ?? []} month={month} />
        </>
      )}
    </Box>
  );
}
