
export interface CompanyProfile {
  name: string;
  document: string; // CNPJ or CPF
  address: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string; // Base64 string for the logo
  brandColor?: string; // Hex color for PDF branding
  showSignature?: boolean; // Toggle signature line in PDF
}

export interface ClientDetails {
  name: string;
  personType: 'PF' | 'PJ'; // Added field
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// New Interface for the CRM
export interface SavedClient extends ClientDetails {
  id: string;
  notes?: string;
  createdAt: string;
}

export type UnitOfMeasure = 'un' | 'kg' | 'm' | 'm²' | 'm³' | 'l' | 'cx' | 'par' | 'hr' | 'dia' | 'sem' | 'mes';

export interface QuoteItem {
  id: string;
  type?: 'service' | 'product'; // Field to distinguish types for calculations
  description: string;
  quantity: number;
  unit?: string; // Changed to string to allow custom units, but typed elsewhere
  unitPrice: number;
  cost?: number; // New field for profit calculation
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
  name: string; // Nome da Empresa
  document: string; // CNPJ
  email: string;
  whatsapp?: string;
  website?: string;
  passwordHash: string;
  createdAt: string;
}

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'negotiating';

export interface QuoteData {
  id: string;
  lastUpdated?: number; // Timestamp for sorting history
  date: string; // ISO String
  dueDate?: string;
  number: string; // Quote number
  company: CompanyProfile;
  client: ClientDetails;
  items: QuoteItem[];
  notes?: string;
  discount?: number; // monetary value
  discountPercent?: number; // percentage value
  status: QuoteStatus; // New field
  signature?: string; // Base64 image of the client's signature
  clientFeedback?: string; // Reason for rejection or adjustment request
}

export const INITIAL_QUOTE: QuoteData = {
  id: '',
  date: new Date().toISOString().split('T')[0],
  number: 'ORC001',
  company: {
    name: '',
    document: '',
    address: '',
    email: '',
    phone: '',
    brandColor: '#2563eb', // Default Blue-600
    showSignature: true
  },
  client: {
    name: '',
    personType: 'PJ', // Default to PJ
  },
  items: [],
  notes: 'Orçamento válido por 15 dias. Pagamento: 50% na aprovação e 50% na entrega.',
  discount: 0,
  discountPercent: 0,
  status: 'pending'
};
