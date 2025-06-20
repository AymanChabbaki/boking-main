import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  PhotoCamera,
  CheckCircle,
  Home,
  Store
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import BookingForm from './BookingForm';

const steps = [
  'Sélection du service',
  'Informations de réservation',
  'Confirmation'
];

const Booking = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(1); // Étape 1: formulaire de réservation
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Charger le service
  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    if (!serviceId) {
      setError('ID de service manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await serviceService.getServiceById(serviceId);
      setService(response.data);
    } catch (error) {
      console.error('Erreur chargement service:', error);
      setError(error.response?.data?.message || 'Service non trouvé');
    }
    setLoading(false);
  };

  // Vérifier l'authentification
  useEffect(() => {
    if (!user) {
      // Rediriger vers la connexion avec l'URL de retour
      const currentPath = location.pathname;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [user, navigate, location]);

  const handleBookingSuccess = () => {
    setActiveStep(2); // Étape de confirmation
    setBookingSuccess(true);
    
    // Rediriger vers le dashboard après 3 secondes
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handleCancel = () => {
    navigate('/services');
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Vous devez être connecté pour effectuer une réservation.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/services')}
        >
          Retour aux services
        </Button>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Service non trouvé
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/services')}
        >
          Retour aux services
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Home sx={{ mr: 0.5, fontSize: 20 }} />
          Accueil
        </Link>
        <Link
          color="inherit"
          href="/services"
          onClick={(e) => {
            e.preventDefault();
            navigate('/services');
          }}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Store sx={{ mr: 0.5, fontSize: 20 }} />
          Services
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <PhotoCamera sx={{ mr: 0.5, fontSize: 20 }} />
          Réservation
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleCancel}
          sx={{ mb: 2 }}
        >
          Retour aux services
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Réserver une séance photo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complétez votre réservation en quelques étapes simples
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep || bookingSuccess}>
              <StepLabel>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Contenu principal */}
      {activeStep === 1 && !bookingSuccess && (
        <BookingForm
          service={service}
          onSuccess={handleBookingSuccess}
          onCancel={handleCancel}
        />
      )}

      {activeStep === 2 && bookingSuccess && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircle 
              sx={{ 
                fontSize: 80, 
                color: 'success.main', 
                mb: 3,
                animation: 'pulse 2s infinite'
              }} 
            />
            <Typography variant="h4" color="success.main" gutterBottom>
              🎉 Réservation confirmée !
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Merci {user.name} !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Votre réservation pour <strong>{service.name}</strong> a été enregistrée avec succès. 
              Vous allez recevoir un email de confirmation avec tous les détails.
            </Typography>
            
            <Box sx={{ 
              bgcolor: 'success.light', 
              p: 3, 
              borderRadius: 2, 
              mb: 4,
              maxWidth: 400,
              mx: 'auto'
            }}>
              <Typography variant="h6" color="success.contrastText" gutterBottom>
                📧 Prochaines étapes
              </Typography>
              <Typography variant="body2" color="success.contrastText">
                • Vérifiez votre boîte email<br/>
                • Notre équipe vous contactera sous 24h<br/>
                • Préparez-vous pour votre séance !
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
                size="large"
              >
                Voir mes réservations
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/services')}
                size="large"
              >
                Réserver une autre séance
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
              Redirection automatique vers votre tableau de bord dans quelques secondes...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Informations service (sidebar fixe) */}
      {activeStep === 1 && !bookingSuccess && (
        <Card sx={{ mt: 4, position: 'sticky', top: 20 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Récapitulatif
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {service.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {service.type}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {service.description}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Durée :</Typography>
              <Typography variant="body2" fontWeight="bold">
                {service.duration} minutes
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Prix :</Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(service.price)}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                💡 <strong>Bon à savoir :</strong><br/>
                • Modification gratuite jusqu'à 24h avant<br/>
                • Annulation possible selon nos conditions<br/>
                • Paiement sur place le jour J
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Style pour l'animation pulse */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default Booking;