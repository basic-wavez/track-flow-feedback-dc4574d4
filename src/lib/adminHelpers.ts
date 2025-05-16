
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
    
    // Cast the data to an object and access properties safely
    const userDetails = data as Record<string, any>;
    
    // Validate and ensure the created_at date
    let safeCreatedAt = new Date().toISOString(); // Default value
    
    if (userDetails && typeof userDetails === 'object') {
      if (userDetails.created_at) {
        try {
          // Check if it's a valid date
          new Date(userDetails.created_at).toISOString();
          safeCreatedAt = userDetails.created_at;
        } catch (e) {
          console.error("Invalid created_at date, using current date instead");
        }
      }
    }
    
    // Create a properly typed result object
    const result: UserDetailsResult = {
      email: userDetails.email || "Email unavailable",
      created_at: safeCreatedAt,
      last_sign_in_at: userDetails.last_sign_in_at || null,
      email_confirmed_at: userDetails.email_confirmed_at || null
    };
    
    console.log("adminHelpers - Successfully fetched user details");
    return result;
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
