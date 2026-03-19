import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@mui/material';

type RHFTextFieldProps = TextFieldProps & {
  name: string;
};

/**
 * React Hook Form controlled MUI TextField.
 * Requirements: 11.1, 14.5, 14.6
 */
export function RHFTextField({ name, ...props }: RHFTextFieldProps) {
  const { control } = useFormContext();
  const errorId = `${name}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? props.helperText}
          inputProps={{
            ...props.inputProps,
            'aria-describedby': fieldState.error ? errorId : undefined,
          }}
        />
      )}
    />
  );
}
