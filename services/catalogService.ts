import { SavedService, SavedProduct } from '../types';

const SERVICES_KEY = 'orcaFacil_services';
const PRODUCTS_KEY = 'orcaFacil_products';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Helper to generate next ID based on numeric part regardless of prefix
const getNextId = (items: { id: string }[], prefix: string): string => {
  const ids = items.map(s => parseInt(s.id.replace(/\D/g, '')) || 0);
  const maxId = Math.max(0, ...ids);
  return `${prefix}${maxId + 1}`;
};

export const catalogService = {
  // --- SERVICES ---
  getServices: (): SavedService[] => {
    try {
      const raw = localStorage.getItem(SERVICES_KEY);
      // Return saved data or empty array
      return raw ? JSON.parse(raw).sort((a: SavedService, b: SavedService) => a.description.localeCompare(b.description)) : [];
    } catch (e) {
      return [];
    }
  },

  getPaginatedServices: async (page: number, limit: number, query: string = ''): Promise<PaginatedResponse<SavedService>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const services = catalogService.getServices();
        let filtered = services;
        if (query) {
          const term = query.toLowerCase();
          filtered = services.filter(s => 
            s.description.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
          );
        }
        filtered.sort((a, b) => {
            const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
            return numB - numA; 
        });
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const data = filtered.slice(startIndex, startIndex + limit);
        resolve({ data, total, page, totalPages });
      }, 200);
    });
  },

  addService: (service: Omit<SavedService, 'id'>): SavedService[] => {
    const services = catalogService.getServices();
    const newService: SavedService = { ...service, id: getNextId(services, 'SVC') };
    const updated = [...services, newService];
    localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    return updated;
  },

  updateService: (id: string, updates: Partial<Omit<SavedService, 'id'>>): SavedService[] => {
    const services = catalogService.getServices();
    const updated = services.map(s => s.id === id ? { ...s, ...updates } : s);
    localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteService: (id: string): SavedService[] => {
    const services = catalogService.getServices();
    const updated = services.filter(s => s.id !== id);
    localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    return updated;
  },

  // --- PRODUCTS ---
  getProducts: (): SavedProduct[] => {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      // Return saved data or empty array
      return raw ? JSON.parse(raw).sort((a: SavedProduct, b: SavedProduct) => a.description.localeCompare(b.description)) : [];
    } catch (e) {
      return [];
    }
  },

  getPaginatedProducts: async (page: number, limit: number, query: string = ''): Promise<PaginatedResponse<SavedProduct>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const products = catalogService.getProducts();
        let filtered = products;
        if (query) {
          const term = query.toLowerCase();
          filtered = products.filter(s => 
            s.description.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
          );
        }
        filtered.sort((a, b) => {
            const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
            return numB - numA; 
        });
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const data = filtered.slice(startIndex, startIndex + limit);
        resolve({ data, total, page, totalPages });
      }, 200);
    });
  },

  addProduct: (product: Omit<SavedProduct, 'id'>): SavedProduct[] => {
    const products = catalogService.getProducts();
    const newProduct: SavedProduct = { ...product, id: getNextId(products, 'PDT') };
    const updated = [...products, newProduct];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
    return updated;
  },

  updateProduct: (id: string, updates: Partial<Omit<SavedProduct, 'id'>>): SavedProduct[] => {
    const products = catalogService.getProducts();
    const updated = products.map(s => s.id === id ? { ...s, ...updates } : s);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteProduct: (id: string): SavedProduct[] => {
    const products = catalogService.getProducts();
    const updated = products.filter(s => s.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
    return updated;
  }
};