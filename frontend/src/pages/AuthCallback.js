import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          console.error('No session_id found in URL');
          navigate('/');
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for session token
        const response = await fetch(`${API_URL}/api/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const userData = await response.json();
        login(userData);

        // Seed initial data
        try {
          await fetch(`${API_URL}/api/seed`, {
            method: 'POST',
            credentials: 'include'
          });
        } catch (e) {
          console.log('Seed data may already exist');
        }

        // Redirect to dashboard with user data
        navigate('/dashboard', { state: { user: userData } });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, login]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Iniciando sesión...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
