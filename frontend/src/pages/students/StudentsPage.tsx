import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Menu,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useStudentList } from '../../hooks/useStudents';
import { useClasses, useSections } from '../../hooks/useClasses';
import { useDebounce } from '../../hooks/useDebounce';
import { useVirtualList } from '../../hooks/useVirtualList';
import { DataTable } from '../../components/data-display/DataTable';
import { VirtualList } from '../../components/data-display/VirtualList';
import { EmptyState } from '../../components/feedback/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusChip } from '../../components/common/StatusChip';
import { PermissionGate } from '../../components/guards/PermissionGate';
import { exportToCsv } from '../../utils/csvExport';
import { buildPath, ROUTES } from '../../router/routes';
import type { Student, StudentListParams } from '../../types/api';
import type { ColumnDef } from '../../types/domain';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const COLUMNS: ColumnDef<Student>[] = [
  { key: 'admissionNo', header: 'Admission No', sortable: true },
  { key: 'firstName', header: 'Full Name', render: (s) => `${s.firstName} ${s.lastName}`, sortable: true },
  { key: 'className', header: 'Class' },
  { key: 'sectionName', header: 'Section' },
  { key: 'gender', header: 'Gender', render: (s) => s.gender.charAt(0).toUpperCase() + s.gender.slice(1) },
  { key: 'isActive', header: 'Status', render: (s) => <StatusChip status={s.isActive ? 'active' : 'inactive'} /> },
];

/**
 * Students list page with search, filters, sorting, pagination, and bulk actions.
 * Requirements: 6.1–6.6, 6.14–6.16
 */
export default function StudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<StudentListParams['sortBy']>('firstName');
  const [sortOrder, _setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Student[]>([]);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch classes and sections
  const { data: classes } = useClasses();
  const { data: sections } = useSections(classFilter ? Number(classFilter) : null);

  const params: StudentListParams = {
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    classId: classFilter ? Number(classFilter) : undefined,
    sectionId: sectionFilter ? Number(sectionFilter) : undefined,
    gender: genderFilter ? (genderFilter as 'male' | 'female' | 'other') : undefined,
    isActive: statusFilter ? statusFilter === 'active' : undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isError, refetch } = useStudentList(params);
  const { shouldVirtualize } = useVirtualList(data?.items ?? []);

  const students = data?.items ?? [];

  // Reset section filter when class changes
  const handleClassChange = (newClassId: string) => {
    setClassFilter(newClassId);
    setSectionFilter(''); // Clear section when class changes
    setPage(1);
  };

  const handleExportCsv = () => {
    exportToCsv(
      'students.csv',
      (selected.length > 0 ? selected : students).map((s) => ({
        admissionNo: s.admissionNo,
        name: `${s.firstName} ${s.lastName}`,
        class: s.className,
        section: s.sectionName,
        gender: s.gender,
        status: s.isActive ? 'Active' : 'Inactive',
      })),
      [
        { key: 'admissionNo', label: 'Admission No' },
        { key: 'name', label: 'Name' },
        { key: 'class', label: 'Class' },
        { key: 'section', label: 'Section' },
        { key: 'gender', label: 'Gender' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setClassFilter('');
    setSectionFilter('');
    setGenderFilter('');
    setStatusFilter('');
    setPage(1);
  };

  // Count active filters
  const activeFilterCount = [
    search,
    classFilter,
    sectionFilter,
    genderFilter,
    statusFilter,
  ].filter(Boolean).length;

  const actions = (
    <Stack direction="row" spacing={1}>
      {selected.length > 0 && (
        <>
          <Button variant="outlined" onClick={(e) => setBulkMenuAnchor(e.currentTarget)}>
            Bulk Actions ({selected.length})
          </Button>
          <Menu anchorEl={bulkMenuAnchor} open={Boolean(bulkMenuAnchor)} onClose={() => setBulkMenuAnchor(null)}>
            <MenuItem onClick={() => { handleExportCsv(); setBulkMenuAnchor(null); }}>Export CSV</MenuItem>
            <PermissionGate allowedRoles={['admin']}>
              <MenuItem onClick={() => setBulkMenuAnchor(null)}>Deactivate Selected</MenuItem>
            </PermissionGate>
          </Menu>
        </>
      )}
      <PermissionGate allowedRoles={['admin']}>
        <Button variant="contained" onClick={() => navigate(ROUTES.STUDENT_NEW)}>
          Add Student
        </Button>
      </PermissionGate>
    </Stack>
  );

  return (
    <Box>
      <PageHeader title="Students" actions={actions} />

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search by name or admission no"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Class</InputLabel>
          <Select
            value={classFilter}
            label="Class"
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <MenuItem value="">All Classes</MenuItem>
            {classes?.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }} disabled={!classFilter}>
          <InputLabel>Section</InputLabel>
          <Select
            value={sectionFilter}
            label="Section"
            onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All Sections</MenuItem>
            {sections?.map((sec) => (
              <MenuItem key={sec.id} value={sec.id}>
                {sec.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={genderFilter}
            label="Gender"
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value as StudentListParams['sortBy'])}
          >
            <MenuItem value="firstName">Name A–Z</MenuItem>
            <MenuItem value="admissionNo">Admission No</MenuItem>
            <MenuItem value="admissionDate">Admission Date</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Per page</InputLabel>
          <Select
            value={pageSize}
            label="Per page"
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {search && (
            <Chip
              label={`Search: "${search}"`}
              onDelete={() => { setSearch(''); setPage(1); }}
              size="small"
            />
          )}
          {classFilter && (
            <Chip
              label={`Class: ${classes?.find((c) => c.id === Number(classFilter))?.name}`}
              onDelete={() => handleClassChange('')}
              size="small"
            />
          )}
          {sectionFilter && (
            <Chip
              label={`Section: ${sections?.find((s) => s.id === Number(sectionFilter))?.name}`}
              onDelete={() => { setSectionFilter(''); setPage(1); }}
              size="small"
            />
          )}
          {genderFilter && (
            <Chip
              label={`Gender: ${genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1)}`}
              onDelete={() => { setGenderFilter(''); setPage(1); }}
              size="small"
            />
          )}
          {statusFilter && (
            <Chip
              label={`Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
              onDelete={() => { setStatusFilter(''); setPage(1); }}
              size="small"
            />
          )}
          <Button
            variant="text"
            size="small"
            onClick={clearFilters}
            sx={{ ml: 1 }}
          >
            Clear All Filters
          </Button>
        </Stack>
      )}

      {/* Table */}
      {isError ? (
        <EmptyState
          message="Failed to load students."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      ) : students.length === 0 && !isLoading ? (
        <EmptyState
          message="No students match your filters."
          action={{ label: 'Clear Filters', onClick: clearFilters }}
        />
      ) : shouldVirtualize ? (
        <VirtualList
          items={students}
          itemHeight={56}
          renderItem={(student) => (
            <Box
              key={student.id}
              sx={{ px: 2, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => navigate(buildPath(ROUTES.STUDENT_PROFILE, { id: student.id }))}
            >
              {student.admissionNo} — {student.firstName} {student.lastName}
            </Box>
          )}
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={students}
          loading={isLoading}
          getRowKey={(s) => s.id}
          onRowClick={(s) => navigate(buildPath(ROUTES.STUDENT_PROFILE, { id: s.id }))}
          selectable
          onSelectionChange={setSelected}
        />
      )}
    </Box>
  );
}
