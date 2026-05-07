import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/** Requirements: 12.8 */
export default function NotFoundPage() {
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
        404
      </Typography>
      <Typography variant="h5">Page Not Found</Typography>
      <Typography variant="body1" color="text.secondary">
        The page you are looking for does not exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </Box>
  );
}
