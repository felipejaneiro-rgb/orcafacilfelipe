import { QuoteData } from '../types';

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  total: number;
}

/**
 * Calcula os totais de um orçamento de forma centralizada.
 * Garante consistência entre a visualização, PDF e relatórios.
 */
export const calculateQuoteTotals = (quote: QuoteData): QuoteTotals => {
  if (!quote.items || quote.items.length === 0) {
    return { subtotal: 0, discount: 0, total: 0 };
  }

  // 1. Calcular Subtotal
  const subtotal = quote.items.reduce((acc, item) => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    return acc + (qty * price);
  }, 0);

  // 2. Calcular Desconto
  // A prioridade é o valor monetário salvo em 'discount', 
  // mas garantimos que não exceda o subtotal.
  let discount = quote.discount || 0;
  
  if (discount > subtotal) {
    discount = subtotal;
  }
  
  if (discount < 0) {
    discount = 0;
  }

  // 3. Calcular Total
  const total = subtotal - discount;

  return {
    subtotal,
    discount,
    total
  };
};
