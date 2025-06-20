import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  MoreVert,
  CalendarToday,
  AccessTime,
  Person,
  LocationOn,
  Phone,
  Euro,
  Edit,
  Cancel,
  Visibility,
  PhotoCamera,
  CheckCircleOutline, // ✅ Added for 'Accept'
  HighlightOff // ✅ Added for 'Reject'
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../Services/bookingService';

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: '⏳'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'success',
    icon: '✅'
  },
  completed: {
    label: 'Completed',
    color: 'info',
    icon: '📸'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    icon: '❌'
  }
};

const BookingCard = ({ booking, onUpdate, isAdmin }) => { // isAdmin passed as prop
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false); // ✅ Added for rejection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editFormData, setEditFormData] = useState({
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    photographer: booking.photographer?.name || '',
  });
  const [rejectReason, setRejectReason] = useState(''); // ✅ Added for rejection reason

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditFormData({
      bookingDate: booking.bookingDate.split('T')[0], // Format YYYY-MM-DD
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      photographer: booking.photographer?.name || '',
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
    handleMenuClose();
  };

  const handleRejectClick = () => { // ✅ Handle rejection dialog opening
    setRejectDialogOpen(true);
    handleMenuClose();
  };

  const handleEdit = async () => {
    setLoading(true);
    setError(null);
    try {
      const updatedBooking = await bookingService.updateBooking(booking._id, editFormData);
      onUpdate(updatedBooking.data); // Pass updated booking to parent
      setEditDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Update error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const cancelledBooking = await bookingService.cancelBooking(booking._id);
      onUpdate(cancelledBooking.data);
      setCancelDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Cancellation error.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to accept booking
  const handleAcceptBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const acceptedBooking = await bookingService.acceptBooking(booking._id);
      onUpdate(acceptedBooking.data);
    } catch (err) {
      setError(err.message || 'Acceptance error.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to reject booking
  const handleRejectBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const rejectedBooking = await bookingService.rejectBooking(booking._id, rejectReason);
      onUpdate(rejectedBooking.data);
      setRejectDialogOpen(false); // Close dialog after success
    } catch (err) {
      setError(err.message || 'Rejection error.');
    } finally {
      setLoading(false);
    }
  };


  const formattedDate = bookingService.formatDate(booking.bookingDate);
  const formattedPrice = bookingService.formatPrice(booking.pricing?.totalPrice || booking.service.price);
  const canModify = bookingService.canModifyBooking(booking);

  // Photographers (simulated for editing, replace with real list if needed)
  const photographers = [
    'Sophie Martin',
    'Thomas Dubois',
    'Marie Lefebvre',
    'Pierre Garcia',
    'Emma Rodriguez'
  ];

  return (
    <>
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: '8px' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Status and Date */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Date: <Typography component="span" fontWeight="medium">{formattedDate}</Typography>
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Time: <Typography component="span" fontWeight="medium">{booking.startTime} - {booking.endTime}</Typography>
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Chip
                  label={statusConfig[booking.status]?.label || booking.status}
                  color={statusConfig[booking.status]?.color || 'default'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Grid>

            {/* Service and Client */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" mb={1}>
                <PhotoCamera fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Service: <Typography component="span" fontWeight="medium">{booking.service?.name}</Typography>
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Client: <Typography component="span" fontWeight="medium">{booking.client?.firstName} {booking.client?.lastName}</Typography>
                </Typography>
              </Box>
              {booking.client?.email && (
                <Box display="flex" alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                    ({booking.client.email})
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Price and Actions */}
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <Euro fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Price: <Typography component="span" fontWeight="bold" color="primary">{formattedPrice}</Typography>
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {/* Accept/Reject buttons for Admin if pending */}
              {isAdmin && booking.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircleOutline />}
                    onClick={handleAcceptBooking}
                    disabled={loading}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<HighlightOff />}
                    onClick={handleRejectClick}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                </Box>
              )}

              {/* Actions menu (Edit, Cancel, etc.) */}
              {(isAdmin || user?._id === booking.client?._id) && (
                <IconButton
                  aria-label="more actions"
                  aria-controls="booking-menu"
                  aria-haspopup="true"
                  onClick={handleMenuClick}
                  disabled={loading}
                  size="small"
                >
                  <MoreVert />
                </IconButton>
              )}
              <Menu
                id="booking-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                {/* View */}
                <MenuItem onClick={() => { /* Implement detailed view */ handleMenuClose(); }}>
                  <Visibility fontSize="small" sx={{ mr: 1 }} />
                  View
                </MenuItem>
                {/* Edit (if modifiable) */}
                {(isAdmin || (user?._id === booking.client?._id && canModify)) && (
                  <MenuItem onClick={handleEditClick}>
                    <Edit fontSize="small" sx={{ mr: 1 }} />
                    Edit
                  </MenuItem>
                )}
                {/* Cancel (if modifiable) */}
                {(isAdmin || (user?._id === booking.client?._id && canModify)) && (
                  <MenuItem onClick={handleCancelClick} sx={{ color: 'error.main' }}>
                    <Cancel fontSize="small" sx={{ mr: 1 }} />
                    Cancel
                  </MenuItem>
                )}
              </Menu>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onClose={() => !loading && setEditDialogOpen(false)}>
        <DialogTitle>Edit Booking</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            margin="dense"
            name="bookingDate"
            label="Booking Date"
            type="date"
            fullWidth
            value={editFormData.bookingDate}
            onChange={(e) => setEditFormData({ ...editFormData, bookingDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <TextField
            margin="dense"
            name="startTime"
            label="Start Time"
            type="time"
            fullWidth
            value={editFormData.startTime}
            onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <TextField
            margin="dense"
            name="endTime"
            label="End Time"
            type="time"
            fullWidth
            value={editFormData.endTime}
            onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
            disabled={loading}
          />
          {isAdmin && ( // Administrator can change status and photographer
            <>
              <TextField
                margin="dense"
                name="status"
                label="Status"
                select
                fullWidth
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                sx={{ mb: 2 }}
                disabled={loading}
              >
                {Object.keys(statusConfig).map((statusKey) => (
                  <MenuItem key={statusKey} value={statusKey}>
                    {statusConfig[statusKey].label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                margin="dense"
                name="photographer"
                label="Photographer"
                select
                fullWidth
                value={editFormData.photographer}
                onChange={(e) => setEditFormData({ ...editFormData, photographer: e.target.value })}
                sx={{ mb: 2 }}
                disabled={loading}
              >
                {photographers.map((photographerName) => (
                  <MenuItem key={photographerName} value={photographerName}>
                    {photographerName}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleEdit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => !loading && setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            Are you sure you want to cancel this booking?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={loading}>
            No, keep it
          </Button>
          <Button onClick={handleCancel} color="error" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Booking rejection dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => !loading && setRejectDialogOpen(false)}>
        <DialogTitle>Reject Booking</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to reject this booking?
          </Typography>
          <TextField
            margin="dense"
            label="Rejection reason (optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRejectBooking} color="error" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Confirm rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookingCard;