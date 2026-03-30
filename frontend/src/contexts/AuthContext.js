import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API_ORIGIN = API_URL ? new URL(API_URL).origin : window.location.origin;

const AuthContext = createContext();

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await response.json();
  }

  const text = await response.text();
  return {
    detail: text || 'Unexpected server response'
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const loginWithPassword = useCallback(async ({ email, password }) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await parseResponse(response);
    if (!response.ok) {
      throw new Error(data.detail || 'No se pudo iniciar sesión');
    }

    setUser(data);
    return data;
  }, []);

  const register = useCallback(async ({ name, email, password, clinic_name }) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, clinic_name })
    });

    const data = await parseResponse(response);
    if (!response.ok) {
      throw new Error(data.detail || 'No se pudo crear la cuenta');
    }

    setUser(data);
    return data;
  }, []);

  const startGoogleLogin = useCallback(() => {
    const popup = window.open(
      `${API_URL}/api/auth/google/start?popup=1`,
      'vetflow-google-login',
      'popup=yes,width=520,height=720'
    );

    popup?.focus();
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== API_ORIGIN && event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'vetflow-auth-success') {
        checkAuth();
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithPassword, register, startGoogleLogin, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
