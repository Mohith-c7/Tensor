import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/feedback/ToastContainer';
import { queryClient } from './config/queryClient';
import { router } from './router';

/**
 * Root application component.
 * Provider order: Router → Auth (inside router) → Theme → Toast → Query
 * Requirements: 17.6, 17.7
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
