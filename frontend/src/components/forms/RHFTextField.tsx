import { Controller, useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@mui/material';

type RHFTextFieldProps = TextFieldProps & {
  name: string;
};

/**
 * React Hook Form controlled MUI TextField.
 * Requirements: 11.1, 14.5, 14.6
 */
export function RHFTextField({ name, type, ...props }: RHFTextFieldProps) {
  const { control } = useFormContext();
  const errorId = `${name}-error`;
  const isNumber = type === 'number';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          type={type}
          {...props}
          value={field.value ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            if (isNumber) {
              // Convert to number for number inputs, or set to 0 if empty
              field.onChange(value === '' ? 0 : Number(value));
            } else {
              field.onChange(value);
            }
          }}
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
