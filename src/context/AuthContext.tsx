
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDocumentVisibilityState } from "@/hooks/useVisibilityChange";

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
  signInWithGoogle: () => Promise<void>;
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

interface AuthProviderProps {
  children: React.ReactNode;
  preventRefreshOnVisibilityChange?: boolean;
}

// Constants for auth state management
const AUTH_REFRESH_DEBOUNCE_MS = 2000; // Minimum time between auth refreshes
const AUTH_REFRESH_COOLDOWN_MS = 5000; // Cooldown period after a session refresh

/**
 * Authentication Context Provider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children, preventRefreshOnVisibilityChange = false }: AuthProviderProps) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Track session refresh state with refs to avoid re-renders
  const isRefreshingSessionRef = useRef(false);
  const lastVisibleTimestampRef = useRef(Date.now());
  const lastSessionRefreshRef = useRef(Date.now() - AUTH_REFRESH_COOLDOWN_MS);
  
  // Session ID to track this browser session
  const sessionIdRef = useRef<string>(`auth_session_${Math.random().toString(36).substring(2, 10)}`);
  
  const { toast } = useToast();

  /**
   * Fetch user profile with memoization
   */
  const fetchUserProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      // Check session storage for cached profile
      const cachedProfile = sessionStorage.getItem(`profile_${userId}`);
      if (cachedProfile) {
        const parsedProfile = JSON.parse(cachedProfile);
        const cacheAge = Date.now() - parsedProfile.timestamp;
        
        // Use cached profile if it's less than 5 minutes old
        if (cacheAge < 1000 * 60 * 5) {
          return parsedProfile.data;
        }
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      // Cache the profile
      sessionStorage.setItem(`profile_${userId}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        sessionId: sessionIdRef.current
      }));
      
      return data as Profile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  }, []);

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const profileData = await fetchUserProfile(user.id);
      if (profileData && JSON.stringify(profileData) !== JSON.stringify(profile)) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  }, [user, profile, fetchUserProfile]);
  
  /**
   * Debounced session refresh function with visibility awareness
   */
  const debouncedRefreshSession = useCallback(async () => {
    const now = Date.now();
    
    // Skip if already refreshing or if we're within the debounce period
    if (isRefreshingSessionRef.current || 
        (now - lastSessionRefreshRef.current < AUTH_REFRESH_DEBOUNCE_MS)) {
      return Promise.resolve();
    }
    
    // Skip if the tab isn't visible - don't waste resources
    if (getDocumentVisibilityState() === 'hidden' && !preventRefreshOnVisibilityChange) {
      return Promise.resolve();
    }
    
    isRefreshingSessionRef.current = true;
    lastVisibleTimestampRef.current = now;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only update if session has changed
      const sessionChanged = 
        (!session && !!user) || 
        (session && !user) || 
        (session?.user?.id !== user?.id);
      
      if (sessionChanged) {
        console.log("AuthProvider - Session state changed during refresh");
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        
        if (session?.user) {
          // Process in non-blocking way
          Promise.all([
            checkAdminRole().then(adminStatus => setIsAdmin(adminStatus)),
            fetchUserProfile(session.user.id).then(profileData => {
              if (profileData && JSON.stringify(profileData) !== JSON.stringify(profile)) {
                setProfile(profileData);
              }
            })
          ]).catch(error => {
            console.error("Error during session refresh: ", error);
          });
        }
      }
      
      lastSessionRefreshRef.current = Date.now();
      return Promise.resolve();
    } catch (error) {
      console.error("AuthProvider - Error refreshing session:", error);
      return Promise.reject(error);
    } finally {
      isRefreshingSessionRef.current = false;
    }
  }, [user, profile, preventRefreshOnVisibilityChange, fetchUserProfile]);

  /**
   * Set up auth state listener and visibility handling
   */
  useEffect(() => {
    console.log("AuthProvider - Initializing auth state listener");
    let unsubVisibility: (() => void) | null = null;
    
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthProvider - Auth state changed:", { 
          event, 
          user: session?.user?.email,
          path: window.location.pathname
        });
        
        // Update auth state synchronously to avoid cascading effects
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        
        // Fetch admin status and profile in a non-blocking way
        if (session?.user) {
          // Use a microtask to avoid blocking the event loop
          Promise.resolve().then(() => {
            // Check if component is still mounted before updating state
            checkAdminRole().then(isAdmin => {
              setIsAdmin(isAdmin);
            });
            
            // Fetch profile data
            fetchUserProfile(session.user.id).then(profileData => {
              setProfile(profileData);
            });
          });
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
      setIsAuthenticated(!!session?.user); 
      
      // Check if the user is an admin and fetch profile
      if (session?.user) {
        Promise.all([
          checkAdminRole().then(isAdmin => setIsAdmin(isAdmin)),
          fetchUserProfile(session.user.id).then(profileData => setProfile(profileData))
        ]).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Add visibility change handler (if not disabled)
    if (!preventRefreshOnVisibilityChange) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          const now = Date.now();
          const timeSinceLastRefresh = now - lastSessionRefreshRef.current;
          
          if (timeSinceLastRefresh > AUTH_REFRESH_COOLDOWN_MS) {
            console.log("AuthProvider - Tab became visible, refreshing auth state");
            
            // Store the timestamp of this visibility change in sessionStorage
            try {
              sessionStorage.setItem('last_visibility_change', now.toString());
              sessionStorage.setItem('is_document_visible', 'true');
            } catch (e) {
              // Ignore storage errors
            }
            
            // Update session if enough time has passed
            debouncedRefreshSession();
          } else {
            console.log("AuthProvider - Tab visibility changed, but in cooldown period");
          }
        } else {
          // Store the hidden state
          try {
            sessionStorage.setItem('is_document_visible', 'false');
          } catch (e) {
            // Ignore storage errors
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      unsubVisibility = () => document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Initialize visibility state
      try {
        sessionStorage.setItem('is_document_visible', 
          document.visibilityState === 'visible' ? 'true' : 'false');
        sessionStorage.setItem('last_visibility_change', Date.now().toString());
      } catch (e) {
        // Ignore storage errors
      }
    }

    return () => {
      console.log("AuthProvider - Unsubscribing from auth state changes");
      subscription.unsubscribe();
      if (unsubVisibility) unsubVisibility();
    };
  }, [preventRefreshOnVisibilityChange, debouncedRefreshSession, fetchUserProfile]);

  /**
   * Check if the user has admin role
   */
  const checkAdminRole = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if we have a cached admin status for this session
      const cachedAdminStatus = sessionStorage.getItem(`admin_status_${user.id}`);
      if (cachedAdminStatus) {
        const parsed = JSON.parse(cachedAdminStatus);
        const cacheAge = Date.now() - parsed.timestamp;
        
        // Use cached status if it's less than 5 minutes old
        if (cacheAge < 1000 * 60 * 5) {
          return parsed.isAdmin;
        }
      }
      
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      // Cache the result
      try {
        sessionStorage.setItem(`admin_status_${user.id}`, JSON.stringify({
          isAdmin: data === true,
          timestamp: Date.now(),
          userId: user.id
        }));
      } catch (e) {
        // Ignore storage errors
      }
      
      return data === true;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  }, [user]);

  /**
   * Refresh session on demand (exported to context)
   */
  const refreshSession = useCallback(async () => {
    return debouncedRefreshSession();
  }, [debouncedRefreshSession]);

  /**
   * Update username
   */
  const updateUsername = useCallback(async (username: string) => {
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
  }, [user, refreshProfile, toast]);

  /**
   * Update password
   */
  const updatePassword = useCallback(async (newPassword: string, currentPassword: string) => {
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
  }, [user, toast]);
  
  /**
   * Sign up a new user
   */
  const signUp = useCallback(async (email: string, password: string, username: string) => {
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
  }, [toast]);

  /**
   * Sign in an existing user
   */
  const signIn = useCallback(async (email: string, password: string) => {
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
  }, [toast]);

  /**
   * Google sign-in
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      console.log("AuthProvider - Attempting Google signin");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) throw error;
      
      // No toast needed here as we're redirecting to Google
      
    } catch (error: any) {
      console.error("AuthProvider - Google signin error:", error.message);
      toast({
        title: "Error signing in with Google",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      console.log("AuthProvider - Attempting signout");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setProfile(null);
      
      // Clear cached data in session storage
      try {
        // List of keys to clear on signout
        const keysToRemove = [];
        
        // Find all auth-related items in sessionStorage  
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.startsWith('profile_') || key.startsWith('admin_status_'))) {
            keysToRemove.push(key);
          }
        }
        
        // Remove them
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      } catch (e) {
        // Ignore storage errors
      }
      
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
  }, [toast]);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
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
