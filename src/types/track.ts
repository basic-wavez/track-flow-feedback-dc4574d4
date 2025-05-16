
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
  downloads_enabled?: boolean;
  download_count?: number;
  // Version-related fields
  version_number: number;
  parent_track_id?: string;
  is_latest_version: boolean;
  version_notes?: string;
}

export interface TrackUpdateDetails {
  title?: string; 
  description?: string; 
  downloads_enabled?: boolean;
}
