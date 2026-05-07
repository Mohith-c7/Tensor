import { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { MarksTable } from '../../components/data-display/MarksTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { useExam, useExamMarks, useSubmitMarks } from '../../hooks/useExams';
import { useToast } from '../../hooks/useToast';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import { ROUTES } from '../../router/routes';

interface MarksRow {
  studentId: number;
  studentName: string;
  admissionNo: string;
  marksObtained?: number;
  isAbsent: boolean;
  remarks?: string;
}

/** Requirements: 9.5, 9.6, 9.7, 9.12 */
export default function ExamMarksPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const id = validatePositiveInt(idParam);
  const { data: exam, isLoading: examLoading } = useExam(id ?? 0);
  const { data: existingMarks, isLoading: marksLoading } = useExamMarks(id ?? 0);
  const submitMarks = useSubmitMarks();

  const [rows, setRows] = useState<MarksRow[]>([]);

  useEffect(() => {
    if (existingMarks && existingMarks.length > 0) {
      setRows(existingMarks.map((m) => ({
        studentId: m.studentId,
        studentName: m.studentName,
        admissionNo: m.admissionNo,
        marksObtained: m.isAbsent ? 0 : m.marksObtained,
        isAbsent: m.isAbsent,
        remarks: m.remarks,
      })));
    }
  }, [existingMarks]);

  if (!id) {
    navigate(ROUTES.NOT_FOUND, { replace: true });
    return null;
  }

  if (examLoading || marksLoading) return <SkeletonLoader variant="table-row" count={8} />;

  const handleRowChange = (studentId: number, update: Partial<MarksRow>) => {
    setRows((prev) => prev.map((r) => r.studentId === studentId ? { ...r, ...update } : r));
  };

  const handleSubmit = async () => {
    try {
      await submitMarks.mutateAsync({
        examId: id!,
        marks: rows.map((r) => ({
          studentId: r.studentId,
          data: { marksObtained: r.marksObtained, isAbsent: r.isAbsent, remarks: r.remarks },
        })),
      });
      showToast({ variant: 'success', message: 'Marks submitted successfully' });
    } catch {
      showToast({ variant: 'error', message: 'Failed to submit marks' });
    }
  };

  return (
    <Box>
      <PageHeader title={exam ? `Marks — ${exam.name}` : 'Marks Entry'} />
      {exam && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {exam.subject} · Max: {exam.maxMarks} · Passing: {exam.passingMarks}
        </Typography>
      )}

      {rows.length > 0 ? (
        <>
          <MarksTable
            rows={rows}
            maxMarks={exam?.maxMarks ?? 100}
            passingMarks={exam?.passingMarks ?? 40}
            onChange={handleRowChange}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitMarks.isPending}
            >
              {submitMarks.isPending ? <CircularProgress size={20} /> : 'Submit Marks'}
            </Button>
          </Box>
        </>
      ) : (
        <Typography color="text.secondary">No students found for this exam.</Typography>
      )}
    </Box>
  );
}
