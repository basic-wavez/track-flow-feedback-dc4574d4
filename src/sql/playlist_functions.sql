
-- Function to update positions after removing a track
CREATE OR REPLACE FUNCTION public.reorder_after_remove(
  p_playlist_id uuid, 
  p_removed_position integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrement positions for all tracks after the removed one
  UPDATE public.playlist_tracks
  SET position = position - 1
  WHERE playlist_id = p_playlist_id
    AND position > p_removed_position;
END;
$$;

-- Function to handle reordering when moving a track down (to a higher position)
CREATE OR REPLACE FUNCTION public.reorder_move_down(
  p_playlist_id uuid,
  p_old_position integer,
  p_new_position integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrement positions for tracks between old+1 and new
  UPDATE public.playlist_tracks
  SET position = position - 1
  WHERE playlist_id = p_playlist_id
    AND position > p_old_position
    AND position <= p_new_position;
END;
$$;

-- Function to handle reordering when moving a track up (to a lower position)
CREATE OR REPLACE FUNCTION public.reorder_move_up(
  p_playlist_id uuid,
  p_old_position integer,
  p_new_position integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment positions for tracks between new and old-1
  UPDATE public.playlist_tracks
  SET position = position + 1
  WHERE playlist_id = p_playlist_id
    AND position >= p_new_position
    AND position < p_old_position;
END;
$$;

-- Function to increment a position by a value
CREATE OR REPLACE FUNCTION public.increment_position(value integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT position + value
$$;

-- Function to decrement a position by a value
CREATE OR REPLACE FUNCTION public.decrement_position(value integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT position - value
$$;
