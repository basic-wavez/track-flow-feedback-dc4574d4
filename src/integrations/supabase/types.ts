export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      feedback: {
        Row: {
          anonymous: boolean | null
          arrangement_score: number
          casual_listening: boolean
          created_at: string | null
          dj_set_play: boolean
          guest_name: string | null
          harmonies_score: number
          id: string
          melodies_score: number
          mixing_score: number
          sound_design_score: number
          track_id: string
          user_id: string | null
          version_number: number
          written_feedback: string | null
        }
        Insert: {
          anonymous?: boolean | null
          arrangement_score: number
          casual_listening: boolean
          created_at?: string | null
          dj_set_play: boolean
          guest_name?: string | null
          harmonies_score: number
          id?: string
          melodies_score: number
          mixing_score: number
          sound_design_score: number
          track_id: string
          user_id?: string | null
          version_number?: number
          written_feedback?: string | null
        }
        Update: {
          anonymous?: boolean | null
          arrangement_score?: number
          casual_listening?: boolean
          created_at?: string | null
          dj_set_play?: boolean
          guest_name?: string | null
          harmonies_score?: number
          id?: string
          melodies_score?: number
          mixing_score?: number
          sound_design_score?: number
          track_id?: string
          user_id?: string | null
          version_number?: number
          written_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_share_links: {
        Row: {
          created_at: string
          download_count: number
          id: string
          last_played_at: string | null
          name: string
          play_count: number
          playlist_id: string
          share_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          id?: string
          last_played_at?: string | null
          name: string
          play_count?: number
          playlist_id: string
          share_key?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          id?: string
          last_played_at?: string | null
          name?: string
          play_count?: number
          playlist_id?: string
          share_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_share_links_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      share_links: {
        Row: {
          created_at: string | null
          download_count: number
          id: string
          last_played_at: string | null
          name: string
          play_count: number | null
          share_key: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          download_count?: number
          id?: string
          last_played_at?: string | null
          name: string
          play_count?: number | null
          share_key?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          download_count?: number
          id?: string
          last_played_at?: string | null
          name?: string
          play_count?: number | null
          share_key?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          chunk_count: number | null
          compressed_url: string
          created_at: string | null
          description: string | null
          downloads_enabled: boolean | null
          id: string
          is_latest_version: boolean
          mp3_url: string | null
          opus_processing_status: string | null
          opus_url: string | null
          original_filename: string
          original_url: string | null
          parent_track_id: string | null
          processing_status: string | null
          title: string
          updated_at: string | null
          user_id: string
          version_notes: string | null
          version_number: number
          waveform_data: Json | null
        }
        Insert: {
          chunk_count?: number | null
          compressed_url: string
          created_at?: string | null
          description?: string | null
          downloads_enabled?: boolean | null
          id?: string
          is_latest_version?: boolean
          mp3_url?: string | null
          opus_processing_status?: string | null
          opus_url?: string | null
          original_filename: string
          original_url?: string | null
          parent_track_id?: string | null
          processing_status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          version_notes?: string | null
          version_number?: number
          waveform_data?: Json | null
        }
        Update: {
          chunk_count?: number | null
          compressed_url?: string
          created_at?: string | null
          description?: string | null
          downloads_enabled?: boolean | null
          id?: string
          is_latest_version?: boolean
          mp3_url?: string | null
          opus_processing_status?: string | null
          opus_url?: string | null
          original_filename?: string
          original_url?: string | null
          parent_track_id?: string | null
          processing_status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version_notes?: string | null
          version_number?: number
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_parent_track_id_fkey"
            columns: ["parent_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_feedback_by_date: {
        Args: { days_back?: number }
        Returns: {
          date: string
          count: number
        }[]
      }
      get_track_uploads_by_date: {
        Args: { days_back?: number }
        Returns: {
          date: string
          count: number
        }[]
      }
      get_user_details_for_admin: {
        Args: { user_id: string }
        Returns: Json
      }
      get_user_emails_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
        }[]
      }
      get_user_registrations_by_date: {
        Args: { days_back?: number }
        Returns: {
          date: string
          count: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
