
import { Json } from "@/integrations/supabase/types";

export interface TrackData {
  id: string;
  title: string;
  compressed_url: string;
  original_url?: string;
  original_filename: string;
  user_id: string;
  created_at?: string;
  chunk_count?: number;
  mp3_url?: string;
  processing_status?: string;
  waveform_data?: number[] | Json; // Updated to accept both number[] and Json types
}

export interface TrackUpdateDetails {
  title?: string; 
  description?: string; 
  downloads_enabled?: boolean;
}
