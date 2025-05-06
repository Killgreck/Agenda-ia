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
import { Eye, EyeOff } from "lucide-react";

// Password validation regex patterns
const passwordLengthRegex = /.{8,}/; // At least 8 characters
const passwordUppercaseRegex = /[A-Z]/; // At least one uppercase letter
const passwordLowercaseRegex = /[a-z]/; // At least one lowercase letter
const passwordNumberRegex = /[0-9]/; // At least one number
const passwordSpecialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/; // At least one special character

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

// Validation schema for the form
const resetPasswordSchema = z.object({
  password: passwordValidation,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  
  // Extract token from URL
  useEffect(() => {
    const path = window.location.hash || window.location.pathname;
    const tokenMatch = /\/reset-password\/([^\/]+)/.exec(path);
    if (tokenMatch && tokenMatch[1]) {
      setToken(tokenMatch[1]);
    } else {
      // If there's no token, redirect to login page
      toast({
        title: "Error",
        description: "Invalid or missing reset token",
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
        description: "Invalid reset token",
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
          title: "Success",
          description: "Your password has been reset successfully"
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        toast({
          title: "Error",
          description: result.message || "Error resetting password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error connecting to the server",
        variant: "destructive"
      });
      console.error("Error resetting password:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {resetSuccess ? (
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                Password Reset!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your password has been updated successfully. You will be redirected to the login page.
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
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Strong password required" 
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
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
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Confirm your new password" 
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
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Reset Password"}
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
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}