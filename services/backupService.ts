import { QuoteData, CompanyProfile } from '../types';

const HISTORY_KEY = 'orcaFacil_history';
const PROFILE_KEY = 'orcaFacil_profile';

interface BackupData {
  version: number;
  timestamp: string;
  profile: CompanyProfile | null;
  history: QuoteData[];
}

export const backupService = {
  /**
   * Exporta todos os dados do localStorage para um arquivo JSON
   */
  exportData: () => {
    try {
      const historyRaw = localStorage.getItem(HISTORY_KEY);
      const profileRaw = localStorage.getItem(PROFILE_KEY);

      const backup: BackupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        profile: profileRaw ? JSON.parse(profileRaw) : null,
        history: historyRaw ? JSON.parse(historyRaw) : []
      };

      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_orcafacil_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Falha ao exportar backup", error);
      alert("Erro ao gerar arquivo de backup.");
    }
  },

  /**
   * Importa dados de um arquivo JSON e atualiza o localStorage
   */
  importData: async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content) as BackupData;

          // Validação básica
          if (!data.history || !Array.isArray(data.history)) {
            throw new Error("Formato de arquivo inválido.");
          }

          // Salvar dados
          localStorage.setItem(HISTORY_KEY, JSON.stringify(data.history));
          
          if (data.profile) {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
          }

          resolve(true);
        } catch (error) {
          console.error("Erro ao importar backup", error);
          reject(error);
        }
      };

      reader.readAsText(file);
    });
  }
};
