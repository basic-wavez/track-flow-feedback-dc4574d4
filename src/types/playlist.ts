
export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  created_at: string;
  track?: {
    title: string;
    original_filename: string;
    version_number: number;
  };
}

export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
}

export interface PlaylistCreateInput {
  name: string;
  description?: string;
  is_public: boolean;
}

export interface PlaylistUpdateInput {
  name?: string;
  description?: string;
  is_public?: boolean;
}
