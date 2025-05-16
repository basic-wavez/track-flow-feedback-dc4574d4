
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsersList from "@/components/admin/AdminUsersList";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("users");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Extra safety check - if user is not admin, redirect
  useEffect(() => {
    if (isAdmin === false) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

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
