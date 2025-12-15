import { SavedClient, ClientDetails } from '../types';

const CLIENTS_KEY = 'orcaFacil_clients';

export interface PaginatedClientResponse {
  data: SavedClient[];
  total: number;
  page: number;
  totalPages: number;
}

let clientCache: SavedClient[] | null = null;

const ensureClientCache = () => {
    if (clientCache) return clientCache;
    try {
        const raw = localStorage.getItem(CLIENTS_KEY);
        if (raw) {
            clientCache = JSON.parse(raw);
        } else {
            // Start empty - NO MOCK DATA
            clientCache = [];
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