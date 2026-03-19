import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Typography, Box } from '@mui/material';

interface DataPoint {
  month: string;
  amount: number;
}

interface FeeCollectionChartProps {
  data: DataPoint[];
}

/**
 * Bar chart showing monthly fee collections for current academic year.
 * Lazy-loaded via React.lazy.
 * Requirements: 5.4, 13.8
 */
export default function FeeCollectionChart({ data }: FeeCollectionChartProps) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Fee Collection (Current Academic Year)
      </Typography>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Collected']} />
          <Bar dataKey="amount" fill="#1976d2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
