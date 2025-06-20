import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
  CalendarToday,
  AccessTime,
  Person,
  LocationOn,
  Phone,
  Euro,
  PhotoCamera
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../components/Services/bookingService';

const photographers = [
  'Sophie Martin',
  'Thomas Dubois',
  'Marie Lefebvre',
  'Pierre Garcia',
  'Emma Rodriguez'
];

const BookingForm = ({ service, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: null,
    time: '',
    photographer: '',
    location: '',
    contactPhone: '',
    clientNotes: ''
  });

  const [errors, setErrors] = useState({});

  // Charger les créneaux disponibles quand la date et le photographe changent
  useEffect(() => {
    if (formData.date && formData.photographer) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [formData.date, formData.photographer]);

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const dateStr = formData.date.toISOString().split('T')[0];
      const slots = await bookingService.getAvailableSlots(
        dateStr,
        formData.photographer,
        service._id
      );
      setAvailableSlots(slots);
      
      // Si le créneau sélectionné n'est plus disponible, le désélectionner
      if (formData.time && !slots.includes(formData.time)) {
        setFormData(prev => ({ ...prev, time: '' }));
      }
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
      setAvailableSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    } else if (formData.date <= new Date()) {
      newErrors.date = 'La date doit être dans le futur';
    }

    if (!formData.time) {
      newErrors.time = 'L\'heure est requise';
    }

    if (!formData.photographer) {
      newErrors.photographer = 'Le photographe est requis';
    }

    if (!formData.location || formData.location.trim().length < 5) {
      newErrors.location = 'Le lieu doit contenir au moins 5 caractères';
    }

    if (!formData.contactPhone) {
      newErrors.contactPhone = 'Le numéro de téléphone est requis';
    } else if (!/^[0-9+\-\s\(\)]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Format de téléphone invalide';
    }

    if (formData.clientNotes && formData.clientNotes.length > 500) {
      newErrors.clientNotes = 'Les notes ne peuvent pas dépasser 500 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setConfirmDialogOpen(true);
    }
  };

  const confirmBooking = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const bookingData = {
        serviceId: service._id,
        date: formData.date.toISOString().split('T')[0],
        time: formData.time,
        photographer: formData.photographer,
        location: formData.location.trim(),
        contactPhone: formData.contactPhone.trim(),
        clientNotes: formData.clientNotes.trim()
      };

      await bookingService.createBooking(bookingData);
      
      setSuccess('Réservation créée avec succès ! Un email de confirmation vous a été envoyé.');
      setConfirmDialogOpen(false);
      
      // Notifier le parent du succès après un délai
      setTimeout(() => {
        onSuccess && onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Erreur création réservation:', error);
      setError(error.response?.data?.message || 'Erreur lors de la création de la réservation');
      setConfirmDialogOpen(false);
    }
    setLoading(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (success) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <PhotoCamera sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" color="success.main" gutterBottom>
            Réservation confirmée !
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {success}
          </Typography>
          <Button variant="contained" onClick={() => onSuccess && onSuccess()}>
            Retour à mes réservations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            📸 Réserver votre séance photo
          </Typography>

          {/* Informations du service */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {service.name}
                </Typography>
                <Typography variant="body2">
                  {service.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                <Typography variant="h5" fontWeight="bold">
                  {formatPrice(service.price)}
                </Typography>
                <Typography variant="body2">
                  Durée : {service.duration} minutes
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date de la séance"
                  value={formData.date}
                  onChange={(newValue) => handleInputChange('date', newValue)}
                  minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Minimum demain
                  maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // Maximum 3 mois
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.date}
                      helperText={errors.date}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Photographe */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Photographe"
                  value={formData.photographer}
                  onChange={(e) => handleInputChange('photographer', e.target.value)}
                  error={!!errors.photographer}
                  helperText={errors.photographer}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                  }}
                >
                  {photographers.map((photographer) => (
                    <MenuItem key={photographer} value={photographer}>
                      {photographer}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Créneaux horaires */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 1 }} />
                  Créneaux disponibles
                </Typography>
                
                {loadingSlots ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : formData.date && formData.photographer ? (
                  availableSlots.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {availableSlots.map((slot) => (
                        <Chip
                          key={slot}
                          label={slot}
                          onClick={() => handleInputChange('time', slot)}
                          color={formData.time === slot ? 'primary' : 'default'}
                          variant={formData.time === slot ? 'filled' : 'outlined'}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="warning">
                      Aucun créneau disponible pour cette date et ce photographe
                    </Alert>
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sélectionnez une date et un photographe pour voir les créneaux disponibles
                  </Typography>
                )}
                
                {errors.time && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.time}
                  </Typography>
                )}
              </Grid>

              {/* Lieu */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lieu de la séance"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  error={!!errors.location}
                  helperText={errors.location || 'Adresse complète où aura lieu la séance photo'}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Téléphone */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Numéro de téléphone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  error={!!errors.contactPhone}
                  helperText={errors.contactPhone}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Prix total */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center' }}>
                  <Euro sx={{ mr: 1, color: 'success.dark' }} />
                  <Box>
                    <Typography variant="subtitle2" color="success.dark">
                      Prix total
                    </Typography>
                    <Typography variant="h6" color="success.dark" fontWeight="bold">
                      {formatPrice(service.price)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes complémentaires (optionnel)"
                  value={formData.clientNotes}
                  onChange={(e) => handleInputChange('clientNotes', e.target.value)}
                  error={!!errors.clientNotes}
                  helperText={errors.clientNotes || `${formData.clientNotes.length}/500 caractères`}
                  placeholder="Décrivez vos attentes, le style souhaité, des demandes particulières..."
                />
              </Grid>

              {/* Boutons */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !formData.date || !formData.time || !formData.photographer}
                    startIcon={loading ? <CircularProgress size={20} /> : <PhotoCamera />}
                  >
                    {loading ? 'Réservation...' : 'Réserver maintenant'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {/* Dialog de confirmation */}
          <Dialog open={confirmDialogOpen} onClose={() => !loading && setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Confirmer votre réservation
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                Voulez-vous confirmer cette réservation ?
              </Typography>
              
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Service :</Typography>
                    <Typography variant="body2" fontWeight="bold">{service.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Prix :</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatPrice(service.price)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Date :</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formData.date && formatDate(formData.date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Heure :</Typography>
                    <Typography variant="body2" fontWeight="bold">{formData.time}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Photographe :</Typography>
                    <Typography variant="body2" fontWeight="bold">{formData.photographer}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Lieu :</Typography>
                    <Typography variant="body2">{formData.location}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialogOpen(false)} disabled={loading}>
                Modifier
              </Button>
              <Button onClick={confirmBooking} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Confirmer'}
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default BookingForm;