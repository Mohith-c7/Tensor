import { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudent, useDeleteStudent } from '../../hooks/useStudents';
import { useToast } from '../../hooks/useToast';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import { buildPath, ROUTES } from '../../router/routes';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { PermissionGate } from '../../components/guards/PermissionGate';
import { formatDate } from '../../services/prettyPrinter';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  );
}

/**
 * Student profile page with full details, attendance summary, and admin actions.
 * Requirements: 6.11, 6.13, 15.8
 */
export default function StudentProfilePage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const id = validatePositiveInt(idParam);
  const { data: student, isLoading } = useStudent(id ?? 0);
  const deleteStudent = useDeleteStudent();

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  if (isLoading) return <SkeletonLoader variant="table-row" count={10} />;
  if (!student) return <Typography>Student not found.</Typography>;

  const handleDelete = async () => {
    try {
      await deleteStudent.mutateAsync(id);
      showToast({ variant: 'success', message: 'Student deleted' });
      navigate(ROUTES.STUDENTS);
    } catch {
      showToast({ variant: 'error', message: 'Failed to delete student' });
    } finally {
      setDeleteOpen(false);
    }
  };

  const actions = (
    <PermissionGate allowedRoles={['admin']}>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(buildPath(ROUTES.STUDENT_EDIT, { id }))}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </Stack>
    </PermissionGate>
  );

  return (
    <Box>
      <PageHeader title={`${student.firstName} ${student.lastName}`} actions={actions} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Personal Information</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <InfoRow label="Admission No" value={student.admissionNo} />
            <InfoRow label="Date of Birth" value={student.dateOfBirth instanceof Date ? formatDate(student.dateOfBirth) : String(student.dateOfBirth)} />
            <InfoRow label="Gender" value={student.gender.charAt(0).toUpperCase() + student.gender.slice(1)} />
            <InfoRow label="Email" value={student.email} />
            <InfoRow label="Phone" value={student.phone} />
            <InfoRow label="Address" value={student.address} />
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Academic Information</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <InfoRow label="Class" value={student.className} />
            <InfoRow label="Section" value={student.sectionName} />
            <InfoRow label="Admission Date" value={student.admissionDate instanceof Date ? formatDate(student.admissionDate) : String(student.admissionDate)} />
            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Box>
                <Chip
                  label={student.isActive ? 'Active' : 'Inactive'}
                  color={student.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Parent / Guardian</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <InfoRow label="Name" value={student.parentName} />
            <InfoRow label="Phone" value={student.parentPhone} />
            <InfoRow label="Email" value={student.parentEmail} />
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Student"
        message={`This will permanently delete ${student.firstName} ${student.lastName}. Type the admission number to confirm.`}
        confirmLabel="Delete"
        requireTyping={student.admissionNo}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
