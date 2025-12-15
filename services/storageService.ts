import { QuoteData, QuoteStatus, INITIAL_QUOTE } from '../types';

const HISTORY_KEY = 'orcaFacil_history';

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

        if (raw) {
            memoryCache = JSON.parse(raw);
        } else {
            // Start empty - NO MOCK DATA
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

        persistCache(); 
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