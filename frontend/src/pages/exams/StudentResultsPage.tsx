import { Box, Chip } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/data-display/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { useStudentResults } from '../../hooks/useExams';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import { ROUTES } from '../../router/routes';
import type { Mark } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const COLUMNS: ColumnDef<Mark>[] = [
  { key: 'examId', header: 'Exam ID' },
  { key: 'studentName', header: 'Student' },
  { key: 'marksObtained', header: 'Marks' },
  {
    key: 'grade',
    header: 'Grade',
    render: (m) => m.isAbsent ? <Chip label="Absent" size="small" /> : <Chip label={m.grade} size="small" color="primary" variant="outlined" />,
  },
  {
    key: 'isPassed',
    header: 'Result',
    render: (m) => m.isAbsent ? null : (
      <Chip label={m.isPassed ? 'Pass' : 'Fail'} size="small" color={m.isPassed ? 'success' : 'error'} />
    ),
  },
  { key: 'remarks', header: 'Remarks', render: (m) => m.remarks ?? '—' },
];

/** Requirements: 9.10, 9.11 */
export default function StudentResultsPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = validatePositiveInt(idParam);

  const { data: results, isLoading } = useStudentResults(id ?? 0);

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  if (isLoading) return <SkeletonLoader variant="table-row" count={5} />;

  return (
    <Box>
      <PageHeader title={`Exam Results — Student #${id}`} />
      <DataTable
        columns={COLUMNS}
        data={results ?? []}
        getRowKey={(m) => m.id}
      />
    </Box>
  );
}
