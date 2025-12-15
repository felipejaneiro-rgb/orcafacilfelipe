
import { SavedClient, ClientDetails } from '../types';

const CLIENTS_KEY = 'orcaFacil_clients';

export interface PaginatedClientResponse {
  data: SavedClient[];
  total: number;
  page: number;
  totalPages: number;
}

let clientCache: SavedClient[] | null = null;

const generateMockClients = (): SavedClient[] => {
  return [
    { 
        id: 'CLT1', 
        name: 'Tech Solutions Ltda', 
        personType: 'PJ', 
        document: '12.345.678/0001-90', 
        email: 'contato@techsolutions.com.br', 
        phone: '(11) 98765-4321', 
        address: 'Av. Paulista, 1000, SP',
        createdAt: new Date().toISOString()
    },
    { 
        id: 'CLT2', 
        name: 'João da Silva', 
        personType: 'PF', 
        document: '123.456.789-00', 
        email: 'joao.silva@email.com', 
        phone: '(21) 99999-8888', 
        address: 'Rua das Flores, 123, RJ',
        createdAt: new Date().toISOString()
    },
    { 
        id: 'CLT3', 
        name: 'Mercado Preço Bom', 
        personType: 'PJ', 
        document: '98.765.432/0001-10', 
        email: 'compras@precobom.com', 
        phone: '(31) 3333-4444', 
        address: 'Rua do Comércio, 500, MG',
        createdAt: new Date().toISOString()
    }
  ];
};

const ensureClientCache = () => {
    if (clientCache) return clientCache;
    try {
        const raw = localStorage.getItem(CLIENTS_KEY);
        if (raw) {
            clientCache = JSON.parse(raw);
        } else {
            clientCache = generateMockClients();
            localStorage.setItem(CLIENTS_KEY, JSON.stringify(clientCache));
        }
    } catch (e) {
        clientCache = [];
    }
    return clientCache!;
};

const persistClientCache = () => {
    if (clientCache) {
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(clientCache));
    }
};

export const clientService = {
  getClients: (): SavedClient[] => {
    const clients = ensureClientCache();
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  },

  getPaginated: async (page: number, limit: number, query: string = ''): Promise<PaginatedClientResponse> => {
    // Removed artificial delay
    const clients = ensureClientCache();

    // 1. Filter
    let filtered = clients;
    if (query) {
        const term = query.toLowerCase();
        filtered = clients.filter(c => 
        c.name.toLowerCase().includes(term) ||
        (c.document && c.document.includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
        );
    }

    // 2. Sort (Alphabetical)
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    // 3. Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = filtered.slice(startIndex, startIndex + limit);

    return {
        data,
        total,
        page,
        totalPages
    };
  },

  saveClient: (client: Omit<SavedClient, 'id' | 'createdAt'> & { id?: string }): SavedClient[] => {
    const clients = ensureClientCache();
    
    if (client.id) {
        // Update
        const index = clients.findIndex(c => c.id === client.id);
        if (index >= 0) {
            clients[index] = { ...clients[index], ...client };
        }
    } else {
        // Create
        const ids = clients.map(c => parseInt(c.id.replace(/\D/g, '')) || 0);
        const nextId = `CLT${Math.max(0, ...ids) + 1}`;
        
        const newClient: SavedClient = {
            ...client,
            id: nextId,
            createdAt: new Date().toISOString()
        };
        clients.unshift(newClient); // Add to top
    }
    
    persistClientCache();
    return [...clients];
  },

  deleteClient: (id: string): SavedClient[] => {
    const clients = ensureClientCache();
    clientCache = clients.filter(c => c.id !== id);
    persistClientCache();
    return clientCache;
  },

  autoSaveClient: (clientDetails: ClientDetails): boolean => {
    if (!clientDetails.name) return false;

    const clients = ensureClientCache();
    const cleanDoc = clientDetails.document?.replace(/\D/g, '') || '';
    
    const exists = clients.some(c => {
        if (cleanDoc && c.document) {
            return c.document.replace(/\D/g, '') === cleanDoc;
        }
        return c.name.trim().toLowerCase() === clientDetails.name.trim().toLowerCase();
    });

    if (!exists) {
        clientService.saveClient({
            name: clientDetails.name,
            personType: clientDetails.personType || 'PJ',
            document: clientDetails.document,
            email: clientDetails.email,
            phone: clientDetails.phone,
            address: clientDetails.address
        });
        return true;
    }

    return false;
  }
};
