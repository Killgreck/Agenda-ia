import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/Auth";
import Profile from "@/pages/Profile";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  // Log routing state for debugging
  useEffect(() => {
    console.log('Router auth state:', { 
      isAuthenticated, 
      isLoading, 
      userId: user?.id,
      initialAuthCheckComplete 
    });
  }, [isAuthenticated, isLoading, user, initialAuthCheckComplete]);

  // Mark initial check as complete after the first render cycle
  useEffect(() => {
    if (!isLoading && !initialAuthCheckComplete) {
      setInitialAuthCheckComplete(true);
    }
  }, [isLoading, initialAuthCheckComplete]);

  // Show a loading indicator while performing the initial auth check
  if (isLoading && !initialAuthCheckComplete) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <AuthPage />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <Redirect to={isAuthenticated ? "/dashboard" : "/auth"} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { checkAuthStatus, isAuthenticated } = useAuth();
  
  // Check authentication status when the app loads
  useEffect(() => {
    console.log("App mounted - checking authentication status");
    checkAuthStatus()
      .then(result => {
        console.log("Initial auth check completed with result:", result);
      })
      .catch(error => {
        console.error("Error during initial auth check:", error);
      });
  }, [checkAuthStatus]);
  
  // Log auth state changes
  useEffect(() => {
    console.log("Authentication state changed:", { isAuthenticated });
  }, [isAuthenticated]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
