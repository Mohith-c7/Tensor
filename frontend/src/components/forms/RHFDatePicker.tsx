import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@mui/material';

type RHFDatePickerProps = Omit<TextFieldProps, 'type'> & {
  name: string;
  minDate?: string;
  maxDate?: string;
};

/**
 * React Hook Form controlled date input with range validation (1900–2100).
 * Requirements: 11.1, 11.10
 */
export function RHFDatePicker({
  name,
  minDate = '1900-01-01',
  maxDate = '2100-12-31',
  ...props
}: RHFDatePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          type="date"
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? props.helperText}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            ...props.inputProps,
            min: minDate,
            max: maxDate,
          }}
        />
      )}
    />
  );
}
