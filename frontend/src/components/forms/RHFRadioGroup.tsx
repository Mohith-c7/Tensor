import { Controller, useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';

interface RadioOption {
  value: string;
  label: string;
}

interface RHFRadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  row?: boolean;
}

/**
 * React Hook Form controlled MUI RadioGroup.
 * Requirements: 11.1
 */
export function RHFRadioGroup({ name, label, options, row = false }: RHFRadioGroupProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error}>
          <FormLabel>{label}</FormLabel>
          <RadioGroup {...field} row={row}>
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                label={opt.label}
                control={<Radio />}
              />
            ))}
          </RadioGroup>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}
