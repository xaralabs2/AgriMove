import { useLocation } from 'wouter';
import { useAuth } from '@/auth/authContext';
import { Button } from '@/components/ui/button';

export default function SimpleHomePage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  // If authenticated, redirect to the main app
  navigate('/app');
  return null;
}