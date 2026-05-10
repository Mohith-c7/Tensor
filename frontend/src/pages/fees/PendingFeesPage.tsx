import { Box, Button, Typography, Alert, Chip } from '@mui/material';
import { DataTable } from '../../components/data-display/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { usePendingFees } from '../../hooks/useFees';
import { exportToCsv } from '../../utils/csvExport';
import { formatCurrency } from '../../services/prettyPrinter';
import type { PendingFeesReport } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const COLUMNS: ColumnDef<PendingFeesReport['pendingFees'][0]>[] = [
  { key: 'studentName', header: 'Student Name' },
  { key: 'admissionNo', header: 'Admission No' },
  { key: 'className', header: 'Class' },
  { key: 'totalFee', header: 'Total Fee', render: (s) => formatCurrency(s.totalFee) },
  { key: 'totalPaid', header: 'Paid', render: (s) => formatCurrency(s.totalPaid) },
  { key: 'balance', header: 'Outstanding', render: (s) => formatCurrency(s.balance), sortable: true },
];

/** Requirements: 8.8, 8.10 */
export default function PendingFeesPage() {
  const { data: report, isLoading } = usePendingFees(new Date().getFullYear().toString());

  const handleExport = () => {
    if (!report?.pendingFees) return;
    exportToCsv(
      'pending-fees.csv',
      report.pendingFees.map((s) => ({
        studentName: s.studentName,
        admissionNo: s.admissionNo,
        className: s.className,
        totalFee: s.totalFee,
        totalPaid: s.totalPaid,
        balance: s.balance,
      })),
      [
        { key: 'studentName', label: 'Student Name' },
        { key: 'admissionNo', label: 'Admission No' },
        { key: 'className', label: 'Class' },
        { key: 'totalFee', label: 'Total Fee' },
        { key: 'totalPaid', label: 'Total Paid' },
        { key: 'balance', label: 'Outstanding' }
      ]
    );
  };

  const actions = (
    <Button variant="outlined" onClick={handleExport} disabled={!report?.pendingFees?.length}>
      Export CSV
    </Button>
  );

  return (
    <Box>
      <PageHeader title="Pending Fees" actions={actions} />

      {report && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{report.totalPendingStudents}</strong> students have pending fees totaling{' '}
              <strong>{formatCurrency(report.totalPendingAmount)}</strong> for {report.academicYear}
            </Typography>
          </Alert>

          {report.totalPendingStudents > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                label={`Pending Students: ${report.totalPendingStudents}`}
                color="warning"
                variant="outlined"
              />
              <Chip
                label={`Total Amount: ${formatCurrency(report.totalPendingAmount)}`}
                color="error"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      )}

      <DataTable
        columns={COLUMNS}
        data={report?.pendingFees ?? []}
        loading={isLoading}
        getRowKey={(row) => row.studentId}
      />
    </Box>
  );
}
