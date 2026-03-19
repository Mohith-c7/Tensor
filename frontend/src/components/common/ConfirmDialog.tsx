import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireTyping?: string;
}

/**
 * Confirmation dialog with optional type-to-confirm safety check.
 * Requirements: 6.13, 14.2
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  requireTyping,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Move focus to first focusable element on open
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    } else {
      setTypedValue('');
    }
  }, [open]);

  const isConfirmDisabled = requireTyping ? typedValue !== requireTyping : false;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: requireTyping ? 2 : 0 }}>
          {message}
        </Typography>
        {requireTyping && (
          <TextField
            fullWidth
            size="small"
            label={`Type "${requireTyping}" to confirm`}
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            autoComplete="off"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button ref={firstFocusRef} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isConfirmDisabled}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
