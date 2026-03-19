import React, { lazy, Suspense } from 'react';
import { Box, Grid, Typography, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PaymentsIcon from '@mui/icons-material/Payments';
import QuizIcon from '@mui/icons-material/Quiz';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { KPICard } from '../../components/data-display/KPICard';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { ErrorFallback } from '../../components/feedback/ErrorFallback';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import {
  useDashboardKPIs,
  useAttendanceTrend,
  useFeeCollection,
  useRecentActivity,
} from '../../hooks/useDashboard';
import { ROUTES } from '../../router/routes';
import { formatDate } from '../../services/prettyPrinter';

const AttendanceTrendChart = lazy(() =>
  import('../../components/data-display/charts/AttendanceTrendChart')
);
const FeeCollectionChart = lazy(() =>
  import('../../components/data-display/charts/FeeCollectionChart')
);

/**
 * Dashboard page with role-specific KPIs, charts, and quick actions.
 * Requirements: 5.1–5.10, 12.4
 */
export default function DashboardPage() {
  const { isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis, isError: kpisError } = useDashboardKPIs();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  return (
    <Box>
      <PageHeader title="Dashboard" />

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {isAdmin && (
          <>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <KPICard
                  title="Total Students"
                  value={kpisLoading ? '—' : (kpis?.totalStudents ?? 0)}
                  icon={<PeopleIcon />}
                  loading={kpisLoading}
                  onClick={() => navigate(ROUTES.STUDENTS)}
                />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <KPICard
                  title="Total Teachers"
                  value={kpisLoading ? '—' : (kpis?.totalTeachers ?? 0)}
                  icon={<SchoolIcon />}
                  loading={kpisLoading}
                />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <KPICard
                  title="Attendance Today"
                  value={kpisLoading ? '—' : `${kpis?.attendanceRateToday ?? 0}%`}
                  icon={<EventNoteIcon />}
                  loading={kpisLoading}
                  onClick={() => navigate(ROUTES.ATTENDANCE)}
                />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <KPICard
                  title="Pending Fees"
                  value={kpisLoading ? '—' : (kpis?.pendingFeesCount ?? 0)}
                  icon={<PaymentsIcon />}
                  loading={kpisLoading}
                  onClick={() => navigate(ROUTES.FEES_PENDING)}
                />
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <KPICard
                  title="Upcoming Exams"
                  value={kpisLoading ? '—' : (kpis?.upcomingExamsCount ?? 0)}
                  icon={<QuizIcon />}
                  loading={kpisLoading}
                  onClick={() => navigate(ROUTES.EXAMS)}
                />
              </ErrorBoundary>
            </Grid>
          </>
        )}

        {isTeacher && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Classes Assigned" value={kpis?.classesAssigned ?? 0} icon={<ClassIcon />} loading={kpisLoading} onClick={() => navigate(ROUTES.TIMETABLE)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Attendance Marked Today" value={kpis?.attendanceMarkedToday ? 'Yes' : 'No'} icon={<CheckCircleIcon />} loading={kpisLoading} onClick={() => navigate(ROUTES.ATTENDANCE)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Upcoming Exams" value={kpis?.upcomingExamsCount ?? 0} icon={<QuizIcon />} loading={kpisLoading} onClick={() => navigate(ROUTES.EXAMS)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard title="Recent Marks Entries" value={kpis?.recentMarksEntries ?? 0} icon={<EditIcon />} loading={kpisLoading} />
            </Grid>
          </>
        )}

        {kpisError && (
          <Grid item xs={12}>
            <Button variant="outlined" onClick={() => refetchKpis()}>Retry</Button>
          </Grid>
        )}
      </Grid>

      {/* Charts — Admin only */}
      {isAdmin && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<SkeletonLoader variant="chart" />}>
                <AttendanceTrendChartSection />
              </Suspense>
            </ErrorBoundary>
          </Grid>
          <Grid item xs={12} md={6}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<SkeletonLoader variant="chart" />}>
                <FeeCollectionChartSection />
              </Suspense>
            </ErrorBoundary>
          </Grid>
        </Grid>
      )}

      {/* Recent Activity — Admin only */}
      {isAdmin && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            {activityLoading ? (
              <SkeletonLoader variant="list-item" count={5} />
            ) : (
              <List dense>
                {(activity ?? []).map((event, i) => (
                  <React.Fragment key={event.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${event.action} ${event.entity} #${event.entityId}`}
                        secondary={`${event.performedBy} · ${formatDate(event.createdAt)}`}
                      />
                    </ListItem>
                    {i < (activity?.length ?? 0) - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </ErrorBoundary>
      )}

      {/* Quick Actions */}
      <Box>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => navigate(ROUTES.ATTENDANCE)}>Mark Attendance</Button>
          <Button variant="outlined" onClick={() => navigate(ROUTES.STUDENTS)}>View Students</Button>
          {isAdmin && (
            <>
              <Button variant="outlined" onClick={() => navigate(ROUTES.STUDENT_NEW)}>Add Student</Button>
              <Button variant="outlined" onClick={() => navigate(ROUTES.FEES_PAYMENT_NEW)}>Record Payment</Button>
              <Button variant="outlined" onClick={() => navigate(ROUTES.EXAM_NEW)}>Create Exam</Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function AttendanceTrendChartSection() {
  const { data, isLoading } = useAttendanceTrend();
  if (isLoading) return <SkeletonLoader variant="chart" />;
  return <AttendanceTrendChart data={data ?? []} />;
}

function FeeCollectionChartSection() {
  const { data, isLoading } = useFeeCollection();
  if (isLoading) return <SkeletonLoader variant="chart" />;
  return <FeeCollectionChart data={data ?? []} />;
}
