import { useState, useEffect } from 'react';
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
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Password validation regex patterns
const passwordLengthRegex = /.{8,}/; // At least 8 characters
const passwordUppercaseRegex = /[A-Z]/; // At least one uppercase letter
const passwordLowercaseRegex = /[a-z]/; // At least one lowercase letter
const passwordNumberRegex = /[0-9]/; // At least one number
const passwordSpecialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/; // At least one special character

// Custom password validation
const passwordValidation = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (password) => passwordUppercaseRegex.test(password),
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (password) => passwordLowercaseRegex.test(password),
    { message: 'Password must contain at least one lowercase letter' }
  )
  .refine(
    (password) => passwordNumberRegex.test(password),
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (password) => passwordSpecialCharRegex.test(password),
    { message: 'Password must contain at least one special character' }
  );

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string(), // For login, we don't enforce the strict rules
});

// Signup form schema
const signupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .refine(
      (username) => /^[a-zA-Z0-9_]+$/.test(username),
      { message: 'Username can only contain letters, numbers, and underscores' }
    ),
  password: passwordValidation,
  confirmPassword: z.string(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Component to check and display password strength requirements
interface PasswordStrengthIndicatorProps {
  password: string;
}

function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const hasMinLength = passwordLengthRegex.test(password);
  const hasUppercase = passwordUppercaseRegex.test(password);
  const hasLowercase = passwordLowercaseRegex.test(password);
  const hasNumber = passwordNumberRegex.test(password);
  const hasSpecialChar = passwordSpecialCharRegex.test(password);
  
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar]
    .filter(Boolean).length;
  
  const strengthLevel = 
    strengthScore === 0 ? 'Very Weak' :
    strengthScore === 1 ? 'Weak' :
    strengthScore === 2 ? 'Fair' :
    strengthScore === 3 ? 'Good' :
    strengthScore === 4 ? 'Strong' :
    'Very Strong';
  
  const strengthColor = 
    strengthScore < 2 ? 'bg-red-500' :
    strengthScore < 4 ? 'bg-yellow-500' :
    'bg-green-500';
  
  return (
    <div className="mt-2 space-y-2">
      <div className="text-sm">Password Strength: <span className="font-medium">{strengthLevel}</span></div>
      
      <div className="h-1.5 w-full bg-gray-200 rounded-full">
        <div 
          className={`h-1.5 rounded-full ${strengthColor}`}
          style={{ width: `${(strengthScore / 5) * 100}%` }}
        ></div>
      </div>
      
      <ul className="space-y-1 text-xs mt-2">
        <li className={`flex items-center ${hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-1 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
            {hasMinLength ? '✓' : '○'}
          </span>
          At least 8 characters
        </li>
        <li className={`flex items-center ${hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-1 ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
            {hasUppercase ? '✓' : '○'}
          </span>
          At least one uppercase letter
        </li>
        <li className={`flex items-center ${hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-1 ${hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
            {hasLowercase ? '✓' : '○'}
          </span>
          At least one lowercase letter
        </li>
        <li className={`flex items-center ${hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-1 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
            {hasNumber ? '✓' : '○'}
          </span>
          At least one number
        </li>
        <li className={`flex items-center ${hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={`mr-1 ${hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
            {hasSpecialChar ? '✓' : '○'}
          </span>
          At least one special character
        </li>
      </ul>
    </div>
  );
}

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

// Schema for password recovery form
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function Auth() {
  const { login, signup, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // States to control password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  // State for email verification status
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  
  // Check for verification status in URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get('verificationStatus');
    if (status) {
      setVerificationStatus(status);
      
      if (status === 'success') {
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified. You can now log in.",
          variant: "default"
        });
      } else if (status === 'failed') {
        const reason = searchParams.get('reason') || 'unknown';
        let message = "Failed to verify your email.";
        
        if (reason === 'invalid') {
          message = "Invalid or expired verification token.";
        } else if (reason === 'server') {
          message = "Server error occurred during verification.";
        }
        
        toast({
          title: "Verification Failed",
          description: message,
          variant: "destructive"
        });
      }
    }
  }, [toast]);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for password recovery modal
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

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

  // Password recovery form
  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });
  
  // Handle password recovery form submission
  const onForgotPasswordSubmit = async (data: ForgotPasswordValues) => {
    setIsSubmittingReset(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: data.email })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setResetEmailSent(true);
        toast({
          title: "Email Sent",
          description: "If the address exists in our system, you will receive a link to reset your password.",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Could not process your request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      toast({
        title: "Error",
        description: "Error connecting to the server",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReset(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Email Verification Status Banner */}
      {verificationStatus === 'success' && (
        <div className="fixed top-0 left-0 right-0 bg-green-100 border-b border-green-200 px-4 py-3 text-green-700 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>Your email has been successfully verified. You can now log in.</span>
        </div>
      )}
      
      {/* Password Recovery Modal */}
      <Dialog open={forgotPasswordModalOpen} onOpenChange={setForgotPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address to receive password reset instructions.
            </DialogDescription>
          </DialogHeader>
          
          {resetEmailSent ? (
            <div className="py-6 text-center">
              <h3 className="text-lg font-medium text-green-600 mb-2">Email Sent!</h3>
              <p className="text-sm text-muted-foreground">
                If the address exists in our system, you will receive a link to reset your password.
                Please check your inbox (and spam folder).
              </p>
            </div>
          ) : (
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your@email.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setForgotPasswordModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingReset}
                  >
                    {isSubmittingReset ? "Sending..." : "Send Link"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
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
                        // Show password recovery modal
                        setForgotPasswordModalOpen(true);
                      }}
                    >
                      Forgot your password?
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
                        {/* Password Strength Indicator */}
                        <PasswordStrengthIndicator password={field.value} />
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