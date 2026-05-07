import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
} from '@mui/material';

interface MultiStepFormProps {
  steps: string[];
  currentStep: number;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isLastStep?: boolean;
}

/**
 * Multi-step form with MUI Stepper navigation.
 * Requirements: 6.7
 */
export function MultiStepForm({
  steps,
  currentStep,
  children,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  isLastStep = false,
}: MultiStepFormProps) {
  return (
    <Box>
      <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 4 }}>{children}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          Back
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Step {currentStep + 1} of {steps.length}
        </Typography>

        {isLastStep ? (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onNext} disabled={isSubmitting}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
}
