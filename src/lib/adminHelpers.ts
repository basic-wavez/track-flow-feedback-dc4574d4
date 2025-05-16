
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
    // Use the generic fetch to bypass TypeScript function name checking
    const response = await fetch(`https://qzykfyavenplpxpdnfxh.supabase.co/rest/v1/rpc/get_user_emails_for_admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6eWtmeWF2ZW5wbHB4cGRuZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzk3NjQsImV4cCI6MjA2MjgxNTc2NH0.fMRSARTizLWE04-zI1v70kwugmlOkM1uwbhYSOgGO4g`,
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6eWtmeWF2ZW5wbHB4cGRuZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzk3NjQsImV4cCI6MjA2MjgxNTc2NH0.fMRSARTizLWE04-zI1v70kwugmlOkM1uwbhYSOgGO4g`
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching user emails:", errorData);
      throw new Error(errorData.message || 'Error fetching user emails');
    }
    
    const data = await response.json();
    return data as UserEmailResult[];
  } catch (error) {
    console.error("Failed to fetch user emails:", error);
    return [];
  }
}

export async function getUserDetails(userId: string) {
  try {
    // Use the generic fetch to bypass TypeScript function name checking
    const response = await fetch(`https://qzykfyavenplpxpdnfxh.supabase.co/rest/v1/rpc/get_user_details_for_admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6eWtmeWF2ZW5wbHB4cGRuZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzk3NjQsImV4cCI6MjA2MjgxNTc2NH0.fMRSARTizLWE04-zI1v70kwugmlOkM1uwbhYSOgGO4g`,
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6eWtmeWF2ZW5wbHB4cGRuZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzk3NjQsImV4cCI6MjA2MjgxNTc2NH0.fMRSARTizLWE04-zI1v70kwugmlOkM1uwbhYSOgGO4g`
      },
      body: JSON.stringify({
        user_id: userId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching user details:", errorData);
      throw new Error(errorData.message || 'Error fetching user details');
    }
    
    const data = await response.json();
    return data as UserDetailsResult;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
  }
}
