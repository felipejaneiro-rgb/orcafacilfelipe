
import { supabase } from '../lib/supabase';
import { CompanyProfile } from '../types';

export const companyService = {
  /**
   * Busca a empresa vinculada ao usuário logado pelo owner_id
   */
  getCompany: async (userId: string): Promise<CompanyProfile | null> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Erro ao buscar empresa:", error);
      throw error;
    }

    return data;
  },

  /**
   * Cria o perfil inicial da empresa com as colunas reais do banco
   */
  createCompany: async (userId: string, profile: CompanyProfile): Promise<CompanyProfile> => {
    const { data, error } = await supabase
      .from('companies')
      .insert([
        { 
          owner_id: userId,
          razao_social: profile.razao_social,
          nome_fantasia: profile.nome_fantasia,
          cnpj: profile.cnpj,
          email: profile.email,
          telefone: profile.telefone,
          endereco: profile.endereco,
          brand_color: profile.brand_color || '#2563eb',
          tipo_empresa: profile.tipo_empresa
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar empresa:", error);
      throw error;
    }

    return data;
  }
};
