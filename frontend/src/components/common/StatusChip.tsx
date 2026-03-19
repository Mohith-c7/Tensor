import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PaidIcon from '@mui/icons-material/Paid';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import type { AttendanceStatus } from '../../types/api';

type StatusType =
  | 'active'
  | 'inactive'
  | AttendanceStatus
  | 'paid'
  | 'partial'
  | 'unpaid';

interface StatusChipProps {
  status: StatusType;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default'; icon: React.ReactElement }
> = {
  active: { label: 'Active', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  inactive: { label: 'Inactive', color: 'error', icon: <CancelIcon fontSize="small" /> },
  present: { label: 'Present', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  absent: { label: 'Absent', color: 'error', icon: <CancelIcon fontSize="small" /> },
  late: { label: 'Late', color: 'warning', icon: <AccessTimeIcon fontSize="small" /> },
  excused: { label: 'Excused', color: 'info', icon: <EventBusyIcon fontSize="small" /> },
  paid: { label: 'Paid', color: 'success', icon: <PaidIcon fontSize="small" /> },
  partial: { label: 'Partial', color: 'warning', icon: <WarningIcon fontSize="small" /> },
  unpaid: { label: 'Unpaid', color: 'error', icon: <PendingIcon fontSize="small" /> },
};

/**
 * Status chip with both color and icon for accessibility.
 * Requirements: 7.13, 14.9
 */
export function StatusChip({ status }: StatusChipProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      size="small"
      variant="outlined"
    />
  );
}
