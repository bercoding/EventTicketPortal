import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Paper, Divider } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

const stats = [
  {
    title: 'Số Vé Đã Bán',
    value: '1,200',
    icon: <ConfirmationNumberIcon sx={{ fontSize: 48, color: '#2196F3' }} />,
    gradient: 'linear-gradient(135deg, #2196F3 30%, #21CBF3 90%)',
    change: '+12%',
    subText: 'So với tuần trước',
  },
  {
    title: 'Doanh Thu',
    value: '$30,000',
    icon: <AttachMoneyIcon sx={{ fontSize: 48, color: '#66BB6A' }} />,
    gradient: 'linear-gradient(135deg, #66BB6A 30%, #B2FF59 90%)',
    change: '+8.5%',
    subText: 'So với tháng trước',
  },
  {
    title: 'Sự Kiện Đang Diễn Ra',
    value: '5',
    icon: <EventAvailableIcon sx={{ fontSize: 48, color: '#FF7043' }} />,
    gradient: 'linear-gradient(135deg, #FF7043 30%, #FFB74D 90%)',
    change: '-2',
    subText: 'So với tuần trước',
  },
];

// Chart.js data for ticket sales trend
const chartData = {
  labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  datasets: [
    {
      label: 'Số vé bán',
      data: [150, 200, 180, 250, 300, 280, 320],
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2196F3',
      pointRadius: 5,
      pointHoverRadius: 8,
    },
  ],
};

// Chart.js options
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#1e1e2f', font: { size: 14 } },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#1e1e2f' },
    },
    y: {
      grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.1)' },
      ticks: { color: '#1e1e2f', beginAtZero: true },
    },
  },
};

const Dashboard = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 4,
          color: '#1e1e2f',
        }}
      >
        Thống Kê Bán Vé
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={stat.title}>
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
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {stat.change} {stat.subText}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Ticket Sales Trend Chart */}
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
          Xu Hướng Bán Vé (7 ngày qua)
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ height: 300 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;