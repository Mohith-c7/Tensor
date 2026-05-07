import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/data-display/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { PermissionGate } from '../../components/guards/PermissionGate';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../config/queryClient';
import { apiClient } from '../../services/apiClient';
import { formatCurrency, formatDate } from '../../services/prettyPrinter';
import { ROUTES } from '../../router/routes';
import type { FeePayment } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const COLUMNS: ColumnDef<FeePayment>[] = [
  { key: 'studentId', header: 'Student ID' },
  { key: 'academicYear', header: 'Academic Year' },
  { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount) },
  { key: 'paymentDate', header: 'Date', render: (p) => p.paymentDate instanceof Date ? formatDate(p.paymentDate) : String(p.paymentDate) },
  { key: 'paymentMethod', header: 'Method', render: (p) => p.paymentMethod.replace('_', ' ') },
];

/** Requirements: 8.5 */
export default function PaymentsPage() {
  const navigate = useNavigate();
  const { data: payments, isLoading } = useQuery({
    queryKey: queryKeys.fees.payments(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<FeePayment[]>('/fees/payments', { signal });
      return res.data;
    },
  });

  const actions = (
    <PermissionGate allowedRoles={['admin']}>
      <Button variant="contained" onClick={() => navigate(ROUTES.FEES_PAYMENT_NEW)}>
        Record Payment
      </Button>
    </PermissionGate>
  );

  return (
    <Box>
      <PageHeader title="Fee Payments" actions={actions} />
      <DataTable
        columns={COLUMNS}
        data={payments ?? []}
        loading={isLoading}
        getRowKey={(p) => p.id}
      />
    </Box>
  );
}
