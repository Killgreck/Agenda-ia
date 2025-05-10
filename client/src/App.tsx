import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import Profile from "@/pages/Profile";
import ResetPassword from "@/pages/ResetPassword";
import PrivateChat from "@/pages/PrivateChat";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

function Router() {
  const { user, isLoading, initialAuthCheckComplete } = useAuth();
  const isAuthenticated = !!user;

  // Log routing state for debugging
  useEffect(() => {
    console.log('Router auth state:', { 
      isAuthenticated, 
      isLoading, 
      userId: user?.id,
      initialAuthCheckComplete 
    });
  }, [isAuthenticated, isLoading, user, initialAuthCheckComplete]);

  // Show a loading indicator while performing the initial auth check
  if (isLoading && !initialAuthCheckComplete) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <AuthPage />}
      </Route>
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route path="/reset-password/:token">
        <ResetPassword />
      </Route>
      <ProtectedRoute path="/chat" component={PrivateChat} />
      <Route path="/">
        <Redirect to={isAuthenticated ? "/dashboard" : "/auth"} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  
  // Cargar configuración de tema del localStorage al inicio
  useEffect(() => {
    // Aplicar tema guardado si existe
    const savedTheme = localStorage.getItem('user-theme');
    if (savedTheme) {
      try {
        const themeConfig = JSON.parse(savedTheme);
        
        // Aplicar color primario
        if (themeConfig.primary) {
          document.documentElement.style.setProperty('--primary', themeConfig.primary);
        }
        
        // Aplicar radio de bordes y otros atributos
        if (themeConfig.radius !== undefined) {
          document.documentElement.setAttribute('data-theme-radius', themeConfig.radius.toString());
        }
        
        if (themeConfig.appearance) {
          document.documentElement.setAttribute('data-theme-appearance', themeConfig.appearance);
        }
        
        if (themeConfig.variant) {
          document.documentElement.setAttribute('data-theme-variant', themeConfig.variant);
        }
        
        console.log("Tema cargado desde localStorage:", themeConfig);
      } catch (error) {
        console.error("Error al parsear la configuración del tema:", error);
      }
    }
    
    // Cargar otras preferencias de personalización
    const fontFamily = localStorage.getItem('user-font-family');
    if (fontFamily) {
      document.documentElement.style.setProperty('--font-family', fontFamily);
    }
    
    const fontSize = localStorage.getItem('user-font-size');
    if (fontSize) {
      document.documentElement.style.setProperty('--font-size-base', fontSize);
    }
    
    // Aplicar clases CSS para otros ajustes
    if (localStorage.getItem('compact-mode') === 'true') {
      document.documentElement.classList.add('compact-mode');
    }
    
    if (localStorage.getItem('animations-disabled') === 'true') {
      document.documentElement.classList.add('no-animations');
    }
    
    if (localStorage.getItem('high-contrast') === 'true') {
      document.documentElement.classList.add('high-contrast');
    }
    
  }, []);
  
  // Aplicar temas y configuraciones
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
