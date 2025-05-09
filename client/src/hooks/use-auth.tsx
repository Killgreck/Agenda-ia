import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Definir los tipos para usuarios
export interface User {
  id: number;
  username: string;
  email?: string | null;
  name?: string | null;
  // Añade aquí otros campos de usuario que necesites
}

// Tipo para datos de login
interface LoginData {
  username: string;
  password: string;
}

// Tipo para registro de usuario
interface RegisterData extends LoginData {
  email?: string;
  name?: string;
  // Añade aquí otros campos de registro
}

// Tipo para el contexto de autenticación
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  initialAuthCheckComplete: boolean;
}

// Crear contexto para la autenticación
export const AuthContext = createContext<AuthContextType | null>(null);

// API para hacer llamadas al backend
async function apiRequest(
  method: string,
  url: string,
  data?: Record<string, any>
) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Importante para cookies/sesiones
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Error en la solicitud",
    }));
    throw new Error(errorData.message || "Error en la solicitud");
  }

  return response;
}

// Componente proveedor de autenticación
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Consulta para obtener el usuario actual
  const {
    data: user,
    error,
    isLoading,
    isSuccess,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/user");
        // Si el usuario está autenticado, devolvemos sus datos
        return await response.json();
      } catch (error) {
        // Si recibimos un 401, simplemente devolvemos null (no autenticado)
        if (error instanceof Error && error.message.includes("401")) {
          return null;
        }
        throw error;
      }
    },
  });

  // Mutación para el inicio de sesión
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: User) => {
      // Actualizar la caché con el usuario autenticado
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para el registro de usuario
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (userData: User) => {
      // Actualizar la caché con el usuario recién registrado
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registro exitoso",
        description: `¡Bienvenido a AgendaIA, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error en el registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para el cierre de sesión
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Limpiar datos del usuario en caché
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Efecto para logging del estado de autenticación (para debugging)
  useEffect(() => {
    if (isSuccess) {
      console.log("Authentication state changed:", { isAuthenticated: !!user });
      console.log("Initial auth check completed with result:", !!user);
    }
  }, [user, isSuccess]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        initialAuthCheckComplete: isSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}