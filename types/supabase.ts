export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendancesummary: {
        Row: {
          accomplished_hours: number | null
          days_absent: number | null
          days_late: number | null
          days_present: number | null
          remaining_hours: number | null
          summary_id: number
          trainee_id: string | null
        }
        Insert: {
          accomplished_hours?: number | null
          days_absent?: number | null
          days_late?: number | null
          days_present?: number | null
          remaining_hours?: number | null
          summary_id?: number
          trainee_id?: string | null
        }
        Update: {
          accomplished_hours?: number | null
          days_absent?: number | null
          days_late?: number | null
          days_present?: number | null
          remaining_hours?: number | null
          summary_id?: number
          trainee_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendancesummary_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "interns"
            referencedColumns: ["id"]
          },
        ]
      }
      department: {
        Row: {
          dept_id: number
          dept_name: string | null
        }
        Insert: {
          dept_id?: number
          dept_name?: string | null
        }
        Update: {
          dept_id?: number
          dept_name?: string | null
        }
        Relationships: []
      }
      interns: {
        Row: {
          dept_id: number | null
          end_date: string | null
          first_name: string | null
          hours_to_render: number | null
          id: string
          last_name: string | null
          phone_no: number | null
          start_date: string | null
          status: string | null
          university: string | null
        }
        Insert: {
          dept_id?: number | null
          end_date?: string | null
          first_name?: string | null
          hours_to_render?: number | null
          id: string
          last_name?: string | null
          phone_no?: number | null
          start_date?: string | null
          status?: string | null
          university?: string | null
        }
        Update: {
          dept_id?: number | null
          end_date?: string | null
          first_name?: string | null
          hours_to_render?: number | null
          id?: string
          last_name?: string | null
          phone_no?: number | null
          start_date?: string | null
          status?: string | null
          university?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interns_dept_id_fkey"
            columns: ["dept_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["dept_id"]
          },
          {
            foreignKeyName: "interns_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timelogs: {
        Row: {
          date: string | null
          status_logs: string | null
          time_id: number
          time_in: string | null
          time_out: string | null
          total_dayhours: number | null
          trainee_id: string | null
        }
        Insert: {
          date?: string | null
          status_logs?: string | null
          time_id?: number
          time_in?: string | null
          time_out?: string | null
          total_dayhours?: number | null
          trainee_id?: string | null
        }
        Update: {
          date?: string | null
          status_logs?: string | null
          time_id?: number
          time_in?: string | null
          time_out?: string | null
          total_dayhours?: number | null
          trainee_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timelogs_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "interns"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
