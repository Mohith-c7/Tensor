import { lazy, Suspense } from 'react';
import { Box, Grid, Typography, Paper } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { useExam, useExamResults } from '../../hooks/useExams';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import { ROUTES } from '../../router/routes';

const ResultsHistogram = lazy(() =>
  import('recharts').then((m) => ({
    default: function Histogram({ data }: { data: { range: string; count: number }[] }) {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = m;
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    },
  }))
);

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight="bold">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

/** Requirements: 9.9 */
export default function ExamResultsPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = validatePositiveInt(idParam);

  const { data: exam } = useExam(id ?? 0);
  const { data: results, isLoading } = useExamResults(id ?? 0);

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  if (isLoading) return <SkeletonLoader variant="chart" />;

  return (
    <Box>
      <PageHeader title={exam ? `Results — ${exam.name}` : 'Exam Results'} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}><StatCard label="Average" value={results?.average?.toFixed(1) ?? '—'} /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard label="Highest" value={results?.highest ?? '—'} /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard label="Lowest" value={results?.lowest ?? '—'} /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard label="Passed" value={results?.passCount ?? '—'} /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard label="Failed" value={results?.failCount ?? '—'} /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard label="Pass %" value={results?.passPercentage ? `${results.passPercentage.toFixed(1)}%` : '—'} /></Grid>
      </Grid>

      {results?.distribution && results.distribution.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>Marks Distribution</Typography>
          <Suspense fallback={<SkeletonLoader variant="chart" />}>
            <ResultsHistogram data={results.distribution} />
          </Suspense>
        </Box>
      )}
    </Box>
  );
}
