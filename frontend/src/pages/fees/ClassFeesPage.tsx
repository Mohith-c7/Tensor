import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useClasses } from '../../hooks/useClasses';
import { useClassFeesSummary } from '../../hooks/useFees';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { DataTable } from '../../components/data-display/DataTable';
import { formatCurrency } from '../../services/prettyPrinter';
import type { ColumnDef } from '../../types/domain';

interface StudentFeeDetail {
  studentId: number;
  admissionNo: string;
  fullName: string;
  totalFee: number;
  totalPaid: number;
  outstandingBalance: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
}

const STUDENT_COLUMNS: ColumnDef<StudentFeeDetail>[] = [
  { key: 'admissionNo', header: 'Admission No', sortable: true },
  { key: 'fullName', header: 'Student Name', sortable: true },
  { key: 'totalFee', header: 'Total Fee', render: (s) => formatCurrency(s.totalFee), sortable: true },
  { key: 'totalPaid', header: 'Paid', render: (s) => formatCurrency(s.totalPaid), sortable: true },
  { 
    key: 'outstandingBalance', 
    header: 'Outstanding', 
    render: (s) => (
      <Typography 
        color={s.outstandingBalance === 0 ? 'success.main' : s.outstandingBalance === s.totalFee ? 'error.main' : 'warning.main'}
        fontWeight="medium"
      >
        {formatCurrency(s.outstandingBalance)}
      </Typography>
    ),
    sortable: true 
  },
  {
    key: 'paymentStatus',
    header: 'Status',
    render: (s) => (
      <Chip
        label={s.paymentStatus === 'paid' ? 'Fully Paid' : s.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
        color={s.paymentStatus === 'paid' ? 'success' : s.paymentStatus === 'partial' ? 'warning' : 'error'}
        size="small"
      />
    ),
  },
];

const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

/**
 * Class-wise Fees Overview Page
 * Shows fee structure and payment status for each class
 * Requirements: 8.1, 8.7, 8.8, 8.9
 */
export default function ClassFeesPage() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [academicYear] = useState(currentYear);

  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: feesSummary, isLoading: feesLoading } = useClassFeesSummary(
    selectedClass ? Number(selectedClass) : null,
    academicYear
  );

  const isLoading = classesLoading || feesLoading;

  // Calculate overall statistics
  const totalStudents = feesSummary?.students?.length ?? 0;
  const totalFeeAmount = feesSummary?.students?.reduce((sum: number, s: StudentFeeDetail) => sum + s.totalFee, 0) ?? 0;
  const totalPaidAmount = feesSummary?.students?.reduce((sum: number, s: StudentFeeDetail) => sum + s.totalPaid, 0) ?? 0;
  const totalOutstanding = totalFeeAmount - totalPaidAmount;
  const collectionPercentage = totalFeeAmount > 0 ? (totalPaidAmount / totalFeeAmount) * 100 : 0;

  const fullyPaidCount = feesSummary?.students?.filter((s: StudentFeeDetail) => s.outstandingBalance === 0).length ?? 0;
  const partialPaidCount = feesSummary?.students?.filter((s: StudentFeeDetail) => s.outstandingBalance > 0 && s.totalPaid > 0).length ?? 0;
  const unpaidCount = feesSummary?.students?.filter((s: StudentFeeDetail) => s.totalPaid === 0).length ?? 0;

  return (
    <Box>
      <PageHeader title="Class-wise Fees Overview" />

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass}
            label="Select Class"
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <MenuItem value="">All Classes</MenuItem>
            {classes?.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Academic Year:
          </Typography>
          <Chip label={academicYear} size="small" />
        </Box>
      </Stack>

      {isLoading ? (
        <SkeletonLoader variant="kpi-card" count={4} />
      ) : !selectedClass ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Please select a class to view fee details
          </Typography>
        </Box>
      ) : !feesSummary?.feeStructure ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No fee structure found for this class
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please create a fee structure for {classes?.find(c => c.id === Number(selectedClass))?.name}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Fee Structure Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fee Structure - {classes?.find(c => c.id === Number(selectedClass))?.name}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Tuition Fee</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(feesSummary.feeStructure.tuitionFee)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Transport Fee</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(feesSummary.feeStructure.transportFee)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Activity Fee</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(feesSummary.feeStructure.activityFee)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Other Fee</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(feesSummary.feeStructure.otherFee)}
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Fee per Student: {formatCurrency(feesSummary.feeStructure.totalFee)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Total Students</Typography>
                  <Typography variant="h4">{totalStudents}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`Paid: ${fullyPaidCount}`} color="success" size="small" />
                    <Chip label={`Partial: ${partialPaidCount}`} color="warning" size="small" />
                    <Chip label={`Unpaid: ${unpaidCount}`} color="error" size="small" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Total Fee Amount</Typography>
                  <Typography variant="h4">{formatCurrency(totalFeeAmount)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Expected from all students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Total Collected</Typography>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(totalPaidAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {collectionPercentage.toFixed(1)}% collected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Total Outstanding</Typography>
                  <Typography variant="h4" color="error.main">
                    {formatCurrency(totalOutstanding)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {(100 - collectionPercentage).toFixed(1)}% pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Collection Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Fee Collection Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={collectionPercentage}
                    sx={{ height: 10, borderRadius: 5 }}
                    color={collectionPercentage === 100 ? 'success' : collectionPercentage > 50 ? 'primary' : 'warning'}
                  />
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {collectionPercentage.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Student-wise Details */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Student-wise Fee Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DataTable
                columns={STUDENT_COLUMNS}
                data={feesSummary.students ?? []}
                getRowKey={(s) => s.studentId}
                loading={isLoading}
              />
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Box>
  );
}
