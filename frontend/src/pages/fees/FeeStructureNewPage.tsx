import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Button, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RHFTextField } from '../../components/forms/RHFTextField';
import { PageHeader } from '../../components/common/PageHeader';
import { useCreateFeeStructure } from '../../hooks/useFees';
import { useToast } from '../../hooks/useToast';
import { feeStructureSchema, type FeeStructureFormData } from '../../schemas/feeSchemas';
import { ROUTES } from '../../router/routes';
import { formatCurrency } from '../../services/prettyPrinter';

/** Requirements: 8.2, 8.3, 8.4 */
export default function FeeStructureNewPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createStructure = useCreateFeeStructure();

  const methods = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: { classId: 0, academicYear: '', tuitionFee: 0, transportFee: 0, activityFee: 0, otherFee: 0 },
    mode: 'onChange',
  });

  const { handleSubmit, watch, formState: { isSubmitting } } = methods;
  const [tuition, transport, activity, other] = watch(['tuitionFee', 'transportFee', 'activityFee', 'otherFee']);
  const total = (Number(tuition) || 0) + (Number(transport) || 0) + (Number(activity) || 0) + (Number(other) || 0);

  const onSubmit = async (data: FeeStructureFormData) => {
    try {
      await createStructure.mutateAsync(data);
      showToast({ variant: 'success', message: 'Fee structure created' });
      navigate(ROUTES.FEES_STRUCTURES);
    } catch {
      showToast({ variant: 'error', message: 'Failed to create fee structure' });
    }
  };

  return (
    <Box>
      <PageHeader title="New Fee Structure" />
      <FormProvider {...methods}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><RHFTextField name="classId" label="Class ID" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="academicYear" label="Academic Year (e.g. 2024-2025)" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="tuitionFee" label="Tuition Fee" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="transportFee" label="Transport Fee" type="number" fullWidth /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="activityFee" label="Activity Fee" type="number" fullWidth /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="otherFee" label="Other Fee" type="number" fullWidth /></Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2">
              Total Fee: <strong>{formatCurrency(total)}</strong>
            </Typography>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={20} /> : 'Create Structure'}
            </Button>
          </Box>
        </Box>
      </FormProvider>
    </Box>
  );
}
