
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/errorHandler";

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
      return []; // Return empty array instead of throwing
    }
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid response format for user emails:", data);
      return []; // Return an empty array
    }
    
    console.log(`adminHelpers - Successfully fetched ${data.length} user emails`);
    return data as UserEmailResult[];
  } catch (error) {
    console.error("Failed to fetch user emails:", error);
    return []; // Return empty array to prevent component crashing
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
      throw new Error(`Failed to fetch user details: ${error.message}`);
    }
    
    if (!data) {
      console.error("No data returned for user details");
      throw new Error("No user details found");
    }
    
    // Validate the created_at date
    if (data.created_at) {
      try {
        // Check if it's a valid date
        new Date(data.created_at).toISOString();
      } catch (e) {
        // If not valid, assign current date
        console.error("Invalid created_at date, using current date instead");
        data.created_at = new Date().toISOString();
      }
    } else {
      data.created_at = new Date().toISOString();
    }
    
    console.log("adminHelpers - Successfully fetched user details");
    return data as unknown as UserDetailsResult;
  } catch (error: any) {
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
