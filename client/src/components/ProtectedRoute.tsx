import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        await checkAuthStatus();
      }
      setIsChecking(false);
    };

    verifyAuth();
  }, [isAuthenticated, checkAuthStatus]);

  useEffect(() => {
    if (!isChecking && !isLoading && !isAuthenticated && location !== '/auth') {
      setLocation('/auth');
    }
  }, [isChecking, isLoading, isAuthenticated, setLocation, location]);

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

  if (!isAuthenticated && location !== '/auth') {
    return null; // Will redirect to /auth in useEffect
  }

  return <>{children}</>;
}