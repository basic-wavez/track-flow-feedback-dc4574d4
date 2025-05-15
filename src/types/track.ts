
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
}

export interface TrackUpdateDetails {
  title?: string; 
  description?: string; 
  downloads_enabled?: boolean;
}
