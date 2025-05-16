
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsersList from "@/components/admin/AdminUsersList";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("users");
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Only check auth status during initial mount
  useEffect(() => {
    if (loading) return;
    
    console.log("AdminDashboard - Auth check complete:", { 
      isAdmin, 
      user: user?.email || "No user" 
    });

    setIsInitialized(true);
    
    // Only navigate away if we're not loading and we know the user is not an admin
    if (isAdmin === false) {
      console.log("AdminDashboard - Not admin, redirecting");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [loading, isAdmin, user, navigate, toast]);

  // Add an error boundary
  useEffect(() => {
    const handleErrors = (error: ErrorEvent) => {
      console.error("AdminDashboard - Caught error:", error.message);
      setHasError(true);
      setErrorMessage(error.message || "There was a problem loading the admin dashboard.");
      toast({
        title: "An error occurred",
        description: "There was a problem loading the admin dashboard.",
        variant: "destructive"
      });
    };

    window.addEventListener('error', handleErrors);
    return () => window.removeEventListener('error', handleErrors);
  }, [toast]);

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage(null);
    window.location.reload();
  };

  // Show loading state while determining authorization
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-wip-dark flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-wip-dark flex flex-col">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2 text-white">Admin Dashboard</h1>
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>
              {errorMessage || "There was a problem loading the admin dashboard. Please try again."}
            </AlertDescription>
            <Button onClick={handleRetry} className="mt-4" variant="outline" size="sm">
              <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }
  
  // If we made it here, we know the user is an admin and we're ready to show the dashboard
  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full mb-24">
        <h1 className="text-3xl font-bold mb-2 text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mb-6">
          Manage users and view platform analytics
        </p>
        
        <Tabs 
          defaultValue="users" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <AdminUsersList />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
