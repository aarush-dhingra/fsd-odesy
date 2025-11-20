import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (!response.ok) {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [API_BASE_URL]);

  const login = async (email, password, role, rememberMe = false) => {
    try {
      setLoading(true);
      
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, role }),
        });
      } catch (networkError) {
        // Handle network errors (connection refused, etc.)
        if (networkError.message.includes('Failed to fetch') || networkError.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error(`Cannot connect to server. Please make sure the backend is running on ${API_BASE_URL}`);
        }
        throw networkError;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server. Please check if the backend is running correctly.');
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed: ${response.status} ${response.statusText}`);
      }

      const { token: authToken, user: userData } = data.data;

      // Verify user role matches requested role
      if (userData.role !== role) {
        throw new Error(`Invalid role. Expected ${role}, got ${userData.role}`);
      }

      setToken(authToken);
      setUser(userData);

      if (rememberMe) {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('token', authToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
      }

      toast.success(`Welcome back, ${userData.name}!`);
      
      // Navigate based on role
      if (userData.role === 'student') {
        navigate('/student/dashboard');
      } else if (userData.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/dashboard');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role) => {
    try {
      setLoading(true);
      
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, fullName: name, email, password, role }),
        });
      } catch (networkError) {
        // Handle network errors (connection refused, etc.)
        if (networkError.message.includes('Failed to fetch') || networkError.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error(`Cannot connect to server. Please make sure the backend is running on ${API_BASE_URL}`);
        }
        throw networkError;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server. Please check if the backend is running correctly.');
      }

      if (!response.ok) {
        throw new Error(data.message || `Registration failed: ${response.status} ${response.statusText}`);
      }

      toast.success('Account created successfully! Please login.');
      navigate(`/login/${role}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

