import { useParams, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { TimetableGrid } from '../../components/data-display/TimetableGrid';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useTeacherTimetable } from '../../hooks/useTimetable';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../router/routes';

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Requirements: 10.8, 10.9 */
export default function TeacherTimetablePage() {
  const { id } = useParams<{ id: string }>();
  const { user, status } = useAuth();

  // While auth is initializing, show a spinner
  if (status === 'initializing') {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Teachers default to their own timetable; admins can view any teacher
  const resolvedId = id && id !== 'me' ? Number(id) : user?.userId ?? 0;

  if (!resolvedId || isNaN(resolvedId)) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return <TeacherTimetableContent id={id} resolvedId={resolvedId} />;
}

function TeacherTimetableContent({ id, resolvedId }: { id?: string; resolvedId: number }) {
  const { data: entries, isLoading, isError } = useTeacherTimetable(resolvedId);

  const subtitleText = id && id !== 'me' ? `Teacher ID: ${id}` : 'My Timetable';

  return (
    <Box>
      <PageHeader title="Teacher Timetable" />
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, mt: -2 }}>
        {subtitleText}
      </Typography>

      {isLoading && <SkeletonLoader variant="table-row" count={8} />}

      {isError && (
        <Typography color="error">Failed to load timetable.</Typography>
      )}

      {!isLoading && !isError && (!entries || entries.length === 0) && (
        <EmptyState
          message="No classes have been scheduled for this teacher yet."
        />
      )}

      {!isLoading && !isError && entries && entries.length > 0 && (
        <TimetableGrid entries={entries} periods={PERIODS} onCellClick={() => {}} />
      )}
    </Box>
  );
}
