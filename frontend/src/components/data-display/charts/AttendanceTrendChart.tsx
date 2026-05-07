import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Typography, Box } from '@mui/material';

interface DataPoint {
  date: string;
  percentage: number;
}

interface AttendanceTrendChartProps {
  data: DataPoint[];
}

/**
 * Line chart showing daily attendance % for past 30 days.
 * Lazy-loaded via React.lazy.
 * Requirements: 5.3, 13.8
 */
export default function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Attendance Trend (Last 30 Days)
      </Typography>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [`${value}%`, 'Attendance']} />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#1976d2"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
