import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';

// Configuration axios
const API_BASE_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('booking_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Actions du reducer
const authActions = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer pour gérer l'état d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      };

    case authActions.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };

    case authActions.LOGOUT:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };

    case authActions.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case authActions.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    default:
      return state;
  }
};

// État initial
const initialState = {
  loading: true, // Commence en loading pour vérifier l'auth
  isAuthenticated: false,
  user: null,
  token: null,
  error: null
};

// Context
const AuthContext = createContext();

// Provider du context
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Intercepteur pour gérer les erreurs d'authentification
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && state.isAuthenticated) {
          // Token expiré ou invalide
          localStorage.removeItem('booking_token');
          localStorage.removeItem('booking_user');
          dispatch({ type: authActions.LOGOUT });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [state.isAuthenticated]);

  // Vérifier l'authentification au chargement - UNE SEULE FOIS
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('booking_token');
      const storedUser = localStorage.getItem('booking_user');

      if (token && storedUser) {
        try {
          // Vérifier la validité du token
          const response = await api.get('/auth/verify-token');
          
          if (response.data.success) {
            dispatch({
              type: authActions.LOGIN_SUCCESS,
              payload: {
                user: response.data.data.user,
                token: token
              }
            });
          } else {
            // Token invalide
            localStorage.removeItem('booking_token');
            localStorage.removeItem('booking_user');
            dispatch({ type: authActions.LOGOUT });
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          localStorage.removeItem('booking_token');
          localStorage.removeItem('booking_user');
          dispatch({ type: authActions.LOGOUT });
        }
      } else {
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    };

    // Exécuter seulement au montage du composant
    initializeAuth();
  }, []); // Dépendance vide = exécute seulement au montage

  // Fonction de connexion
  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { token, data } = response.data;
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('booking_token', token);
        localStorage.setItem('booking_user', JSON.stringify(data.user));

        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: {
            user: data.user,
            token: token
          }
        });

        return { success: true, data: data.user };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la connexion';
      dispatch({
        type: authActions.SET_ERROR,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fonction d'inscription
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        const { token, data } = response.data;
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('booking_token', token);
        localStorage.setItem('booking_user', JSON.stringify(data.user));

        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: {
            user: data.user,
            token: token
          }
        });

        return { success: true, data: data.user };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'inscription';
      dispatch({
        type: authActions.SET_ERROR,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fonction de déconnexion
  const logout = useCallback(async () => {
    try {
      // Appeler l'API de déconnexion si possible
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion côté serveur:', error);
    } finally {
      // Nettoyer le stockage local et l'état
      localStorage.removeItem('booking_token');
      localStorage.removeItem('booking_user');
      dispatch({ type: authActions.LOGOUT });
    }
  }, []);

  // ✅ FONCTION CORRIGÉE : Mise à jour du profil
  const updateProfile = useCallback(async (userData) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      console.log('📤 Envoi des données de profil:', userData);

      const response = await api.put('/auth/profile', userData);

      console.log('📥 Réponse du serveur:', response.data);

      if (response.data.success) {
        // ✅ CORRECTION : Lire correctement la réponse du serveur
        // Soit response.data.user, soit response.data.data.user selon le backend
        const updatedUser = response.data.user || response.data.data?.user;
        
        if (!updatedUser) {
          console.error('❌ Utilisateur mis à jour non trouvé dans la réponse');
          throw new Error('Réponse invalide du serveur');
        }

        console.log('✅ Utilisateur mis à jour:', updatedUser);
        
        // Mettre à jour le stockage local
        localStorage.setItem('booking_user', JSON.stringify(updatedUser));
        
        dispatch({
          type: authActions.UPDATE_USER,
          payload: updatedUser
        });

        dispatch({ type: authActions.SET_LOADING, payload: false });
        return { success: true, data: updatedUser };
      } else {
        throw new Error(response.data.message || 'Réponse non-success du serveur');
      }
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour';
      dispatch({
        type: authActions.SET_ERROR,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fonction de changement de mot de passe
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      });

      if (response.data.success) {
        dispatch({ type: authActions.SET_LOADING, payload: false });
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      dispatch({
        type: authActions.SET_ERROR,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fonction de demande de réinitialisation de mot de passe
  const forgotPassword = useCallback(async (email) => {
    try {
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await api.post('/auth/forgot-password', { email });

      if (response.data.success) {
        dispatch({ type: authActions.SET_LOADING, payload: false });
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la demande de réinitialisation';
      dispatch({
        type: authActions.SET_ERROR,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fonction pour effacer les erreurs
  const clearError = useCallback(() => {
    dispatch({ type: authActions.CLEAR_ERROR });
  }, []);

  // Valeur du context
  const value = {
    // État
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    clearError,
    
    // Utilitaires
    isAdmin: state.user?.role === 'admin',
    isClient: state.user?.role === 'client',
    api // Exposer l'instance axios configurée
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;