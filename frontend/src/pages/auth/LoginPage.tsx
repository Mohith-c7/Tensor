import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { RHFTextField } from '../../components/forms/RHFTextField';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../router/routes';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Login page with email/password form.
 * Requirements: 1.1, 1.2, 1.11, 1.12, 11.5
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate(from ?? ROUTES.DASHBOARD, { replace: true });
    } catch {
      setServerError('Invalid email or password');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={2} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" color="primary" mb={1}>
          Tensor
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to your account
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {serverError}
          </Alert>
        )}

        <FormProvider {...methods}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <RHFTextField
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              disabled={isSubmitting}
            />
            <RHFTextField
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 1, position: 'relative' }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>
        </FormProvider>
      </Paper>
    </Box>
  );
}
