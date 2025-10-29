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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competitive_analysis: {
        Row: {
          competitor_name: string
          competitor_price: number
          created_at: string
          id: string
          market_position: string | null
          notes: string | null
          our_price: number
          price_difference_percentage: number
          recipe_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competitor_name: string
          competitor_price: number
          created_at?: string
          id?: string
          market_position?: string | null
          notes?: string | null
          our_price: number
          price_difference_percentage: number
          recipe_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competitor_name?: string
          competitor_price?: number
          created_at?: string
          id?: string
          market_position?: string | null
          notes?: string | null
          our_price?: number
          price_difference_percentage?: number
          recipe_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_alert_history: {
        Row: {
          alert_type: string
          id: string
          is_read: boolean
          new_value: number
          old_value: number
          percentage_change: number
          reference_id: string
          reference_name: string
          triggered_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          id?: string
          is_read?: boolean
          new_value: number
          old_value: number
          percentage_change: number
          reference_id: string
          reference_name: string
          triggered_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          id?: string
          is_read?: boolean
          new_value?: number
          old_value?: number
          percentage_change?: number
          reference_id?: string
          reference_name?: string
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_alerts: {
        Row: {
          alert_type: string
          created_at: string
          enabled: boolean
          id: string
          threshold_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          enabled?: boolean
          id?: string
          threshold_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          enabled?: boolean
          id?: string
          threshold_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ifood_config: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string
          id: string
          is_active: boolean
          merchant_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          is_active?: boolean
          merchant_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          is_active?: boolean
          merchant_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ifood_orders: {
        Row: {
          benefits: Json | null
          created_at: string
          created_at_ifood: string
          customer: Json
          delivery_address: Json | null
          delivery_fee: number | null
          id: string
          ifood_order_id: string
          items: Json
          merchant_id: string
          order_status: string
          order_timing: string | null
          order_type: string
          payments: Json
          sub_total: number
          synced_to_sales: boolean
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          created_at_ifood: string
          customer: Json
          delivery_address?: Json | null
          delivery_fee?: number | null
          id?: string
          ifood_order_id: string
          items: Json
          merchant_id: string
          order_status?: string
          order_timing?: string | null
          order_type: string
          payments: Json
          sub_total: number
          synced_to_sales?: boolean
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          created_at_ifood?: string
          customer?: Json
          delivery_address?: Json | null
          delivery_fee?: number | null
          id?: string
          ifood_order_id?: string
          items?: Json
          merchant_id?: string
          order_status?: string
          order_timing?: string | null
          order_type?: string
          payments?: Json
          sub_total?: number
          synced_to_sales?: boolean
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      indirect_costs: {
        Row: {
          amount: number
          cost_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cost_type: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cost_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ingredient_stock: {
        Row: {
          created_at: string
          current_quantity: number
          id: string
          ingredient_id: string
          last_updated: string
          min_quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_quantity?: number
          id?: string
          ingredient_id: string
          last_updated?: string
          min_quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_quantity?: number
          id?: string
          ingredient_id?: string
          last_updated?: string
          min_quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_stock_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          supplier: string | null
          unit: string
          unit_cost: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          supplier?: string | null
          unit: string
          unit_cost: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          supplier?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pricing_configs: {
        Row: {
          created_at: string | null
          delivery_fee_percentage: number | null
          id: string
          income_level: string | null
          profit_margin_percentage: number | null
          regional_factor: number | null
          tax_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_fee_percentage?: number | null
          id?: string
          income_level?: string | null
          profit_margin_percentage?: number | null
          regional_factor?: number | null
          tax_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_fee_percentage?: number | null
          id?: string
          income_level?: string | null
          profit_margin_percentage?: number | null
          regional_factor?: number | null
          tax_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pricing_history: {
        Row: {
          created_at: string
          delivery_fee_percentage: number | null
          id: string
          price_with_delivery: number | null
          price_without_delivery: number | null
          profit_margin_percentage: number
          recipe_cost: number
          recipe_id: string
          recipe_name: string
          regional_factor: number
          suggested_price: number
          tax_percentage: number
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_fee_percentage?: number | null
          id?: string
          price_with_delivery?: number | null
          price_without_delivery?: number | null
          profit_margin_percentage: number
          recipe_cost: number
          recipe_id: string
          recipe_name: string
          regional_factor: number
          suggested_price: number
          tax_percentage: number
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_fee_percentage?: number | null
          id?: string
          price_with_delivery?: number | null
          price_without_delivery?: number | null
          profit_margin_percentage?: number
          recipe_cost?: number
          recipe_id?: string
          recipe_name?: string
          regional_factor?: number
          suggested_price?: number
          tax_percentage?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          location_cep: string | null
          location_city: string | null
          location_state: string | null
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          location_cep?: string | null
          location_city?: string | null
          location_state?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          location_cep?: string | null
          location_city?: string | null
          location_state?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recipe_indirect_costs: {
        Row: {
          amount: number
          cost_name: string
          cost_type: string
          created_at: string
          id: string
          notes: string | null
          recipe_id: string
          user_id: string
        }
        Insert: {
          amount: number
          cost_name: string
          cost_type: string
          created_at?: string
          id?: string
          notes?: string | null
          recipe_id: string
          user_id: string
        }
        Update: {
          amount?: number
          cost_name?: string
          cost_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_indirect_costs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string
          quantity: number
          recipe_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id: string
          quantity: number
          recipe_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string
          quantity?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category_id: string | null
          created_at: string | null
          default_servings: number
          id: string
          name: string
          notes: string | null
          prep_time_minutes: number | null
          updated_at: string | null
          user_id: string
          waste_percentage: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          default_servings?: number
          id?: string
          name: string
          notes?: string | null
          prep_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
          waste_percentage?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          default_servings?: number
          id?: string
          name?: string
          notes?: string | null
          prep_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          waste_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_factors: {
        Row: {
          created_at: string
          factor: number
          id: string
          state_code: string
          state_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          factor?: number
          id?: string
          state_code: string
          state_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          factor?: number
          id?: string
          state_code?: string
          state_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          cost_per_unit: number
          created_at: string
          customer_name: string | null
          discount_percentage: number | null
          final_price: number | null
          id: string
          notes: string | null
          profit: number
          quantity: number
          recipe_id: string
          sale_date: string
          total_amount: number
          total_cost: number
          unit_price: number
          updated_at: string
          user_id: string
          with_delivery: boolean
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          customer_name?: string | null
          discount_percentage?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          profit: number
          quantity?: number
          recipe_id: string
          sale_date?: string
          total_amount: number
          total_cost: number
          unit_price: number
          updated_at?: string
          user_id: string
          with_delivery?: boolean
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          customer_name?: string | null
          discount_percentage?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          profit?: number
          quantity?: number
          recipe_id?: string
          sale_date?: string
          total_amount?: number
          total_cost?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
          with_delivery?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sales_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          movement_type: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          movement_type: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          quantity: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          movement_type?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
