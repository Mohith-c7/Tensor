import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, MenuItem, Button, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { RHFTextField } from '../../components/forms/RHFTextField';
import { RHFSelect } from '../../components/forms/RHFSelect';
import { RHFDatePicker } from '../../components/forms/RHFDatePicker';
import { useStudent, useUpdateStudent } from '../../hooks/useStudents';
import { useToast } from '../../hooks/useToast';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { studentFullSchema, type StudentFullFormData } from '../../schemas/studentSchemas';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import { buildPath, ROUTES } from '../../router/routes';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { formatDate } from '../../services/prettyPrinter';

/**
 * Student edit page — pre-populates form with existing data.
 * Requirements: 6.12, 15.8
 */
export default function StudentEditPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const id = validatePositiveInt(idParam);

  const { data: student, isLoading } = useStudent(id ?? 0);
  const updateStudent = useUpdateStudent();

  const methods = useForm<StudentFullFormData>({
    resolver: zodResolver(studentFullSchema),
    values: student
      ? {
          admissionNo: student.admissionNo,
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: student.dateOfBirth instanceof Date
            ? student.dateOfBirth.toISOString().split('T')[0]
            : String(student.dateOfBirth),
          gender: student.gender,
          email: student.email ?? '',
          phone: student.phone ?? '',
          address: student.address ?? '',
          classId: student.classId,
          sectionId: student.sectionId,
          admissionDate: student.admissionDate instanceof Date
            ? student.admissionDate.toISOString().split('T')[0]
            : String(student.admissionDate),
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail ?? '',
        }
      : undefined,
    mode: 'onTouched',
  });

  const { handleSubmit, formState: { isDirty, isSubmitting } } = methods;

  useUnsavedChanges(isDirty && !isSubmitting);

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  if (isLoading) return <SkeletonLoader variant="table-row" count={8} />;

  const onSubmit = async (data: StudentFullFormData) => {
    try {
      await updateStudent.mutateAsync({ id: id!, data });
      showToast({ variant: 'success', message: 'Student updated successfully' });
      navigate(buildPath(ROUTES.STUDENT_PROFILE, { id: id! }));
    } catch {
      showToast({ variant: 'error', message: 'Failed to update student' });
    }
  };

  return (
    <Box>
      <PageHeader title="Edit Student" />
      <FormProvider {...methods}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><RHFTextField name="admissionNo" label="Admission No" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="firstName" label="First Name" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="lastName" label="Last Name" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFDatePicker name="dateOfBirth" label="Date of Birth" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}>
              <RHFSelect name="gender" label="Gender" fullWidth required>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </RHFSelect>
            </Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="email" label="Email" type="email" fullWidth /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="phone" label="Phone" fullWidth /></Grid>
            <Grid item xs={12}><RHFTextField name="address" label="Address" fullWidth multiline rows={2} /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="classId" label="Class ID" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="sectionId" label="Section ID" type="number" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFDatePicker name="admissionDate" label="Admission Date" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="parentName" label="Parent Name" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="parentPhone" label="Parent Phone" fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><RHFTextField name="parentEmail" label="Parent Email" type="email" fullWidth /></Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? <CircularProgress size={20} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </FormProvider>
    </Box>
  );
}
