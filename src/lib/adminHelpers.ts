
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
    // Use a type assertion for the RPC call
    const { data, error } = await supabase.rpc('get_user_emails_for_admin') as unknown as {
      data: UserEmailResult[] | null;
      error: Error | null;
    };
    
    if (error) {
      console.error("Error fetching user emails:", error);
      throw error;
    }
    
    return data as UserEmailResult[];
  } catch (error) {
    console.error("Failed to fetch user emails:", error);
    return [];
  }
}

export async function getUserDetails(userId: string) {
  try {
    // Use a type assertion for the RPC call
    const { data, error } = await supabase.rpc('get_user_details_for_admin', { user_id: userId }) as unknown as {
      data: UserDetailsResult | null;
      error: Error | null;
    };
    
    if (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
    
    return data as UserDetailsResult;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
  }
}
