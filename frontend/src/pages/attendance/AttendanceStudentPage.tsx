import { useState } from 'react';
import { Box, Grid, Typography, TextField, Stack, Paper, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { AttendanceCalendar } from '../../components/data-display/AttendanceCalendar';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { useStudentAttendance, useStudentAttendanceStats } from '../../hooks/useAttendance';
import { validatePositiveInt } from '../../utils/routeParamValidator';
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

  const { data: records, isLoading: recordsLoading } = useStudentAttendance(id ?? 0, startDate, endDate);
  const { data: stats, isLoading: statsLoading } = useStudentAttendanceStats(id ?? 0, startDate, endDate, 75);

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  const isLoading = recordsLoading || statsLoading;

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
          {/* Alerts */}
          {stats?.alerts && stats.alerts.length > 0 && (
            <Stack spacing={1} sx={{ mb: 3 }}>
              {stats.alerts.map((alert, idx) => (
                <Alert key={idx} severity={alert.severity}>
                  {alert.message}
                </Alert>
              ))}
            </Stack>
          )}

          {/* Statistics */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4} md={2}><StatBox label="Total Scheduled" value={stats.attendance.totalScheduled} /></Grid>
              <Grid item xs={6} sm={4} md={2}><StatBox label="Present" value={stats.attendance.present} /></Grid>
              <Grid item xs={6} sm={4} md={2}><StatBox label="Absent" value={stats.attendance.absent} /></Grid>
              <Grid item xs={6} sm={4} md={2}><StatBox label="Late" value={stats.attendance.late} /></Grid>
              <Grid item xs={6} sm={4} md={2}><StatBox label="Excused" value={stats.attendance.excused} /></Grid>
              <Grid item xs={6} sm={4} md={2}><StatBox label="Percentage" value={`${stats.attendance.percentage.toFixed(1)}%`} /></Grid>
            </Grid>
          )}

          {/* Calendar */}
          <AttendanceCalendar records={records ?? []} month={month} />
        </>
      )}
    </Box>
  );
}
