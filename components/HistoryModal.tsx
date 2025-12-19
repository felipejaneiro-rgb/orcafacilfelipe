
import React, { useEffect, useState, useCallback } from 'react';
import { QuoteData, QuoteStatus } from '../types';
import { storageService, PaginatedResponse } from '../services/storageService';
import Button from './ui/Button';
import Input from './ui/Input';
import { calculateQuoteTotals } from '../utils/calculations';
import { 
    Search, 
    CheckCircle, 
    XCircle, 
    Clock,
    ThumbsUp,
    ThumbsDown,
    Edit3,
    Lock,
    ChevronLeft,
    ChevronRight,
    FileText,
    Copy
} from 'lucide-react';

interface Props {
  isOpen: boolean; 
  onClose: () => void;
  onLoadQuote: (quote: QuoteData) => void;
}

const HistoryModal: React.FC<Props> = ({ onLoadQuote }) => {
  const [data, setData] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 8;

  const fetchQuotes = useCallback(async (p: number, search: string) => {
    setLoading(true);
    const result: PaginatedResponse = await storageService.getPaginated(p, LIMIT, search);
    setData(result.data);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
    setLoading(false);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setPage(1); // Reset to page 1 on new search
        fetchQuotes(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchQuotes]);

  // Page change effect
  useEffect(() => {
    fetchQuotes(page, searchTerm);
  }, [page, fetchQuotes]); 

  const handleStatusUpdate = async (id: string, status: QuoteStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setData(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    await storageService.updateStatus(id, status);
    fetchQuotes(page, searchTerm); 
  };

  const handleDuplicate = (e: React.MouseEvent, quote: QuoteData) => {
    e.stopPropagation();
    
    const clonedQuote: QuoteData = {
        ...quote,
        id: '', 
        number: '', 
        date: new Date().toISOString().split('T')[0],
        dueDate: undefined,
        status: 'pending',
        notes: quote.notes || 'Orçamento válido por 15 dias.',
    };

    if (confirm(`Deseja criar um novo orçamento com base no cliente "${quote.client.name}"?`)) {
        onLoadQuote(clonedQuote);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
        case 'approved':
            return (
                <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-green-200 dark:border-green-800">
                    <CheckCircle size={12} className="mr-1.5" /> Aprovado
                </span>
            );
        case 'rejected':
            return (
                <span className="inline-flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-red-200 dark:border-red-800">
                    <XCircle size={12} className="mr-1.5" /> Rejeitado
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                    <Clock size={12} className="mr-1.5" /> Pendente
                </span>
            );
    }
  };

  return (
    <div className="flex flex-col h-auto md:h-full space-y-4 animate-fadeIn pb-20 md:pb-0">
        
        {/* Header & Filter */}
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Meus Orçamentos</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {totalItems} orçamentos encontrados.
                    </p>
                </div>
                <div className="w-full md:w-96">
                     <Input 
                        placeholder="Buscar cliente, número..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                        containerClassName="!mb-0"
                     />
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-1 md:overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           
           {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
                 <div className="animate-spin mb-2"><Clock size={32} /></div>
                 Carregando...
             </div>
           ) : data.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                <FileText size={40} className="mb-2 opacity-30"/>
                Nenhum orçamento encontrado.
             </div>
           ) : (
             <>
               {/* --- DESKTOP TABLE (MD+) --- */}
               <div className="hidden md:block overflow-x-auto md:flex-1 md:overflow-auto">
                 <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Status</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Nº</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Data</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36 text-right">Total</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.map((quote) => {
                            const { total } = calculateQuoteTotals(quote);
                            const isFinalized = quote.status === 'approved' || quote.status === 'rejected';

                            return (
                                <tr 
                                    key={quote.id} 
                                    onClick={() => onLoadQuote(quote)}
                                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group odd:bg-white dark:odd:bg-gray-800 even:bg-gray-50/30 dark:even:bg-gray-750/30"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(quote.status || 'pending')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        #{quote.number}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {quote.client.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(quote.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-gray-200 text-right">
                                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {isFinalized ? (
                                                <div className="p-1.5 text-gray-300 dark:text-gray-600">
                                                    <Lock size={16} />
                                                </div>
                                            ) : (
                                                <Button 
                                                    variant="ghost"
                                                    className="!p-1.5 h-auto"
                                                    onClick={(e) => { e.stopPropagation(); onLoadQuote(quote); }}
                                                    title="Editar"
                                                >
                                                    <Edit3 size={18} className="text-gray-400 hover:text-brand-600" />
                                                </Button>
                                            )}
                                            
                                            {!isFinalized && (
                                                <>
                                                    <Button 
                                                        variant="ghost"
                                                        className="!p-1.5 h-auto"
                                                        onClick={(e) => handleStatusUpdate(quote.id, 'approved', e)}
                                                        title="Aprovar"
                                                    >
                                                        <ThumbsUp size={18} className="text-gray-400 hover:text-green-600" />
                                                    </Button>
                                                    
                                                    <Button 
                                                        variant="ghost"
                                                        className="!p-1.5 h-auto"
                                                        onClick={(e) => handleStatusUpdate(quote.id, 'rejected', e)}
                                                        title="Rejeitar"
                                                    >
                                                        <ThumbsDown size={18} className="text-gray-400 hover:text-red-600" />
                                                    </Button>
                                                </>
                                            )}
                                            
                                            <Button 
                                                variant="ghost"
                                                className="!p-1.5 h-auto"
                                                onClick={(e) => handleDuplicate(e, quote)}
                                                title="Clonar"
                                            >
                                                <Copy size={18} className="text-gray-400 hover:text-brand-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                 </table>
               </div>

               {/* --- MOBILE CARD LIST (<MD) --- */}
               <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                    {data.map((quote) => {
                        const { total } = calculateQuoteTotals(quote);
                        const isFinalized = quote.status === 'approved' || quote.status === 'rejected';

                        return (
                            <div 
                                key={quote.id}
                                onClick={() => onLoadQuote(quote)} 
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                            #{quote.number}
                                        </span>
                                        {getStatusBadge(quote.status || 'pending')}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(quote.date).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                                        {quote.client.name}
                                    </h3>
                                    {/* Fixed: Using nome_fantasia instead of name */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {quote.company.nome_fantasia}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total</span>
                                        <span className="text-lg font-bold text-gray-800 dark:text-gray-200 font-mono">
                                            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {/* Quick Actions Mobile */}
                                        {!isFinalized && (
                                            <>
                                                <button 
                                                    onClick={(e) => handleStatusUpdate(quote.id, 'approved', e)}
                                                    className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-lg"
                                                >
                                                    <ThumbsUp size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleStatusUpdate(quote.id, 'rejected', e)}
                                                    className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg"
                                                >
                                                    <ThumbsDown size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={(e) => handleDuplicate(e, quote)}
                                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
               </div>
             </>
           )}

           {/* Pagination Footer */}
           <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-4 shrink-0">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Página <span className="font-bold">{page}</span> de <span className="font-bold">{Math.max(1, totalPages)}</span>
                </span>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="!px-3 !py-1.5 h-9"
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                        className="!px-3 !py-1.5 h-9"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
           </div>
        </div>
    </div>
  );
};

export default HistoryModal;
