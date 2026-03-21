import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MultiStepForm } from '../../components/forms/MultiStepForm';
import { RHFTextField } from '../../components/forms/RHFTextField';
import { RHFSelect } from '../../components/forms/RHFSelect';
import { RHFDatePicker } from '../../components/forms/RHFDatePicker';
import { useCreateStudent } from '../../hooks/useStudents';
import { useClasses, useSections } from '../../hooks/useClasses';
import { useToast } from '../../hooks/useToast';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { studentFullSchema, type StudentFullFormData } from '../../schemas/studentSchemas';
import { buildPath, ROUTES } from '../../router/routes';
import { PageHeader } from '../../components/common/PageHeader';

const STEPS = ['Personal Info', 'Contact & Address', 'Academic Info', 'Parent / Guardian'];

const STEP_FIELDS: (keyof StudentFullFormData)[][] = [
  ['admissionNo', 'firstName', 'lastName', 'dateOfBirth', 'gender'],
  ['email', 'phone', 'address'],
  ['classId', 'sectionId', 'admissionDate'],
  ['parentName', 'parentPhone', 'parentEmail'],
];

/**
 * Multi-step student creation form.
 * Requirements: 6.7, 6.8, 6.9, 6.10, 11.8
 */
export default function StudentNewPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createStudent = useCreateStudent();
  const [step, setStep] = useState(0);

  const methods = useForm<StudentFullFormData>({
    resolver: zodResolver(studentFullSchema),
    defaultValues: {
      admissionNo: '', firstName: '', lastName: '', dateOfBirth: '',
      gender: undefined, email: '', phone: '', address: '',
      classId: 0, sectionId: 0, admissionDate: '',
      parentName: '', parentPhone: '', parentEmail: '',
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, watch, setValue, formState: { isDirty, isSubmitting } } = methods;
  const selectedClassId = watch('classId');

  const { data: classes = [] } = useClasses();
  const { data: sections = [] } = useSections(Number(selectedClassId) || 0);

  useUnsavedChanges(isDirty && !isSubmitting);

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step] as (keyof StudentFullFormData)[]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: StudentFullFormData) => {
    try {
      const student = await createStudent.mutateAsync({
        admissionNo: data.admissionNo,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        classId: data.classId,
        sectionId: data.sectionId,
        admissionDate: data.admissionDate,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail || undefined,
      });
      showToast({ variant: 'success', message: 'Student created successfully' });
      navigate(buildPath(ROUTES.STUDENT_PROFILE, { id: student.id }));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 422) {
        showToast({ variant: 'error', message: 'Please fix the validation errors' });
      } else {
        showToast({ variant: 'error', message: 'Failed to create student' });
      }
    }
  };

  return (
    <Box>
      <PageHeader title="Add New Student" />
      <FormProvider {...methods}>
        <MultiStepForm
          steps={STEPS}
          currentStep={step}
          onBack={() => setStep((s) => s - 1)}
          onNext={handleNext}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          isLastStep={step === STEPS.length - 1}
        >
          {step === 0 && (
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
            </Grid>
          )}
          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><RHFTextField name="email" label="Email" type="email" fullWidth /></Grid>
              <Grid item xs={12} sm={6}><RHFTextField name="phone" label="Phone" fullWidth /></Grid>
              <Grid item xs={12}><RHFTextField name="address" label="Address" fullWidth multiline rows={3} /></Grid>
            </Grid>
          )}
          {step === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <RHFSelect
                  name="classId"
                  label="Class"
                  fullWidth
                  required
                  onChange={() => setValue('sectionId', 0)}
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFSelect
                  name="sectionId"
                  label="Section"
                  fullWidth
                  required
                  disabled={!selectedClassId || sections.length === 0}
                >
                  {sections.map((s) => (
                    <MenuItem key={s.id} value={s.id}>Section {s.name}</MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid item xs={12} sm={6}><RHFDatePicker name="admissionDate" label="Admission Date" fullWidth required /></Grid>
            </Grid>
          )}
          {step === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><RHFTextField name="parentName" label="Parent Name" fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><RHFTextField name="parentPhone" label="Parent Phone" fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><RHFTextField name="parentEmail" label="Parent Email" type="email" fullWidth /></Grid>
            </Grid>
          )}
        </MultiStepForm>
      </FormProvider>
    </Box>
  );
}
