import { useState } from 'react';
import { Box, Button, TextField, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/data-display/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { PermissionGate } from '../../components/guards/PermissionGate';
import { useExamList } from '../../hooks/useExams';
import { formatDate } from '../../services/prettyPrinter';
import { buildPath, ROUTES } from '../../router/routes';
import type { Exam } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const COLUMNS: ColumnDef<Exam>[] = [
  { key: 'name', header: 'Name' },
  { key: 'examType', header: 'Type', render: (e) => e.examType.replace('_', ' ') },
  { key: 'className', header: 'Class' },
  { key: 'subject', header: 'Subject' },
  { key: 'maxMarks', header: 'Max Marks' },
  { key: 'passingMarks', header: 'Passing Marks' },
  { key: 'examDate', header: 'Date', render: (e) => e.examDate instanceof Date ? formatDate(e.examDate) : String(e.examDate) },
];

/** Requirements: 9.1, 9.13 */
export default function ExamsPage() {
  const navigate = useNavigate();
  const [classId, setClassId] = useState('');
  const [examType, setExamType] = useState('');

  const { data, isLoading } = useExamList({
    classId: classId ? Number(classId) : undefined,
    examType: examType || undefined,
  });

  const actions = (
    <PermissionGate allowedRoles={['admin']}>
      <Button variant="contained" onClick={() => navigate(ROUTES.EXAM_NEW)}>Create Exam</Button>
    </PermissionGate>
  );

  return (
    <Box>
      <PageHeader title="Exams" actions={actions} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} size="small" type="number" sx={{ width: 120 }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Exam Type</InputLabel>
          <Select value={examType} label="Exam Type" onChange={(e) => setExamType(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="unit_test">Unit Test</MenuItem>
            <MenuItem value="mid_term">Mid Term</MenuItem>
            <MenuItem value="final">Final</MenuItem>
            <MenuItem value="practical">Practical</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <DataTable
        columns={COLUMNS}
        data={data?.items ?? []}
        loading={isLoading}
        getRowKey={(e) => e.id}
        onRowClick={(e) => navigate(buildPath(ROUTES.EXAM_MARKS, { id: e.id }))}
      />
    </Box>
  );
}
