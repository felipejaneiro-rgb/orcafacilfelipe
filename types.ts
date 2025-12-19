
export interface CompanyProfile {
  id?: string;
  owner_id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string; // Armazena CPF ou CNPJ
  email: string;
  telefone: string;
  endereco?: string;
  brand_color?: string;
  tipo_empresa: 'pessoa_fisica' | 'pessoa_juridica';
  created_at?: string;
  logo_url?: string;
  // Added to fix property access error in pdfService
  showSignature?: boolean;
}

export interface ClientDetails {
  name: string;
  personType: 'PF' | 'PJ';
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SavedClient extends ClientDetails {
  id: string;
  notes?: string;
  createdAt: string;
}

export type UnitOfMeasure = 'un' | 'kg' | 'm' | 'm²' | 'm³' | 'l' | 'cx' | 'par' | 'hr' | 'dia' | 'sem' | 'mes';

export interface QuoteItem {
  id: string;
  type?: 'service' | 'product';
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  cost?: number;
}

export interface SavedService {
  id: string;
  description: string;
  defaultPrice: number;
}

export interface SavedProduct {
  id: string;
  description: string;
  defaultPrice: number;
  unit: UnitOfMeasure;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  // Added to fix property access errors in authService mapping
  document?: string;
  whatsapp?: string;
  website?: string;
  passwordHash?: string;
}

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'negotiating';

export interface QuoteData {
  id: string;
  lastUpdated?: number;
  date: string;
  dueDate?: string;
  number: string;
  company: CompanyProfile;
  client: ClientDetails;
  items: QuoteItem[];
  notes?: string;
  discount?: number;
  discountPercent?: number;
  status: QuoteStatus;
  signature?: string;
  clientFeedback?: string;
}

export const INITIAL_QUOTE: QuoteData = {
  id: '',
  date: new Date().toISOString().split('T')[0],
  number: 'ORC001',
  company: {
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    email: '',
    telefone: '',
    brand_color: '#2563eb',
    tipo_empresa: 'pessoa_juridica'
  },
  client: {
    name: '',
    personType: 'PJ',
  },
  items: [],
  notes: 'Orçamento válido por 15 dias. Pagamento: 50% na aprovação e 50% na entrega.',
  discount: 0,
  discountPercent: 0,
  status: 'pending'
};
