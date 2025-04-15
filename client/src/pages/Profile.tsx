import { useState } from "react";
import UserProfile from "@/components/UserProfile";
import Header from "@/components/Header";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [returningToDashboard, setReturningToDashboard] = useState(false);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Authentication required",
      description: "Please log in to access your profile",
      variant: "destructive",
    });
    navigate("/auth");
    return null;
  }

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setReturningToDashboard(true);
    navigate("/");
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <Button 
              onClick={handleBackToDashboard}
              variant="outline"
              disabled={returningToDashboard}
            >
              {returningToDashboard ? "Returning..." : "Back to Dashboard"}
            </Button>
          </div>
          <UserProfile />
        </div>
      </main>
    </div>
  );
}