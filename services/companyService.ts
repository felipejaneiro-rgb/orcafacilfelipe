
import { supabase } from '../lib/supabase';
import { CompanyProfile } from '../types';

export const companyService = {
  /**
   * Busca a empresa vinculada ao usuário logado pelo owner_id.
   * Inclui um timeout de segurança para não travar o app se a rede falhar.
   */
  getCompany: async (userId: string): Promise<CompanyProfile | null> => {
    // Promessa de timeout para evitar carregamento infinito
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Tempo de resposta do servidor esgotado.")), 5000)
    );

    try {
      const fetchPromise = supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      const { data, error }: any = await Promise.race([fetchPromise, timeout]);

      if (error) {
        console.error("Erro Supabase (getCompany):", error);
        return null; // Falha silenciosa para permitir onboarding
      }

      return data;
    } catch (e) {
      console.warn("Company fetch timed out or failed:", e);
      return null;
    }
  },

  /**
   * Insere o perfil da empresa no Supabase.
   */
  createCompany: async (userId: string, profile: CompanyProfile): Promise<CompanyProfile> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const { data, error } = await supabase
      .from('companies')
      .insert([
        { 
          owner_id: user.id,
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
      console.error("Erro Supabase (createCompany):", error);
      if (error.code === '42501') {
        throw new Error("Erro de permissão no banco de dados. Verifique as políticas RLS.");
      }
      throw new Error(error.message || "Não foi possível salvar os dados.");
    }

    return data;
  }
};
