import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../router/routes';

/** Requirements: 2.2 */
export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <Typography variant="h1" component="p" sx={{ fontSize: '6rem', fontWeight: 700, lineHeight: 1 }}>
        403
      </Typography>
      <Typography variant="h5">Access Forbidden</Typography>
      <Typography variant="body1" color="text.secondary">
        You do not have permission to view this page.
      </Typography>
      <Button variant="contained" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Return to Dashboard
      </Button>
    </Box>
  );
}
