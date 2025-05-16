
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  checkAdminRole: () => Promise<boolean>;
  updateUsername: (username: string) => Promise<void>;
  updatePassword: (newPassword: string, currentPassword: string) => Promise<void>;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  // Fetch user profile function
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      console.log("Profile fetched:", data);
      return data as Profile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const profileData = await fetchUserProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  useEffect(() => {
    console.log("AuthProvider - Initializing auth state listener");
    
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthProvider - Auth state changed:", { 
          event, 
          user: session?.user?.email,
          path: window.location.pathname
        });
        
        // Update auth state synchronously
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user); // Update explicit auth state
        
        // Check if the user is an admin
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole().then(isAdmin => {
              setIsAdmin(isAdmin);
            });
            
            // Fetch profile data
            fetchUserProfile(session.user.id).then(profileData => {
              setProfile(profileData);
            });
          }, 0);
        } else {
          setIsAdmin(false);
          setProfile(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider - Initial session check:", { 
        hasSession: !!session,
        user: session?.user?.email,
        path: window.location.pathname
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user); // Update explicit auth state
      
      // Check if the user is an admin and fetch profile
      if (session?.user) {
        Promise.all([
          checkAdminRole().then(isAdmin => setIsAdmin(isAdmin)),
          fetchUserProfile(session.user.id).then(profileData => setProfile(profileData))
        ]).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider - Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  // Check if the user has admin role
  const checkAdminRole = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  };

  // Add a session refresh function that components can call when needed
  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("AuthProvider - Manual session refresh:", {
        hasSession: !!session,
        user: session?.user?.email
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user); // Update explicit auth state
      
      // Check if the user is an admin
      if (session?.user) {
        const adminStatus = await checkAdminRole();
        setIsAdmin(adminStatus);
        
        // Refresh profile
        const profileData = await fetchUserProfile(session.user.id);
        setProfile(profileData);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("AuthProvider - Error refreshing session:", error);
      return Promise.reject(error);
    }
  };

  // Add username update function
  const updateUsername = async (username: string) => {
    try {
      if (!user) throw new Error("No user logged in");
      
      console.log("AuthProvider - Updating username for:", user.id);
      
      // Update the username in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh profile data
      await refreshProfile();
      
      // Only show toast if no error occurred
      toast({
        title: "Username updated successfully",
      });
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("AuthProvider - Username update error:", error.message);
      // Don't show toast here, pass the error to the component
      return Promise.reject(error);
    }
  };

  // Update password update function to require current password
  const updatePassword = async (newPassword: string, currentPassword: string) => {
    try {
      console.log("AuthProvider - Updating password");

      if (!user || !user.email) {
        throw new Error("No user email found");
      }

      // First verify the current password by attempting a sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error("Current password is incorrect");
      }
      
      // Then update to the new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated successfully",
      });
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("AuthProvider - Password update error:", error.message);
      // Don't show toast here, pass the error to the component
      return Promise.reject(error);
    }
  };
  
  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log("AuthProvider - Attempting signup for:", email);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Account created successfully",
        description: "Please check your email for verification.",
      });
    } catch (error: any) {
      console.error("AuthProvider - Signup error:", error.message);
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("AuthProvider - Attempting signin for:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error("AuthProvider - Signin error:", error.message);
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("AuthProvider - Attempting signout");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false); // Update explicit auth state
      setProfile(null);
      
      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      console.error("AuthProvider - Signout error:", error.message);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated,
    isAdmin,
    checkAdminRole,
    updateUsername,
    updatePassword,
    profile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
