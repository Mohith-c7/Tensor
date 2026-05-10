import { useState } from 'react';
import {
  Box, Typography, Alert, Button, Chip, Divider, Grid,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { DataTable } from '../../components/data-display/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { useStudentFeeStatus } from '../../hooks/useFees';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import { formatCurrency, formatDate } from '../../services/prettyPrinter';
import { ROUTES } from '../../router/routes';
import type { FeePayment } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const PAYMENT_COLUMNS: ColumnDef<FeePayment>[] = [
  { key: 'paymentDate', header: 'Date', render: (p) => p.paymentDate instanceof Date ? formatDate(p.paymentDate) : String(p.paymentDate) },
  { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount) },
  { key: 'paymentMethod', header: 'Method', render: (p) => p.paymentMethod.replace('_', ' ') },
  { key: 'transactionId', header: 'Transaction ID', render: (p) => p.transactionId ?? '—' },
];

const currentYear = new Date().getFullYear().toString();

/** Requirements: 8.7, 8.9, 8.11 */
export default function StudentFeePage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = validatePositiveInt(idParam);
  const [year] = useState(currentYear);

  const { data: feeStatus, isLoading } = useStudentFeeStatus(id ?? 0, year);

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  if (isLoading) return <SkeletonLoader variant="table-row" count={6} />;

  const paymentColor = feeStatus?.status.paymentStatus === 'paid' ? 'success' :
                      feeStatus?.status.paymentStatus === 'overdue' ? 'error' : 'warning';

  const paymentLabel = feeStatus?.status.paymentStatus === 'paid' ? 'Fully Paid' :
                      feeStatus?.status.paymentStatus === 'overdue' ? 'Overdue' : 'Pending';

  return (
    <Box>
      <PageHeader title={`Fee Status — ${feeStatus?.student.name ?? `Student #${id}`}`} />

      {!feeStatus?.feeStructure && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => navigate(ROUTES.FEES_STRUCTURE_NEW)}>
              Create Structure
            </Button>
          }
        >
          No fee structure found for this student's class and academic year.
        </Alert>
      )}

      {feeStatus?.status.isOverdue && (
        <Alert severity="error" sx={{ mb: 2 }}>
          This student's fees are overdue. Outstanding amount: {formatCurrency(feeStatus.status.overdueAmount)}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Total Fee</Typography>
            <Typography variant="h6">{formatCurrency(feeStatus?.feeStructure.totalFee ?? 0)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Total Paid</Typography>
            <Typography variant="h6">{formatCurrency(feeStatus?.payments.totalPaid ?? 0)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Current Balance</Typography>
            <Typography variant="h6" color={`${paymentColor}.main`}>
              {formatCurrency(feeStatus?.status.currentBalance ?? 0)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Next Installment</Typography>
            <Typography variant="h6">{formatCurrency(feeStatus?.status.nextInstallmentDue ?? 0)}</Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Chip label={paymentLabel} color={paymentColor} size="small" />
        {feeStatus?.payments.lastPayment && (
          <Typography variant="caption" sx={{ ml: 2 }}>
            Last payment: {formatDate(feeStatus.payments.lastPayment.paymentDate)} ({formatCurrency(feeStatus.payments.lastPayment.amount)})
          </Typography>
        )}
      </Box>

      <Typography variant="subtitle2" gutterBottom>Payment History ({feeStatus?.payments.count ?? 0} payments)</Typography>
      <Divider sx={{ mb: 2 }} />
      <DataTable
        columns={PAYMENT_COLUMNS}
        data={feeStatus?.payments.history ?? []}
        getRowKey={(p) => p.id}
        emptyMessage="No payments recorded yet"
      />
    </Box>
  );
}
