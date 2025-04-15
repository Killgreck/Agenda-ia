import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuthStatus, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [location, setLocation] = useLocation();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  // Log the authentication state for debugging
  useEffect(() => {
    console.log('ProtectedRoute auth state:', { 
      isAuthenticated, 
      isLoading, 
      isChecking, 
      userId: user?.id,
      currentLocation: location 
    });
  }, [isAuthenticated, isLoading, isChecking, user, location]);

  // First effect: Check auth status when component mounts or auth state changes
  useEffect(() => {
    const verifyAuth = async () => {
      console.log('Verifying authentication...');
      if (!isAuthenticated) {
        try {
          const authResult = await checkAuthStatus();
          console.log('Auth check result:', authResult);
        } catch (error) {
          console.error('Auth check error:', error);
        }
      }
      setIsChecking(false);
    };

    verifyAuth();
  }, [isAuthenticated, checkAuthStatus]);

  // Second effect: Handle redirects after auth check is complete
  useEffect(() => {
    // Only redirect if we're not already on the auth page and all checks are complete
    if (!isChecking && !isLoading && !isAuthenticated && location !== '/auth' && !redirectAttempted) {
      console.log('Redirecting to auth page');
      setRedirectAttempted(true);
      setLocation('/auth');
    }
  }, [isChecking, isLoading, isAuthenticated, setLocation, location, redirectAttempted]);

  // Show loading indicator while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and not on auth page
  if (!isAuthenticated && location !== '/auth') {
    console.log('Not authenticated, redirecting to auth page');
    return null; // Will redirect to /auth in useEffect
  }

  // User is authenticated, render children
  return <>{children}</>;
}