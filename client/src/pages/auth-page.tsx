import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";

// Esquema de validación para el formulario de login
const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

// Esquema de validación para el formulario de registro
const registerSchema = z.object({
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(20, "El nombre de usuario no puede tener más de 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "El usuario solo puede contener letras, números y guiones bajos"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "La contraseña debe contener al menos un carácter especial"),
  email: z.string().email("Ingresa un correo electrónico válido").optional(),
  name: z.string().optional(),
});

// Función auxiliar para aplicar el tema púrpura
const applyTheme = () => {
  // Establecer tema púrpura en caso de que el tema del sistema no se aplique correctamente
  document.documentElement.style.setProperty('--primary', '265 89% 66%');
  document.documentElement.style.setProperty('--primary-foreground', '0 0% 100%');
};

export default function AuthPage() {
  // Aplicar tema al cargar el componente
  React.useEffect(() => {
    applyTheme();
  }, []);
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, initialAuthCheckComplete } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  
  // Estados para mostrar/ocultar contraseñas
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Si el usuario ya está autenticado, redirigir a la página principal
  useEffect(() => {
    if (initialAuthCheckComplete && user) {
      navigate("/");
    }
  }, [user, navigate, initialAuthCheckComplete]);

  // Configuración del formulario de login
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Configuración del formulario de registro
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      name: "",
    },
  });

  // Manejar envío del formulario de login
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Manejar envío del formulario de registro
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Formulario - Lado izquierdo */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              AgendaIA
            </h1>
            <p className="text-gray-600">Tu asistente inteligente personal</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm font-medium">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-medium">Registrarse</TabsTrigger>
              </TabsList>

          {/* Contenido de Login */}
          <TabsContent value="login">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">
                  Iniciar Sesión
                </CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para acceder a tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuario</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="usuario"
                              {...field}
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showLoginPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                disabled={loginMutation.isPending}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                tabIndex={-1}
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col">
                <div className="text-sm text-center mt-2">
                  ¿No tienes una cuenta?{" "}
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => setActiveTab("register")}
                  >
                    Regístrate
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Contenido de Registro */}
          <TabsContent value="register">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">
                  Crear Cuenta
                </CardTitle>
                <CardDescription>
                  Ingresa los datos para registrarte en AgendaIA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuario</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="usuario"
                              {...field}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@ejemplo.com"
                              {...field}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Tu nombre"
                              {...field}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showRegisterPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                disabled={registerMutation.isPending}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                tabIndex={-1}
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registrando..." : "Registrarse"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col">
                <div className="text-sm text-center mt-2">
                  ¿Ya tienes una cuenta?{" "}
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => setActiveTab("login")}
                  >
                    Inicia sesión
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hero - Lado derecho */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#8B5CF6] to-[#4F46E5] text-white p-10 flex-col justify-center relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white opacity-5 rounded-full"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-white opacity-5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
        
        <div className="max-w-xl relative z-10">
          <div className="mb-2 text-purple-200">PLATAFORMA DE PRODUCTIVIDAD</div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">Bienvenido a AgendaIA</h1>
          <p className="text-xl mb-10 text-purple-100">
            Tu asistente inteligente para la gestión diaria de tareas y productividad.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start bg-white/10 p-4 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/20">
              <div className="bg-white/30 p-3 rounded-lg mr-4 shadow-inner">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Organiza tus tareas</h3>
                <p className="text-purple-100">Gestiona tu tiempo de forma inteligente con ayuda de IA</p>
              </div>
            </div>
            
            <div className="flex items-start bg-white/10 p-4 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/20">
              <div className="bg-white/30 p-3 rounded-lg mr-4 shadow-inner">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Optimiza tu rendimiento</h3>
                <p className="text-purple-100">Recibe sugerencias personalizadas para mejorar tu productividad</p>
              </div>
            </div>
            
            <div className="flex items-start bg-white/10 p-4 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/20">
              <div className="bg-white/30 p-3 rounded-lg mr-4 shadow-inner">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">No pierdas el tiempo</h3>
                <p>Configuración de recordatorios y seguimiento de tus objetivos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}