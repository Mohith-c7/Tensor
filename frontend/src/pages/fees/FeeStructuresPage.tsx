import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/data-display/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { PermissionGate } from '../../components/guards/PermissionGate';
import { useFeeStructures } from '../../hooks/useFees';
import { formatCurrency } from '../../services/prettyPrinter';
import { ROUTES } from '../../router/routes';
import type { FeeStructure } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const COLUMNS: ColumnDef<FeeStructure>[] = [
  { key: 'className', header: 'Class' },
  { key: 'academicYear', header: 'Academic Year' },
  { key: 'tuitionFee', header: 'Tuition', render: (s) => formatCurrency(s.tuitionFee) },
  { key: 'transportFee', header: 'Transport', render: (s) => formatCurrency(s.transportFee) },
  { key: 'activityFee', header: 'Activity', render: (s) => formatCurrency(s.activityFee) },
  { key: 'otherFee', header: 'Other', render: (s) => formatCurrency(s.otherFee) },
  { key: 'totalFee', header: 'Total', render: (s) => formatCurrency(s.totalFee) },
];

/** Requirements: 8.1 */
export default function FeeStructuresPage() {
  const navigate = useNavigate();
  const { data: structures, isLoading } = useFeeStructures();

  const actions = (
    <PermissionGate allowedRoles={['admin']}>
      <Button variant="contained" onClick={() => navigate(ROUTES.FEES_STRUCTURE_NEW)}>
        Add Fee Structure
      </Button>
    </PermissionGate>
  );

  return (
    <Box>
      <PageHeader title="Fee Structures" actions={actions} />
      <DataTable
        columns={COLUMNS}
        data={structures ?? []}
        loading={isLoading}
        getRowKey={(s) => s.id}
      />
    </Box>
  );
}
