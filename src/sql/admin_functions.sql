
-- This file contains SQL functions that need to be created in the Supabase database
-- You'll need to run these in the SQL Editor in the Supabase dashboard

-- Function to get user emails for admins only
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin()
RETURNS TABLE (user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user has admin role
  IF NOT (SELECT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Access denied: requires admin role';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au;
END;
$$;

-- Function to get detailed user information for admins only
CREATE OR REPLACE FUNCTION public.get_user_details_for_admin(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if the user has admin role
  IF NOT (SELECT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Access denied: requires admin role';
  END IF;

  -- Query user details
  SELECT json_build_object(
    'email', au.email,
    'created_at', au.created_at,
    'last_sign_in_at', au.last_sign_in_at,
    'email_confirmed_at', au.email_confirmed_at
  ) INTO result
  FROM auth.users au
  WHERE au.id = user_id;

  RETURN result;
END;
$$;
