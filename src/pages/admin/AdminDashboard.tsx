
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsersList from "@/components/admin/AdminUsersList";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("users");
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasError, setHasError] = useState(false);
  
  // Extra safety check - if user is not admin, redirect
  useEffect(() => {
    console.log("AdminDashboard - Mounted, isAdmin:", isAdmin, "loading:", loading);
    
    if (isAdmin === false) {
      console.log("AdminDashboard - Not admin, redirecting");
      navigate("/");
    }
  }, [isAdmin, navigate, loading]);

  // Add an error boundary
  useEffect(() => {
    const handleErrors = (error: ErrorEvent) => {
      console.error("AdminDashboard - Caught error:", error.message);
      setHasError(true);
      toast({
        title: "An error occurred",
        description: "There was a problem loading the admin dashboard.",
        variant: "destructive"
      });
    };

    window.addEventListener('error', handleErrors);
    return () => window.removeEventListener('error', handleErrors);
  }, [toast]);

  if (loading) {
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
          <div className="bg-red-500/10 border border-red-500/50 rounded-md p-4 text-white">
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p>There was a problem loading the admin dashboard. Please try again later or contact support.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
