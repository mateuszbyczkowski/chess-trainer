import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function FirstVisitRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while auth is loading
    if (isLoading) return;

    // Don't redirect if already on login page
    if (location.pathname === '/login') return;

    // Check if user has ever visited before
    const hasVisited = localStorage.getItem('chess_trainer_has_visited');

    // If first visit and no user, redirect to login
    if (!hasVisited && !user) {
      // Mark as visited so we don't redirect again after they log in/continue as guest
      localStorage.setItem('chess_trainer_has_visited', 'true');
      navigate('/login');
    }
  }, [isLoading, user, location.pathname, navigate]);

  return null;
}
