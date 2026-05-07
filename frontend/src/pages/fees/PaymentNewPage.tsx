import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Button, MenuItem, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RHFTextField } from '../../components/forms/RHFTextField';
import { RHFSelect } from '../../components/forms/RHFSelect';
import { RHFDatePicker } from '../../components/forms/RHFDatePicker';
import { PageHeader } from '../../components/common/PageHeader';
import { useRecordPayment } from '../../hooks/useFees';
import { useToast } from '../../hooks/useToast';
import { paymentSchema, type PaymentFormData } from '../../schemas/feeSchemas';
import { ROUTES } from '../../router/routes';

/** Requirements: 8.5, 8.6 */
export default function PaymentNewPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const recordPayment = useRecordPayment();

  const methods = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: 0, academicYear: '', amount: 0,
      paymentDate: '', paymentMethod: undefined, transactionId: '', remarks: '',
    },
    mode: 'onTouched',
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (data: PaymentFormData) => {
    try {
      // Remove empty optional fields
      const cleanData = {
        ...data,
        transactionId: data.transactionId?.trim() || undefined,
        remarks: data.remarks?.trim() || undefined,
      };
      await recordPayment.mutateAsync(cleanData);
      showToast({
        variant: 'success',
        message: `Payment of ${data.amount} recorded for student #${data.studentId}`,
      });
      navigate(ROUTES.FEES_PAYMENTS);
    } catch {
      showToast({ variant: 'error', message: 'Failed to record payment' });
    }
  };

  return (
    <Box>
      <PageHeader title="Record Payment" />
      <FormProvider {...methods}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><RHFTextField name="studentId" label="Student ID" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="academicYear" label="Academic Year (e.g. 2024-2025)" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="amount" label="Amount" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFDatePicker name="paymentDate" label="Payment Date" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}>
              <RHFSelect name="paymentMethod" label="Payment Method" fullWidth required>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </RHFSelect>
            </Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="transactionId" label="Transaction ID (optional)" fullWidth /></Grid>
            <Grid item xs={12}><RHFTextField name="remarks" label="Remarks (optional)" fullWidth multiline rows={2} /></Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={20} /> : 'Record Payment'}
            </Button>
          </Box>
        </Box>
      </FormProvider>
    </Box>
  );
}
