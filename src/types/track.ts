
export interface TrackData {
  id: string;
  title: string;
  compressed_url: string;
  original_url?: string;
  original_filename: string;
  user_id: string;
  created_at?: string;
  chunk_count?: number; // Add chunk count field
}

export interface TrackUpdateDetails {
  title?: string; 
  description?: string; 
  downloads_enabled?: boolean;
}
