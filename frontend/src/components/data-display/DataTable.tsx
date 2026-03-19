import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Box,
} from '@mui/material';
import { SkeletonLoader } from '../feedback/SkeletonLoader';
import type { ColumnDef } from '../../types/domain';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  getRowKey: (row: T) => string | number;
}

/**
 * Generic data table with loading skeleton and optional row selection.
 * Requirements: 3.12, 6.1, 6.4, 14.4
 */
export function DataTable<T>({
  columns,
  data,
  loading = false,
  onRowClick,
  selectable = false,
  onSelectionChange,
  getRowKey,
}: DataTableProps<T>) {
  const [selected, setSelected] = React.useState<Set<string | number>>(new Set());

  const toggleRow = (key: string | number) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
    onSelectionChange?.(data.filter((row) => next.has(getRowKey(row))));
  };

  const toggleAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(data.map(getRowKey));
      setSelected(all);
      onSelectionChange?.(data);
    }
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.size > 0 && selected.size < data.length}
                  checked={data.length > 0 && selected.size === data.length}
                  onChange={toggleAll}
                  inputProps={{ 'aria-label': 'Select all rows' }}
                />
              </TableCell>
            )}
            {columns.map((col) => (
              <TableCell key={String(col.key)} style={{ width: col.width }}>
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                <Box sx={{ py: 1 }}>
                  <SkeletonLoader variant="table-row" count={5} />
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const key = getRowKey(row);
              return (
                <TableRow
                  key={key}
                  hover={!!onRowClick}
                  onClick={() => onRowClick?.(row)}
                  selected={selected.has(key)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(key)}
                        onChange={() => toggleRow(key)}
                        onClick={(e) => e.stopPropagation()}
                        inputProps={{ 'aria-label': `Select row ${key}` }}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
