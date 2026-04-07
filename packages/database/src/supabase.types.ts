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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atividade_rural_particular: {
        Row: {
          created_at: string
          despesas: number[]
          id: string
          parceiro_id: string
          receitas: number[]
        }
        Insert: {
          created_at?: string
          despesas?: number[]
          id?: string
          parceiro_id: string
          receitas?: number[]
        }
        Update: {
          created_at?: string
          despesas?: number[]
          id?: string
          parceiro_id?: string
          receitas?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "atividade_rural_particular_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      calcir_analise_favoritos: {
        Row: {
          analise_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          analise_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          analise_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calcir_analise_favoritos_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "calcir_analises"
            referencedColumns: ["id"]
          },
        ]
      }
      calcir_analise_origens: {
        Row: {
          analise_consolidada_id: string
          analise_origem_id: string
          created_at: string
          id: string
          ordem: number
          regra_deduplicacao_override: string | null
          updated_at: string
        }
        Insert: {
          analise_consolidada_id: string
          analise_origem_id: string
          created_at?: string
          id?: string
          ordem?: number
          regra_deduplicacao_override?: string | null
          updated_at?: string
        }
        Update: {
          analise_consolidada_id?: string
          analise_origem_id?: string
          created_at?: string
          id?: string
          ordem?: number
          regra_deduplicacao_override?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calcir_analise_origens_analise_consolidada_id_fkey"
            columns: ["analise_consolidada_id"]
            isOneToOne: false
            referencedRelation: "calcir_analises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calcir_analise_origens_analise_origem_id_fkey"
            columns: ["analise_origem_id"]
            isOneToOne: false
            referencedRelation: "calcir_analises"
            referencedColumns: ["id"]
          },
        ]
      }
      calcir_analise_payloads: {
        Row: {
          analise_id: string
          cliente_id: string
          created_at: string
          id: string
          payload: Json
          updated_at: string
        }
        Insert: {
          analise_id: string
          cliente_id: string
          created_at?: string
          id?: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          analise_id?: string
          cliente_id?: string
          created_at?: string
          id?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calcir_analise_payloads_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: true
            referencedRelation: "calcir_analises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calcir_analise_payloads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      calcir_analises: {
        Row: {
          ano_referencia: number | null
          cliente_id: string
          cow_migrated_at: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          is_base_padrao: boolean
          nome: string
          regra_deduplicacao: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ano_referencia?: number | null
          cliente_id: string
          cow_migrated_at?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_base_padrao?: boolean
          nome: string
          regra_deduplicacao?: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ano_referencia?: number | null
          cliente_id?: string
          cow_migrated_at?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_base_padrao?: boolean
          nome?: string
          regra_deduplicacao?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calcir_analises_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      calcir_cow_migration_issues: {
        Row: {
          analise_id: string
          cliente_id: string
          created_at: string
          entity_type: string
          id: string
          payload_item_id: string | null
          payload_snapshot: Json
          reason: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          source_id: string | null
        }
        Insert: {
          analise_id: string
          cliente_id: string
          created_at?: string
          entity_type: string
          id?: string
          payload_item_id?: string | null
          payload_snapshot?: Json
          reason: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source_id?: string | null
        }
        Update: {
          analise_id?: string
          cliente_id?: string
          created_at?: string
          entity_type?: string
          id?: string
          payload_item_id?: string | null
          payload_snapshot?: Json
          reason?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calcir_cow_migration_issues_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "calcir_analises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calcir_cow_migration_issues_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      calcir_despesas_overrides: {
        Row: {
          a_realizar: number | null
          analise_id: string
          cliente_id: string
          created_at: string
          credito_ibs_cbs: string | null
          descricao: string | null
          estoque: number | null
          id: string
          is_deleted: boolean
          obs: string | null
          realizado: number | null
          row_version: number
          source_despesa_id: string | null
          total: number | null
          total_ano_anterior: number | null
          updated_at: string
        }
        Insert: {
          a_realizar?: number | null
          analise_id: string
          cliente_id: string
          created_at?: string
          credito_ibs_cbs?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string
          is_deleted?: boolean
          obs?: string | null
          realizado?: number | null
          row_version?: number
          source_despesa_id?: string | null
          total?: number | null
          total_ano_anterior?: number | null
          updated_at?: string
        }
        Update: {
          a_realizar?: number | null
          analise_id?: string
          cliente_id?: string
          created_at?: string
          credito_ibs_cbs?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string
          is_deleted?: boolean
          obs?: string | null
          realizado?: number | null
          row_version?: number
          source_despesa_id?: string | null
          total?: number | null
          total_ano_anterior?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calcir_despesas_overrides_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "calcir_analises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calcir_despesas_overrides_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calcir_despesas_overrides_source_despesa_id_fkey"
            columns: ["source_despesa_id"]
            isOneToOne: false
            referencedRelation: "despesas"
            referencedColumns: ["id"]
          },
        ]
      }
      calcir_receitas_overrides: {
        Row: {
          analise_id: string
          cliente_id: string
          created_at: string
          entidade: string | null
          estoque: number | null
          funrural_nao_incidente: boolean | null
          id: string
          is_deleted: boolean
          mes: string | null
          obs: string | null
          pis_cofins: boolean | null
          produto: string | null
          quantidade: number | null
          row_version: number
          source_receita_id: string | null
          tipo: string | null
          total: number | null
          updated_at: string
          valor_unit: number | null
        }
        Insert: {
          analise_id: string
          cliente_id: string
          created_at?: string
          entidade?: string | null
          estoque?: number | null
          funrural_nao_incidente?: boolean | null
          id?: string
          is_deleted?: boolean
          mes?: string | null
          obs?: string | null
          pis_cofins?: boolean | null
          produto?: string | null
          quantidade?: number | null
          row_version?: number
          source_receita_id?: string | null
          tipo?: string | null
          total?: number | null
          updated_at?: string
          valor_unit?: number | null
        }
        Update: {
          analise_id?: string
          cliente_id?: string
          created_at?: string
          entidade?: string | null
          estoque?: number | null
          funrural_nao_incidente?: boolean | null
          id?: string
          is_deleted?: boolean
          mes?: string | null
          obs?: string | null
          pis_cofins?: boolean | null
          produto?: string | null
          quantidade?: number | null
          row_version?: number
          source_receita_id?: string | null
          tipo?: string | null
          total?: number | null
          updated_at?: string
          valor_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calcir_receitas_overrides_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "calcir_analises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calcir_receitas_overrides_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calcir_receitas_overrides_source_receita_id_fkey"
            columns: ["source_receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      client_integrations: {
        Row: {
          active: boolean
          cliente_id: string
          created_at: string
          id: string
          last_sync_at: string | null
          source_system: string
          source_token: string
        }
        Insert: {
          active?: boolean
          cliente_id: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          source_system?: string
          source_token: string
        }
        Update: {
          active?: boolean
          cliente_id?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          source_system?: string
          source_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_integrations_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_users: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_users_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          documento: string | null
          estado: string | null
          foto_url: string | null
          id: string
          nome: string
          porte: string | null
          regional: string | null
        }
        Insert: {
          created_at?: string
          documento?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          porte?: string | null
          regional?: string | null
        }
        Update: {
          created_at?: string
          documento?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          porte?: string | null
          regional?: string | null
        }
        Relationships: []
      }
      config_cliente: {
        Row: {
          calcir_cow_enabled: boolean
          cliente_id: string
          contabilidade_regular: boolean
          created_at: string
          demais_despesas_pj: number
          folha_pagamento_pf: number
          folha_pagamento_pj: number
          funrural_pf_aliquota: number
          funrural_pf_regime: string
          funrural_pj_aliquota: number
          funrural_pj_regime: string
          id: string
          lcdpr_limite: number
          lucro_acumulado_pj: number
          lucros_isentos_acumulados: Json
          prejuizos_anteriores: Json
          regime_apuracao_rural: Json | null
        }
        Insert: {
          calcir_cow_enabled?: boolean
          cliente_id: string
          contabilidade_regular?: boolean
          created_at?: string
          demais_despesas_pj?: number
          folha_pagamento_pf?: number
          folha_pagamento_pj?: number
          funrural_pf_aliquota?: number
          funrural_pf_regime?: string
          funrural_pj_aliquota?: number
          funrural_pj_regime?: string
          id?: string
          lcdpr_limite?: number
          lucro_acumulado_pj?: number
          lucros_isentos_acumulados?: Json
          prejuizos_anteriores?: Json
          regime_apuracao_rural?: Json | null
        }
        Update: {
          calcir_cow_enabled?: boolean
          cliente_id?: string
          contabilidade_regular?: boolean
          created_at?: string
          demais_despesas_pj?: number
          folha_pagamento_pf?: number
          folha_pagamento_pj?: number
          funrural_pf_aliquota?: number
          funrural_pf_regime?: string
          funrural_pj_aliquota?: number
          funrural_pj_regime?: string
          id?: string
          lcdpr_limite?: number
          lucro_acumulado_pj?: number
          lucros_isentos_acumulados?: Json
          prejuizos_anteriores?: Json
          regime_apuracao_rural?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "config_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      connectere_staging: {
        Row: {
          created_at: string | null
          id: string
          modulo: string
          raw_data: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          modulo: string
          raw_data: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          modulo?: string
          raw_data?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connectere_staging_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultor_clientes: {
        Row: {
          cliente_id: string
          consultor_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          cliente_id: string
          consultor_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          cliente_id?: string
          consultor_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultor_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultor_clientes_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          a_realizar: number
          cliente_id: string
          created_at: string
          credito_ibs_cbs: string
          descricao: string
          entidade: string | null
          estoque: number | null
          id: string
          obs: string | null
          realizado: number
          source_documento: string | null
          source_modulo: string | null
          source_row_hash: string | null
          source_system: string | null
          total: number
          total_ano_anterior: number
        }
        Insert: {
          a_realizar?: number
          cliente_id: string
          created_at?: string
          credito_ibs_cbs?: string
          descricao?: string
          entidade?: string | null
          estoque?: number | null
          id?: string
          obs?: string | null
          realizado?: number
          source_documento?: string | null
          source_modulo?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          total?: number
          total_ano_anterior?: number
        }
        Update: {
          a_realizar?: number
          cliente_id?: string
          created_at?: string
          credito_ibs_cbs?: string
          descricao?: string
          entidade?: string | null
          estoque?: number | null
          id?: string
          obs?: string | null
          realizado?: number
          source_documento?: string | null
          source_modulo?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          total?: number
          total_ano_anterior?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      imobilizado_aquisicao: {
        Row: {
          a_realizar: number
          cliente_id: string
          created_at: string
          descricao: string
          entidade: string
          id: string
          realizado: number
          total: number
        }
        Insert: {
          a_realizar?: number
          cliente_id: string
          created_at?: string
          descricao?: string
          entidade?: string
          id?: string
          realizado?: number
          total?: number
        }
        Update: {
          a_realizar?: number
          cliente_id?: string
          created_at?: string
          descricao?: string
          entidade?: string
          id?: string
          realizado?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "imobilizado_aquisicao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      parceiros: {
        Row: {
          cliente_id: string
          cpf: string | null
          created_at: string
          id: string
          nome: string
          perc_despesas: number
          perc_receitas: number
        }
        Insert: {
          cliente_id: string
          cpf?: string | null
          created_at?: string
          id?: string
          nome: string
          perc_despesas?: number
          perc_receitas?: number
        }
        Update: {
          cliente_id?: string
          cpf?: string | null
          created_at?: string
          id?: string
          nome?: string
          perc_despesas?: number
          perc_receitas?: number
        }
        Relationships: [
          {
            foreignKeyName: "parceiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nome?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      receitas: {
        Row: {
          cliente_id: string
          created_at: string
          entidade: string
          estoque: number | null
          funrural_nao_incidente: boolean | null
          id: string
          mes: string
          obs: string | null
          pis_cofins: boolean
          produto: string
          quantidade: number
          source_documento: string | null
          source_modulo: string | null
          source_row_hash: string | null
          source_system: string | null
          tipo: string
          total: number
          valor_unit: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          entidade?: string
          estoque?: number | null
          funrural_nao_incidente?: boolean | null
          id?: string
          mes?: string
          obs?: string | null
          pis_cofins?: boolean
          produto?: string
          quantidade?: number
          source_documento?: string | null
          source_modulo?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          tipo?: string
          total?: number
          valor_unit?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          entidade?: string
          estoque?: number | null
          funrural_nao_incidente?: boolean | null
          id?: string
          mes?: string
          obs?: string | null
          pis_cofins?: boolean
          produto?: string
          quantidade?: number
          source_documento?: string | null
          source_modulo?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          tipo?: string
          total?: number
          valor_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      regionais: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      rendimentos_particulares: {
        Row: {
          alugueis: number[]
          created_at: string
          dividendos: number[]
          doacoes: number[]
          ganho_capital: number[]
          id: string
          parceiro_id: string
          pro_labore: number[]
          rend_aplicacoes: number[]
          rend_protegidos: number[]
        }
        Insert: {
          alugueis?: number[]
          created_at?: string
          dividendos?: number[]
          doacoes?: number[]
          ganho_capital?: number[]
          id?: string
          parceiro_id: string
          pro_labore?: number[]
          rend_aplicacoes?: number[]
          rend_protegidos?: number[]
        }
        Update: {
          alugueis?: number[]
          created_at?: string
          dividendos?: number[]
          doacoes?: number[]
          ganho_capital?: number[]
          id?: string
          parceiro_id?: string
          pro_labore?: number[]
          rend_aplicacoes?: number[]
          rend_protegidos?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "rendimentos_particulares_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      retencoes_particulares: {
        Row: {
          created_at: string
          id: string
          irrf_alugueis: number[]
          irrf_dividendos: number[]
          irrf_operacoes_bolsa: number[]
          irrf_pro_labore: number[]
          irrf_rend_aplicacoes: number[]
          parceiro_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          irrf_alugueis?: number[]
          irrf_dividendos?: number[]
          irrf_operacoes_bolsa?: number[]
          irrf_pro_labore?: number[]
          irrf_rend_aplicacoes?: number[]
          parceiro_id: string
        }
        Update: {
          created_at?: string
          id?: string
          irrf_alugueis?: number[]
          irrf_dividendos?: number[]
          irrf_operacoes_bolsa?: number[]
          irrf_pro_labore?: number[]
          irrf_rend_aplicacoes?: number[]
          parceiro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retencoes_particulares_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_field_mappings: {
        Row: {
          created_at: string
          id: string
          source_field: string
          source_system: string
          target_field: string
          target_table: string
          transform_expression: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          source_field: string
          source_system: string
          target_field: string
          target_table: string
          transform_expression?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          source_field?: string
          source_system?: string
          target_field?: string
          target_table?: string
          transform_expression?: string | null
        }
        Relationships: []
      }
      staging_import_rows: {
        Row: {
          cliente_id: string
          created_at: string
          error_message: string | null
          id: string
          mapped_at: string | null
          modulo: string
          normalized_record: Json
          raw_record: Json
          source_documento: string | null
          source_index: number
          source_row_hash: string
          source_system: string
          staging_import_id: string
          status: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          mapped_at?: string | null
          modulo: string
          normalized_record?: Json
          raw_record: Json
          source_documento?: string | null
          source_index: number
          source_row_hash: string
          source_system?: string
          staging_import_id: string
          status?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          mapped_at?: string | null
          modulo?: string
          normalized_record?: Json
          raw_record?: Json
          source_documento?: string | null
          source_index?: number
          source_row_hash?: string
          source_system?: string
          staging_import_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staging_import_rows_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staging_import_rows_staging_import_id_fkey"
            columns: ["staging_import_id"]
            isOneToOne: false
            referencedRelation: "staging_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_imports: {
        Row: {
          cliente_id: string
          created_at: string
          error_message: string | null
          id: string
          mapped_at: string | null
          metadata: Json
          modulo: string | null
          raw_data: Json
          record_count: number
          source_system: string
          status: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          mapped_at?: string | null
          metadata?: Json
          modulo?: string | null
          raw_data?: Json
          record_count?: number
          source_system?: string
          status?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          mapped_at?: string | null
          metadata?: Json
          modulo?: string | null
          raw_data?: Json
          record_count?: number
          source_system?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staging_imports_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          connectere_token: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          connectere_token?: string | null
          created_at?: string | null
          id: string
        }
        Update: {
          connectere_token?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas_imobilizado: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string
          entidade: string
          id: string
          mes: string
          projetado: number
          realizado: number
          source_documento: string | null
          source_modulo: string | null
          source_row_hash: string | null
          source_system: string | null
          total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string
          entidade?: string
          id?: string
          mes?: string
          projetado?: number
          realizado?: number
          source_documento?: string | null
          source_modulo?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          total?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string
          entidade?: string
          id?: string
          mes?: string
          projetado?: number
          realizado?: number
          source_documento?: string | null
          source_modulo?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_imobilizado_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcir_create_despesa_override: {
        Args: { p_analise_id: string; p_cliente_id: string; p_item: Json }
        Returns: {
          is_override: boolean
          row_version: number
          source_id: string
        }[]
      }
      calcir_create_receita_override: {
        Args: { p_analise_id: string; p_cliente_id: string; p_item: Json }
        Returns: {
          is_override: boolean
          row_version: number
          source_id: string
        }[]
      }
      calcir_get_despesas_efetivas: {
        Args: { p_analise_id: string; p_cliente_id: string }
        Returns: {
          a_realizar: number
          cliente_id: string
          created_at: string
          credito_ibs_cbs: string
          descricao: string
          id: string
          is_override: boolean
          obs: string
          realizado: number
          row_version: number
          source_documento: string
          source_id: string
          source_modulo: string
          source_row_hash: string
          source_system: string
          total: number
          total_ano_anterior: number
        }[]
      }
      calcir_get_receitas_efetivas: {
        Args: { p_analise_id: string; p_cliente_id: string }
        Returns: {
          cliente_id: string
          created_at: string
          entidade: string
          id: string
          is_override: boolean
          mes: string
          obs: string
          pis_cofins: boolean
          produto: string
          quantidade: number
          row_version: number
          source_documento: string
          source_id: string
          source_modulo: string
          source_row_hash: string
          source_system: string
          tipo: string
          total: number
          valor_unit: number
        }[]
      }
      calcir_soft_delete_despesa_override: {
        Args: {
          p_analise_id: string
          p_cliente_id: string
          p_expected_version?: number
          p_source_despesa_id: string
        }
        Returns: {
          is_deleted: boolean
          row_version: number
          source_id: string
        }[]
      }
      calcir_soft_delete_receita_override: {
        Args: {
          p_analise_id: string
          p_cliente_id: string
          p_expected_version?: number
          p_source_receita_id: string
        }
        Returns: {
          is_deleted: boolean
          row_version: number
          source_id: string
        }[]
      }
      calcir_upsert_despesa_override: {
        Args: {
          p_analise_id: string
          p_cliente_id: string
          p_expected_version?: number
          p_patch: Json
          p_source_despesa_id: string
        }
        Returns: {
          is_override: boolean
          row_version: number
          source_id: string
        }[]
      }
      calcir_upsert_receita_override: {
        Args: {
          p_analise_id: string
          p_cliente_id: string
          p_expected_version?: number
          p_patch: Json
          p_source_receita_id: string
        }
        Returns: {
          is_override: boolean
          row_version: number
          source_id: string
        }[]
      }
      get_regional_rankings: {
        Args: { p_cliente_id: string; p_regional: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cliente_user: {
        Args: { _cliente_id: string; _user_id: string }
        Returns: boolean
      }
      is_consultant_for_client: {
        Args: { _cliente_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "consultor" | "cliente"
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
    Enums: {
      app_role: ["consultor", "cliente"],
    },
  },
} as const
