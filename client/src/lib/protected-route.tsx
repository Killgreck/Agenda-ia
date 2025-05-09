import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        // Mostrar spinner de carga mientras verificamos la autenticación
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redireccionar al login si el usuario no está autenticado
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Renderizar el componente si el usuario está autenticado
        return <Component />;
      }}
    </Route>
  );
}