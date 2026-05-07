import { Card, CardActionArea, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { SkeletonLoader } from '../feedback/SkeletonLoader';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' };
  onClick?: () => void;
  loading?: boolean;
}

/**
 * KPI metric card with optional trend indicator and click navigation.
 * Requirements: 5.1, 5.8
 */
export function KPICard({ title, value, icon, trend, onClick, loading = false }: KPICardProps) {
  if (loading) {
    return <SkeletonLoader variant="kpi-card" />;
  }

  const content = (
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {trend.direction === 'up' ? (
                <TrendingUpIcon fontSize="small" color="success" />
              ) : (
                <TrendingDownIcon fontSize="small" color="error" />
              )}
              <Typography
                variant="caption"
                color={trend.direction === 'up' ? 'success.main' : 'error.main'}
              >
                {Math.abs(trend.value)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ color: 'primary.main', opacity: 0.8 }}>{icon}</Box>
      </Box>
    </CardContent>
  );

  if (onClick) {
    return (
      <Card variant="outlined">
        <CardActionArea onClick={onClick}>{content}</CardActionArea>
      </Card>
    );
  }

  return <Card variant="outlined">{content}</Card>;
}
