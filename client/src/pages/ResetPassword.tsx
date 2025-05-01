import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Esquema de validación para el formulario
const resetPasswordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();
  
  // Extraer el token de la URL
  useEffect(() => {
    const path = window.location.pathname;
    const tokenMatch = /\/reset-password\/([^\/]+)/.exec(path);
    if (tokenMatch && tokenMatch[1]) {
      setToken(tokenMatch[1]);
    } else {
      // Si no hay token, redirigir a la página de inicio de sesión
      toast({
        title: "Error",
        description: "Token de restablecimiento no válido o ausente",
        variant: "destructive"
      });
      navigate("/auth");
    }
  }, [navigate, toast]);
  
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });
  
  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      toast({
        title: "Error",
        description: "Token de restablecimiento no válido",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          newPassword: data.password
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setResetSuccess(true);
        toast({
          title: "Éxito",
          description: "Tu contraseña ha sido restablecida correctamente"
        });
        
        // Redirigir a la página de inicio de sesión después de 3 segundos
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al restablecer la contraseña",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al conectar con el servidor",
        variant: "destructive"
      });
      console.error("Error al restablecer la contraseña:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription>
            Crea una nueva contraseña para tu cuenta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {resetSuccess ? (
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                ¡Contraseña restablecida!
              </h3>
              <p className="text-sm text-muted-foreground">
                Tu contraseña ha sido actualizada correctamente. Serás redirigido a la página de inicio de sesión.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Mínimo 8 caracteres" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirma tu nueva contraseña" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Procesando..." : "Restablecer contraseña"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            onClick={() => navigate("/auth")}
          >
            Volver a iniciar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}