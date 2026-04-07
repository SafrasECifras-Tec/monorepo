/**
 * Interfaces de domínio manuais — complementam os tipos auto-gerados do Supabase.
 * Expande conforme os modelos de negócio evoluírem.
 */

export interface Produtor {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email?: string;
  created_at: string;
}

export interface Fazenda {
  id: string;
  produtor_id: string;
  nome: string;
  municipio: string;
  estado: string;
  area_total_ha?: number;
}

export interface Safra {
  id: string;
  fazenda_id: string;
  ano: number;
  cultura: string;
  area_plantada_ha?: number;
}
