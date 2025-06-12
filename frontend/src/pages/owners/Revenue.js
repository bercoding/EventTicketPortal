import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper, Divider } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

// Sample data with more details
const data = [
  { month: 'Jan', revenue: 5000, ticketsSold: 200 },
  { month: 'Feb', revenue: 8000, ticketsSold: 300 },
  { month: 'Mar', revenue: 12000, ticketsSold: 450 },
  { month: 'Apr', revenue: 15000, ticketsSold: 600 },
  { month: 'May', revenue: 10000, ticketsSold: 400 },
  { month: 'Jun', revenue: 18000, ticketsSold: 700 },
];

// Summary statistics
const summaryStats = [
  {
    title: 'Tổng Doanh Thu',
    value: '$59,000',
    icon: <MonetizationOnIcon sx={{ fontSize: 40, color: '#66BB6A' }} />,
    gradient: 'linear-gradient(135deg, #66BB6A 30%, #B2FF59 90%)',
  },
  {
    title: 'Tổng Vé Bán',
    value: '2,650',
    icon: <TrendingUpIcon sx={{ fontSize: 40, color: '#2196F3' }} />,
    gradient: 'linear-gradient(135deg, #2196F3 30%, #21CBF3 90%)',
  },
];

const Revenue = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 4,
          color: '#1e1e2f',
          background: 'linear-gradient(45deg, #00d8ff, #00ffaa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Doanh Thu Sự Kiện
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ scale: 1.03 }}
            >
              <Card
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {stat.icon}
                    <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Revenue Chart */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          bgcolor: 'white',
          mt: 4,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e1e2f' }}>
          Xu Hướng Doanh Thu & Vé Bán (6 tháng qua)
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="month" stroke="#1e1e2f" />
            <YAxis yAxisId="left" stroke="#1e1e2f" />
            <YAxis yAxisId="right" orientation="right" stroke="#2196F3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              strokeWidth={3}
              name="Doanh Thu ($)"
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ticketsSold"
              stroke="#2196F3"
              strokeWidth={3}
              name="Vé Bán"
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default Revenue;