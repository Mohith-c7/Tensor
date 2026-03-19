import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  type SelectProps,
} from '@mui/material';

type RHFSelectProps = SelectProps & {
  name: string;
  label: string;
  helperText?: string;
};

/**
 * React Hook Form controlled MUI Select.
 * Requirements: 11.1
 */
export function RHFSelect({ name, label, helperText, children, ...props }: RHFSelectProps) {
  const { control } = useFormContext();
  const labelId = `${name}-label`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error}>
          <InputLabel id={labelId}>{label}</InputLabel>
          <Select {...field} {...props} labelId={labelId} label={label}>
            {children}
          </Select>
          <FormHelperText>
            {fieldState.error?.message ?? helperText}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
}
