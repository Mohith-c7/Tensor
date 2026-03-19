import React from 'react';
import { Box, Button } from '@mui/material';
import { DataTable } from '../../components/data-display/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { usePendingFees } from '../../hooks/useFees';
import { exportToCsv } from '../../utils/csvExport';
import { formatCurrency } from '../../services/prettyPrinter';
import type { StudentFeeStatus } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const COLUMNS: ColumnDef<StudentFeeStatus>[] = [
  { key: 'totalFee', header: 'Total Fee', render: (s) => formatCurrency(s.totalFee), sortable: true },
  { key: 'totalPaid', header: 'Paid', render: (s) => formatCurrency(s.totalPaid) },
  { key: 'outstandingBalance', header: 'Outstanding', render: (s) => formatCurrency(s.outstandingBalance), sortable: true },
];

/** Requirements: 8.8, 8.10 */
export default function PendingFeesPage() {
  const { data: pending, isLoading } = usePendingFees();

  const handleExport = () => {
    exportToCsv(
      'pending-fees.csv',
      (pending ?? []).map((s) => ({
        totalFee: s.totalFee,
        totalPaid: s.totalPaid,
        outstanding: s.outstandingBalance,
      })),
      ['totalFee', 'totalPaid', 'outstanding']
    );
  };

  const actions = (
    <Button variant="outlined" onClick={handleExport} disabled={!pending?.length}>
      Export CSV
    </Button>
  );

  return (
    <Box>
      <PageHeader title="Pending Fees" actions={actions} />
      <DataTable
        columns={COLUMNS}
        data={pending ?? []}
        loading={isLoading}
        getRowKey={(_, i) => i}
      />
    </Box>
  );
}
