import React, { useState } from 'react';
import {
  Box, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, MenuItem, CircularProgress, Stack,
} from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TimetableGrid } from '../../components/data-display/TimetableGrid';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RHFTextField } from '../../components/forms/RHFTextField';
import { PermissionGate } from '../../components/guards/PermissionGate';
import {
  useClassTimetable,
  useCreateTimetableEntry,
  useUpdateTimetableEntry,
  useDeleteTimetableEntry,
} from '../../hooks/useTimetable';
import { useToast } from '../../hooks/useToast';
import { timetableEntrySchema, type TimetableEntryFormData } from '../../schemas/timetableSchemas';
import type { TimetableEntry, DayOfWeek } from '../../types/api';

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Requirements: 10.1–10.3, 10.5–10.7, 10.11 */
export default function TimetablePage() {
  const { showToast } = useToast();
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: DayOfWeek; period: number } | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  const { data: entries, isLoading } = useClassTimetable(Number(classId) || 0, Number(sectionId) || 0);
  const createEntry = useCreateTimetableEntry();
  const updateEntry = useUpdateTimetableEntry();
  const deleteEntry = useDeleteTimetableEntry();

  const methods = useForm<TimetableEntryFormData>({
    resolver: zodResolver(timetableEntrySchema),
    defaultValues: { subject: '', teacherId: 0, roomNumber: '', startTime: '', endTime: '' },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  const handleCellClick = (day: DayOfWeek, period: number, existing?: TimetableEntry) => {
    setSelectedCell({ day, period });
    setEditingEntry(existing ?? null);
    if (existing) {
      reset({ subject: existing.subject, teacherId: existing.teacherId ?? 0, roomNumber: existing.roomNumber ?? '', startTime: existing.startTime, endTime: existing.endTime });
    } else {
      reset({ subject: '', teacherId: 0, roomNumber: '', startTime: '', endTime: '' });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: TimetableEntryFormData) => {
    if (!selectedCell) return;
    try {
      if (editingEntry) {
        await updateEntry.mutateAsync({ id: editingEntry.id, data });
        showToast({ variant: 'success', message: 'Entry updated' });
      } else {
        await createEntry.mutateAsync({
          ...data,
          classId: Number(classId),
          sectionId: Number(sectionId),
          dayOfWeek: selectedCell.day,
          periodNumber: selectedCell.period,
        });
        showToast({ variant: 'success', message: 'Entry created' });
      }
      setDialogOpen(false);
    } catch {
      showToast({ variant: 'error', message: 'Failed to save entry' });
    }
  };

  const handleDelete = async () => {
    if (!editingEntry) return;
    try {
      await deleteEntry.mutateAsync({
        id: editingEntry.id,
        classId: editingEntry.classId,
        sectionId: editingEntry.sectionId,
        teacherId: editingEntry.teacherId,
      });
      showToast({ variant: 'success', message: 'Entry deleted' });
      setDeleteOpen(false);
      setDialogOpen(false);
    } catch {
      showToast({ variant: 'error', message: 'Failed to delete entry' });
    }
  };

  return (
    <Box>
      <PageHeader title="Timetable" />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField label="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} size="small" type="number" sx={{ width: 120 }} />
        <TextField label="Section ID" value={sectionId} onChange={(e) => setSectionId(e.target.value)} size="small" type="number" sx={{ width: 120 }} />
      </Stack>

      {isLoading ? (
        <SkeletonLoader variant="table-row" count={8} />
      ) : (
        <PermissionGate allowedRoles={['admin']} fallback={
          <TimetableGrid entries={entries ?? []} periods={PERIODS} onCellClick={() => {}} />
        }>
          <TimetableGrid entries={entries ?? []} periods={PERIODS} onCellClick={handleCellClick} />
        </PermissionGate>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
        <FormProvider {...methods}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><RHFTextField name="subject" label="Subject" fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><RHFTextField name="teacherId" label="Teacher ID" type="number" fullWidth /></Grid>
              <Grid item xs={12} sm={6}><RHFTextField name="roomNumber" label="Room Number" fullWidth /></Grid>
              <Grid item xs={12} sm={6}><RHFTextField name="startTime" label="Start Time (HH:mm)" fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><RHFTextField name="endTime" label="End Time (HH:mm)" fullWidth required /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            {editingEntry && (
              <Button color="error" onClick={() => setDeleteOpen(true)}>Delete</Button>
            )}
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </FormProvider>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Entry"
        message="Are you sure you want to delete this timetable entry?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
