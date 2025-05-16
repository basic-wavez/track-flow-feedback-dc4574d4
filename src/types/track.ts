
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

// Added new interfaces to support track versioning UI
export interface TrackVersion {
  id: string;
  version_number: number;
  version_notes?: string;
  is_latest_version: boolean;
  created_at?: string;
}

export interface TrackWithVersions {
  id: string;
  title: string;
  original_filename: string;
  parent_track_id?: string;
  created_at?: string;
  downloads_enabled?: boolean;
  processing_status?: string;
  versions: TrackVersion[];
  feedbackCount: number;
  showVersions?: boolean; // UI state to track expanded/collapsed view
}
