
import { supabase } from "@/integrations/supabase/client";

export interface UserEmailResult {
  user_id: string;
  email: string;
}

export interface UserDetailsResult {
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export async function getUserEmails() {
  try {
    console.log("adminHelpers - Fetching user emails");
    const { data, error } = await supabase.rpc('get_user_emails_for_admin');
    
    if (error) {
      console.error("Error fetching user emails:", error);
      throw error;
    }
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid response format for user emails:", data);
      return []; // Return an empty array instead of throwing
    }
    
    console.log(`adminHelpers - Successfully fetched ${data.length} user emails`);
    return data as UserEmailResult[];
  } catch (error) {
    console.error("Failed to fetch user emails:", error);
    // Return empty array instead of re-throwing to prevent component crashing
    return [];
  }
}

export async function getUserDetails(userId: string) {
  try {
    console.log(`adminHelpers - Fetching details for user ${userId}`);
    const { data, error } = await supabase.rpc('get_user_details_for_admin', {
      user_id: userId
    });
    
    if (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No data returned for user details");
      throw new Error("No user details found");
    }
    
    console.log("adminHelpers - Successfully fetched user details");
    // Cast to unknown first, then to our expected interface
    return data as unknown as UserDetailsResult;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    // Return a placeholder object instead of re-throwing
    return {
      email: "Error loading email",
      created_at: new Date().toISOString(),
      last_sign_in_at: null,
      email_confirmed_at: null
    };
  }
}
