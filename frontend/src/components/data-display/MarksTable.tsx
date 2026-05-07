import { useState } from 'react';
import {
  Box,
  Checkbox,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { calculateGrade } from '../../utils/gradeCalculator';

interface MarksRow {
  studentId: number;
  studentName: string;
  admissionNo: string;
  marksObtained?: number;
  isAbsent: boolean;
  remarks?: string;
}

interface MarksTableProps {
  rows: MarksRow[];
  maxMarks: number;
  passingMarks: number;
  onChange: (studentId: number, update: Partial<MarksRow>) => void;
}

/**
 * Editable marks entry table with validation and pass/fail indicators.
 * Requirements: 9.5, 9.6, 9.8, 9.12
 */
export function MarksTable({ rows, maxMarks, passingMarks, onChange }: MarksTableProps) {
  const [edited, setEdited] = useState<Set<number>>(new Set());

  const handleChange = (studentId: number, update: Partial<MarksRow>) => {
    setEdited((prev) => new Set(prev).add(studentId));
    onChange(studentId, update);
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Admission No</TableCell>
            <TableCell>Student Name</TableCell>
            <TableCell>Marks (/{maxMarks})</TableCell>
            <TableCell>Absent</TableCell>
            <TableCell>Grade</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Remarks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const marks = row.isAbsent ? 0 : (row.marksObtained ?? 0);
            const grade = row.isAbsent ? '-' : calculateGrade(marks, maxMarks);
            const isPassed = !row.isAbsent && marks >= passingMarks;
            const isEdited = edited.has(row.studentId);

            return (
              <TableRow
                key={row.studentId}
                sx={{ bgcolor: isEdited ? 'action.hover' : 'inherit' }}
              >
                <TableCell>
                  <Typography variant="body2">{row.admissionNo}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{row.studentName}</Typography>
                    {isEdited && (
                      <Chip label="edited" size="small" color="info" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={row.isAbsent ? '' : (row.marksObtained ?? '')}
                    disabled={row.isAbsent}
                    inputProps={{ min: 0, max: maxMarks, 'aria-label': `Marks for ${row.studentName}` }}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      if (val !== undefined && (val < 0 || val > maxMarks)) return;
                      handleChange(row.studentId, { marksObtained: val });
                    }}
                    error={
                      !row.isAbsent &&
                      row.marksObtained !== undefined &&
                      (row.marksObtained < 0 || row.marksObtained > maxMarks)
                    }
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={row.isAbsent}
                    onChange={(e) =>
                      handleChange(row.studentId, {
                        isAbsent: e.target.checked,
                        marksObtained: e.target.checked ? 0 : undefined,
                      })
                    }
                    inputProps={{ 'aria-label': `Mark ${row.studentName} absent` }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{grade}</Typography>
                </TableCell>
                <TableCell>
                  {!row.isAbsent && (
                    <Chip
                      label={isPassed ? 'Pass' : 'Fail'}
                      color={isPassed ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={row.remarks ?? ''}
                    onChange={(e) => handleChange(row.studentId, { remarks: e.target.value })}
                    inputProps={{ 'aria-label': `Remarks for ${row.studentName}` }}
                    sx={{ width: 140 }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
