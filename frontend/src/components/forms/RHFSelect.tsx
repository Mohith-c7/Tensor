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
export function RHFSelect({ name, label, helperText, children, onChange: externalOnChange, ...props }: RHFSelectProps) {
  const { control } = useFormContext();
  const labelId = `${name}-label`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error}>
          <InputLabel id={labelId}>{label}</InputLabel>
          <Select
            {...field}
            {...props}
            labelId={labelId}
            label={label}
            value={field.value ?? ''}
            onChange={(e, child) => {
              // Coerce to number if the current field value is a number
              const raw = e.target.value;
              const coerced = typeof field.value === 'number' ? Number(raw) : raw;
              field.onChange(coerced);
              externalOnChange?.(e, child);
            }}
          >
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
