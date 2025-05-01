import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Signup form schema
const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export default function Auth() {
  const { login, signup, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados para controlar la visibilidad de las contraseñas
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Signup form
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      name: '',
    },
  });

  // Handle login submission
  const onLoginSubmit = async (data: LoginValues) => {
    try {
      console.log('Starting login process for:', data.username);
      const success = await login(data.username, data.password);
      console.log('Login result:', success);
      
      if (success) {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        });
        
        // Add a small delay before redirecting to ensure state updates have propagated
        setTimeout(() => {
          console.log('Redirecting to dashboard after successful login');
          setLocation('/dashboard');
        }, 500);
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid username or password. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast({
        title: 'Login error',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle signup submission
  const onSignupSubmit = async (data: SignupValues) => {
    try {
      console.log('Starting signup process for:', data.username);
      const success = await signup(data.username, data.password, data.email, data.name);
      console.log('Signup result:', success);
      
      if (success) {
        toast({
          title: 'Account created!',
          description: 'Your account has been created successfully.',
        });
        
        // Add a small delay before redirecting to ensure state updates have propagated
        setTimeout(() => {
          console.log('Redirecting to dashboard after successful signup');
          setLocation('/dashboard');
        }, 500);
      } else {
        toast({
          title: 'Signup failed',
          description: 'Username may already exist or there was a server error.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during signup:', error);
      toast({
        title: 'Signup error',
        description: 'An error occurred during signup. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Calendar
          </CardTitle>
          <CardDescription className="text-lg">
            Your intelligent productivity companion
          </CardDescription>
        </CardHeader>
        <Tabs 
          defaultValue="login" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          {/* Login Form */}
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-4 pt-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showLoginPassword ? "text" : "password"} 
                              placeholder="Enter your password" 
                              {...field} 
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
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-sm text-muted-foreground hover:text-primary"
                      type="button"
                      onClick={() => {
                        // Mostrar modal de recuperación de contraseña o redirigir a una página
                        setForgotPasswordModalOpen(true);
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Signup Form */}
          <TabsContent value="signup">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)}>
                <CardContent className="space-y-4 pt-4">
                  <FormField
                    control={signupForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your unique username to login with
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showSignupPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              tabIndex={-1}
                            >
                              {showSignupPassword ? (
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
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm your password" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? (
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
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormDescription>
                          Used for password recovery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}