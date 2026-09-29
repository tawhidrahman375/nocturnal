export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beginner_track_completions: {
        Row: {
          completed_at: string
          day_number: number
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_number: number
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      beginner_track_progress: {
        Row: {
          created_at: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      dream_insights: {
        Row: {
          content: string
          created_at: string
          dream_count: number
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          dream_count?: number
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dream_count?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dream_profiles: {
        Row: {
          content: string
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dreams: {
        Row: {
          content: string
          created_at: string
          dreamed_at: string
          id: string
          is_lucid: boolean
          mood: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          dreamed_at?: string
          id?: string
          is_lucid?: boolean
          mood?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dreamed_at?: string
          id?: string
          is_lucid?: boolean
          mood?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mild_mantras: {
        Row: {
          content: string
          created_at: string
          dream_count: number
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          dream_count?: number
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dream_count?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          mild_prompt_enabled: boolean
          mild_prompt_time_minutes: number | null
          updated_at: string
          user_id: string
          wbtb_alarm_enabled: boolean
        }
        Insert: {
          created_at?: string
          mild_prompt_enabled?: boolean
          mild_prompt_time_minutes?: number | null
          updated_at?: string
          user_id: string
          wbtb_alarm_enabled?: boolean
        }
        Update: {
          created_at?: string
          mild_prompt_enabled?: boolean
          mild_prompt_time_minutes?: number | null
          updated_at?: string
          user_id?: string
          wbtb_alarm_enabled?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          dreams_per_week: string | null
          experience_level: string | null
          freeze_last_replenished: string
          id: string
          longest_streak: number
          main_goal: string | null
          mild_intention_set_at: string | null
          natural_wake_time: number | null
          streak_freezes: number
          tried_techniques: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          dreams_per_week?: string | null
          experience_level?: string | null
          freeze_last_replenished?: string
          id: string
          longest_streak?: number
          main_goal?: string | null
          mild_intention_set_at?: string | null
          natural_wake_time?: number | null
          streak_freezes?: number
          tried_techniques?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          dreams_per_week?: string | null
          experience_level?: string | null
          freeze_last_replenished?: string
          id?: string
          longest_streak?: number
          main_goal?: string | null
          mild_intention_set_at?: string | null
          natural_wake_time?: number | null
          streak_freezes?: number
          tried_techniques?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      progress_narratives: {
        Row: {
          content: string
          generated_at: string
          id: string
          period: string
          user_id: string
        }
        Insert: {
          content: string
          generated_at?: string
          id?: string
          period: string
          user_id: string
        }
        Update: {
          content?: string
          generated_at?: string
          id?: string
          period?: string
          user_id?: string
        }
        Relationships: []
      }
      reality_check_logs: {
        Row: {
          created_at: string
          dream_sign: string | null
          id: string
          scheduled_for: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dream_sign?: string | null
          id?: string
          scheduled_for?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dream_sign?: string | null
          id?: string
          scheduled_for?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      reality_check_settings: {
        Row: {
          active_end_minutes: number
          active_start_minutes: number
          created_at: string
          enabled: boolean
          frequency_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_end_minutes?: number
          active_start_minutes?: number
          created_at?: string
          enabled?: boolean
          frequency_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_end_minutes?: number
          active_start_minutes?: number
          created_at?: string
          enabled?: boolean
          frequency_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      technique_recommendations: {
        Row: {
          attempt_count: number
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      wbtb_defaults: {
        Row: {
          created_at: string
          sleep_duration_minutes: number
          updated_at: string
          user_id: string
          wake_window_minutes: number
        }
        Insert: {
          created_at?: string
          sleep_duration_minutes?: number
          updated_at?: string
          user_id: string
          wake_window_minutes?: number
        }
        Update: {
          created_at?: string
          sleep_duration_minutes?: number
          updated_at?: string
          user_id?: string
          wake_window_minutes?: number
        }
        Relationships: []
      }
      wbtb_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          dream_id: string | null
          dream_recall: string | null
          id: string
          sleep_at: string
          status: string
          technique: string
          updated_at: string
          user_id: string
          wake_at: string
          wake_window_ended_at: string | null
          wake_window_minutes: number
          woke_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dream_id?: string | null
          dream_recall?: string | null
          id?: string
          sleep_at: string
          status?: string
          technique?: string
          updated_at?: string
          user_id: string
          wake_at: string
          wake_window_ended_at?: string | null
          wake_window_minutes?: number
          woke_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dream_id?: string | null
          dream_recall?: string | null
          id?: string
          sleep_at?: string
          status?: string
          technique?: string
          updated_at?: string
          user_id?: string
          wake_at?: string
          wake_window_ended_at?: string | null
          wake_window_minutes?: number
          woke_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wbtb_sessions_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_account: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
