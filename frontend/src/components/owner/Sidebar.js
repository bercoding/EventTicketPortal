import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography, Collapse, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EventIcon from '@mui/icons-material/Event';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion'; // For animations

const Sidebar = () => {
  const location = useLocation();
  const [openEvents, setOpenEvents] = useState(true); // State for collapsible section

  const menuItems = [
    { text: 'Thống Kê Bán Vé', icon: <DashboardIcon />, path: '/owner' },
    { text: 'Doanh Thu Sự Kiện', icon: <MonetizationOnIcon />, path: '/owner/revenue' },
  ];

  const eventItems = [
    { text: 'Danh Sách Sự Kiện', icon: <EventIcon />, path: '/owner/events' },
    { text: 'Phê Duyệt Sự Kiện', icon: <FaArrowRight style={{ fontSize: '20px' }} />, path: '/owner/events-approval' },
    { text: 'Quy Định Nhà Sở Hữu', icon: <FaArrowRight style={{ fontSize: '20px' }} />, path: '/owner/event-ownership-rules' },
  ];

  const handleToggleEvents = () => {
    setOpenEvents(!openEvents);
  };

  return (
    <Drawer
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          background: 'linear-gradient(180deg, #1e1e2f 0%, #2a2a3f 100%)',
          color: 'white',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          overflowX: 'hidden',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      {/* Header with Logo Animation */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: '700',
              background: 'linear-gradient(45deg, #00d8ff, #00ffaa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Owner Dashboard
          </Typography>
        </motion.div>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', mx: 2 }} />

      {/* Main Menu Items */}
      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => (
          <motion.div
            key={item.text}
            whileHover={{ x: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  py: 1,
                  '&.Mui-selected': {
                    background: 'rgba(0, 216, 255, 0.2)',
                    boxShadow: '0 0 10px rgba(0, 216, 255, 0.3)',
                    '&:hover': {
                      background: 'rgba(0, 216, 255, 0.25)',
                    },
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateX(3px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.95rem',
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>

      {/* Collapsible Events Section */}
      <List>
        <motion.div whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <ListItemButton
            onClick={handleToggleEvents}
            sx={{
              mx: 1,
              borderRadius: 2,
              py: 1,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <EventIcon />
            </ListItemIcon>
            <ListItemText
              primary="Quản Lý Sự Kiện"
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                },
              }}
            />
            {openEvents ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
          </ListItemButton>
        </motion.div>
        <Collapse in={openEvents} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {eventItems.map((item) => (
              <motion.div
                key={item.text}
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <ListItem disablePadding sx={{ pl: 4 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      py: 0.5,
                      '&.Mui-selected': {
                        background: 'rgba(0, 216, 255, 0.2)',
                        boxShadow: '0 0 10px rgba(0, 216, 255, 0.3)',
                      },
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '0.9rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;