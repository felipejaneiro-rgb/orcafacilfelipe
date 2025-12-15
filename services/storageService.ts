
import { QuoteData, QuoteStatus, INITIAL_QUOTE } from '../types';

const HISTORY_KEY = 'orcaFacil_history';
const INITIALIZED_KEY = 'orcaFacil_initialized_v1'; // Flag to prevent data regeneration

// --- MEMORY CACHE (Performance Layer) ---
// Keeps data in RAM to avoid expensive JSON.parse() on every render
let memoryCache: QuoteData[] | null = null;

// Helper to generate next Quote ID (O1, O2, etc) - Internal System ID
const getNextQuoteId = (quotes: QuoteData[]): string => {
  const ids = quotes.map(q => {
    if (!q.id) return 0;
    const match = q.id.match(/^O(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  });
  
  const maxId = Math.max(0, ...ids);
  return `O${maxId + 1}`;
};

// --- MOCK DATA GENERATOR ---
const generateInitialMockData = (): QuoteData[] => {
  const clients = [
    { name: "Supermercado Preço Bom", doc: "12.345.678/0001-90", type: 'PJ', phone: "(11) 98765-4321" },
    { name: "João da Silva", doc: "123.456.789-00", type: 'PF', phone: "(21) 99999-9999" },
    { name: "Tech Solutions Ltda", doc: "98.765.432/0001-10", type: 'PJ', phone: "(31) 3333-4444" },
    { name: "Maria Oliveira Arquiteta", doc: "111.222.333-44", type: 'PF', phone: "(41) 98888-7777" },
    { name: "Condomínio Edifício Solar", doc: "45.678.901/0001-23", type: 'PJ', phone: "(51) 3232-1010" },
    { name: "Mecânica Rápida", doc: "22.333.444/0001-55", type: 'PJ', phone: "(61) 99191-2020" }
  ];

  const services = [
    { desc: "Consultoria Mensal", price: 1500 },
    { desc: "Desenvolvimento de Site", price: 3500 },
    { desc: "Manutenção Elétrica", price: 450 },
    { desc: "Instalação de Ar Condicionado", price: 600 }
  ];

  const statuses: QuoteStatus[] = ['pending', 'approved', 'rejected', 'approved', 'pending'];

  return Array.from({ length: 15 }).map((_, index) => {
    const client = clients[index % clients.length];
    const randomService = services[Math.floor(Math.random() * services.length)];
    const randomStatus = statuses[index % statuses.length];
    
    // Random date in last 3 months
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));

    return {
      ...INITIAL_QUOTE,
      id: `O${index + 1}`, // Standardized ID
      number: `ORC${1000 + index}`, // New format
      date: date.toISOString().split('T')[0],
      lastUpdated: date.getTime(),
      status: randomStatus,
      company: {
        name: "Minha Empresa Exemplo Ltda",
        document: "00.000.000/0001-00",
        email: "contato@minhaempresa.com",
        phone: "(11) 99999-0000",
        address: "Av. Paulista, 1000 - São Paulo, SP"
      },
      client: {
        name: client.name,
        document: client.doc,
        personType: client.type as 'PF' | 'PJ',
        phone: client.phone,
        email: `contato@${client.name.split(' ')[0].toLowerCase()}.com`
      },
      items: [
        {
          id: crypto.randomUUID(),
          description: randomService.desc,
          quantity: 1,
          unitPrice: randomService.price
        }
      ],
      notes: "Pagamento em até 3x sem juros."
    };
  });
};

export interface PaginatedResponse {
  data: QuoteData[];
  total: number;
  page: number;
  totalPages: number;
}

// Internal helper to ensure cache is populated
const ensureCache = () => {
    if (memoryCache) return memoryCache;

    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const isInitialized = localStorage.getItem(INITIALIZED_KEY);

        if (raw) {
            memoryCache = JSON.parse(raw);
        } else if (!isInitialized) {
            // Only generate mock data if NEVER initialized before
            memoryCache = generateInitialMockData();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(memoryCache));
            localStorage.setItem(INITIALIZED_KEY, 'true');
        } else {
            // Initialized but empty (user deleted everything)
            memoryCache = [];
        }
    } catch (e) {
        console.error("Storage Error", e);
        memoryCache = [];
    }
    return memoryCache!;
};

// Internal helper to persist cache to disk
const persistCache = () => {
    if (memoryCache) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(memoryCache));
    }
};

export const storageService = {
  
  // List all saved quotes (Instant from RAM)
  async getAll(): Promise<QuoteData[]> {
    const history = ensureCache();
    // Return a copy to prevent reference mutation issues outside
    return [...history].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  },

  // Optimized Pagination List
  async getPaginated(page: number, limit: number, query: string = ''): Promise<PaginatedResponse> {
    // No artificial delay needed for reads anymore, providing Snappy UI
    const history = ensureCache();

    // 1. Filter
    let filtered = history;
    if (query) {
        const term = query.toLowerCase();
        filtered = history.filter(q => 
            (q.id && q.id.toLowerCase().includes(term)) ||
            (q.client.name && q.client.name.toLowerCase().includes(term)) || 
            (q.number && q.number.toLowerCase().includes(term)) ||
            (q.client.document && q.client.document.includes(term)) ||
            (q.date && q.date.includes(term)) ||
            (q.company.name && q.company.name.toLowerCase().includes(term))
        );
    }

    // 2. Sort
    filtered.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

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

  // GENERATE NEXT QUOTE NUMBER (e.g., ORC758)
  async getNextQuoteNumber(): Promise<string> {
      const quotes = ensureCache();
      
      let maxNumber = 0;

      quotes.forEach(q => {
          if (!q.number) return;
          // Extract digits from the string (e.g., "ORC757" -> 757)
          const cleanNumber = q.number.toString().replace(/\D/g, ''); 
          if (cleanNumber) {
              const num = parseInt(cleanNumber, 10);
              if (!isNaN(num) && num > maxNumber) {
                  maxNumber = num;
              }
          }
      });
      
      const nextNum = maxNumber > 0 ? maxNumber + 1 : 1;
      return `ORC${nextNum}`;
  },

  // Save or Update a quote
  async save(quote: QuoteData): Promise<QuoteData> {
    return new Promise((resolve) => {
      // Small delay only on write to allow UI to show "Saving..." state
      setTimeout(() => {
        const history = ensureCache();
        let quoteToSave: QuoteData;

        if (quote.id) {
            // Update existing
            quoteToSave = {
                ...quote,
                lastUpdated: Date.now(),
                status: quote.status || 'pending'
            };
            const index = history.findIndex(q => q.id === quote.id);
            if (index >= 0) history[index] = quoteToSave;
        } else {
            // Create New
            quoteToSave = {
                ...quote,
                id: getNextQuoteId(history),
                lastUpdated: Date.now(),
                status: quote.status || 'pending'
            };
            history.push(quoteToSave);
        }

        persistCache(); // Sync to Disk
        resolve(quoteToSave);
      }, 300);
    });
  },

  // Update only status
  async updateStatus(id: string, status: QuoteStatus): Promise<void> {
    const history = ensureCache();
    const index = history.findIndex(q => q.id === id);
    if (index >= 0) {
        history[index].status = status;
        history[index].lastUpdated = Date.now();
        persistCache();
    }
  },

  // Delete a quote
  async delete(id: string): Promise<void> {
    const history = ensureCache();
    memoryCache = history.filter(q => q.id !== id);
    persistCache();
  }
};
