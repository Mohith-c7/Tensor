import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Button, MenuItem, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RHFTextField } from '../../components/forms/RHFTextField';
import { RHFSelect } from '../../components/forms/RHFSelect';
import { RHFDatePicker } from '../../components/forms/RHFDatePicker';
import { PageHeader } from '../../components/common/PageHeader';
import { useCreateExam } from '../../hooks/useExams';
import { useToast } from '../../hooks/useToast';
import { examSchema, type ExamFormData } from '../../schemas/examSchemas';
import { buildPath, ROUTES } from '../../router/routes';

/** Requirements: 9.2, 9.3, 9.4 */
export default function ExamNewPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createExam = useCreateExam();

  const methods = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: { name: '', examType: undefined, classId: 0, subject: '', maxMarks: 0, passingMarks: 0, examDate: '' },
    mode: 'onTouched',
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (data: ExamFormData) => {
    try {
      const exam = await createExam.mutateAsync(data);
      showToast({ variant: 'success', message: 'Exam created successfully' });
      navigate(buildPath(ROUTES.EXAM_MARKS, { id: exam.id }));
    } catch {
      showToast({ variant: 'error', message: 'Failed to create exam' });
    }
  };

  return (
    <Box>
      <PageHeader title="Create Exam" />
      <FormProvider {...methods}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><RHFTextField name="name" label="Exam Name" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}>
              <RHFSelect name="examType" label="Exam Type" fullWidth required>
                <MenuItem value="unit_test">Unit Test</MenuItem>
                <MenuItem value="mid_term">Mid Term</MenuItem>
                <MenuItem value="final">Final</MenuItem>
                <MenuItem value="practical">Practical</MenuItem>
              </RHFSelect>
            </Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="classId" label="Class ID" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="subject" label="Subject" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="maxMarks" label="Max Marks" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="passingMarks" label="Passing Marks" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFDatePicker name="examDate" label="Exam Date" fullWidth required /></Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={20} /> : 'Create Exam'}
            </Button>
          </Box>
        </Box>
      </FormProvider>
    </Box>
  );
}
