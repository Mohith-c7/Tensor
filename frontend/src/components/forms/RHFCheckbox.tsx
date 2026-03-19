import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox, FormControlLabel, type CheckboxProps } from '@mui/material';

type RHFCheckboxProps = CheckboxProps & {
  name: string;
  label: string;
};

/**
 * React Hook Form controlled MUI Checkbox.
 * Requirements: 11.1
 */
export function RHFCheckbox({ name, label, ...props }: RHFCheckboxProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          label={label}
          control={
            <Checkbox
              {...props}
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          }
        />
      )}
    />
  );
}
