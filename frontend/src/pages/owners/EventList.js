import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Button, Chip, TextField, Box, TableSortLabel,
  TablePagination, Modal, Fade, Backdrop, IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

const eventsData = [
  { id: 1, name: 'Concert 1', date: '15/07/2025', ticketsSold: 800, status: 'Active', description: 'A grand music concert featuring top artists.' },
  { id: 2, name: 'Festival', date: '20/07/2025', ticketsSold: 1200, status: 'Upcoming', description: 'A vibrant cultural festival with food and music.' },
  { id: 3, name: 'Tech Conference', date: '25/08/2025', ticketsSold: 400, status: 'Active', description: 'Latest trends in technology and innovation.' },
  { id: 4, name: 'Art Exhibition', date: '01/09/2025', ticketsSold: 500, status: 'Upcoming', description: 'Showcasing contemporary art from local artists.' },
  { id: 5, name: 'Music Festival', date: '10/10/2025', ticketsSold: 1000, status: 'Active', description: 'A weekend of live music performances.' },
];

const EventList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Sorting logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedEvents = eventsData
    .filter((event) => event.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (orderBy === 'date') {
        return order === 'asc'
          ? new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-'))
          : new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-'));
      }
      return order === 'asc'
        ? a[orderBy] < b[orderBy] ? -1 : 1
        : a[orderBy] > b[orderBy] ? -1 : 1;
    });

  // Pagination logic
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Modal logic
  const handleOpenModal = (event) => {
    setSelectedEvent(event);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null);
  };

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
        Danh Sách Sự Kiện
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 3, maxWidth: 400 }}>
        <TextField
          label="Tìm kiếm sự kiện"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
              '&:hover fieldset': { borderColor: '#00d8ff' },
            },
          }}
        />
      </Box>

      {/* Table */}
      <Paper
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#1e1e2f' }}>
              <TableRow>
                {[
                  { id: 'name', label: 'Tên Sự Kiện' },
                  { id: 'date', label: 'Ngày Tổ Chức' },
                  { id: 'ticketsSold', label: 'Số Vé Đã Bán' },
                  { id: 'status', label: 'Trạng Thái' },
                  { id: 'actions', label: 'Hành Động' },
                ].map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    sx={{ color: 'white', fontWeight: 600 }}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.id !== 'actions' ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                        sx={{
                          color: 'white',
                          '&:hover': { color: '#00d8ff' },
                          '&.Mui-active': { color: '#00d8ff' },
                        }}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((event, index) => (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    component={TableRow}
                    whileHover={{ backgroundColor: 'rgba(0, 216, 255, 0.05)' }}
                  >
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.ticketsSold}</TableCell>
                    <TableCell>
                      <Chip
                        label={event.status}
                        color={event.status === 'Active' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenModal(event)}
                        sx={{ mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </motion.tr>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sortedEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số dòng mỗi trang"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Paper>

      {/* Event Details Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 400 },
              bgcolor: 'white',
              borderRadius: 3,
              boxShadow: 24,
              p: 4,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e1e2f' }}>
                Chi Tiết Sự Kiện
              </Typography>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>
            {selectedEvent && (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Tên:</strong> {selectedEvent.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Ngày:</strong> {selectedEvent.date}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Số Vé Đã Bán:</strong> {selectedEvent.ticketsSold}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Trạng Thái:</strong> {selectedEvent.status}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Mô Tả:</strong> {selectedEvent.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCloseModal}
                  sx={{ mt: 2, bgcolor: '#00d8ff', '&:hover': { bgcolor: '#00b8d4' } }}
                >
                  Đóng
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default EventList;