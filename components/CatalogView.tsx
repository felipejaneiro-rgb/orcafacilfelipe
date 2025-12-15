
import React, { useState, useEffect, useCallback } from 'react';
import { SavedService, SavedProduct, UnitOfMeasure } from '../types';
import { catalogService, PaginatedResponse } from '../services/catalogService';
import { Plus, Trash2, Package, Save, X, Search, Edit3, ChevronLeft, ChevronRight, Loader2, Hammer, ShoppingCart, Tag } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';

type CatalogType = 'service' | 'product';

const CatalogView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogType>('service');
  const [items, setItems] = useState<(SavedService | SavedProduct)[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 8;

  // Form States
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState<UnitOfMeasure>('un');

  const fetchItems = useCallback(async (p: number, search: string, type: CatalogType) => {
    setLoading(true);
    let result: PaginatedResponse<SavedService | SavedProduct>;
    
    if (type === 'service') {
        result = await catalogService.getPaginatedServices(p, LIMIT, search);
    } else {
        result = await catalogService.getPaginatedProducts(p, LIMIT, search);
    }

    setItems(result.data);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
    setLoading(false);
  }, []);

  // Effect for Search Debounce & Initial Load
  useEffect(() => {
    const timer = setTimeout(() => {
        const targetPage = searchTerm ? 1 : page; 
        if (searchTerm) setPage(1); 
        fetchItems(targetPage, searchTerm, activeTab);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchItems, activeTab]); 

  // Effect for Page Change
  useEffect(() => {
    fetchItems(page, searchTerm, activeTab);
  }, [page]); 

  const handleTabChange = (type: CatalogType) => {
      setActiveTab(type);
      setPage(1);
      setSearchTerm('');
      handleCloseForm();
  };

  const handleSave = async () => {
    if (!newDesc) return;

    if (activeTab === 'service') {
        if (editingId) {
            catalogService.updateService(editingId, {
                description: newDesc,
                defaultPrice: parseFloat(newPrice) || 0
            });
            handleCloseForm();
        } else {
            catalogService.addService({
                description: newDesc,
                defaultPrice: parseFloat(newPrice) || 0
            });
            setNewDesc('');
            setNewPrice('');
        }
    } else {
        // Product
        if (editingId) {
            catalogService.updateProduct(editingId, {
                description: newDesc,
                defaultPrice: parseFloat(newPrice) || 0,
                unit: newUnit
            });
            handleCloseForm();
        } else {
            catalogService.addProduct({
                description: newDesc,
                defaultPrice: parseFloat(newPrice) || 0,
                unit: newUnit
            });
            setNewDesc('');
            setNewPrice('');
            setNewUnit('un');
        }
    }
    fetchItems(page, searchTerm, activeTab);
  };

  const handleEdit = (item: SavedService | SavedProduct) => {
      setEditingId(item.id);
      setNewDesc(item.description);
      setNewPrice(item.defaultPrice.toString());
      if ('unit' in item) {
          setNewUnit((item as SavedProduct).unit);
      }
      setIsCreating(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNew = () => {
      setEditingId(null);
      setNewDesc('');
      setNewPrice('');
      setNewUnit('un');
      setIsCreating(true);
  };

  const handleCloseForm = () => {
      setIsCreating(false);
      setEditingId(null);
      setNewDesc('');
      setNewPrice('');
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este item?')) {
        if (activeTab === 'service') {
            catalogService.deleteService(id);
        } else {
            catalogService.deleteProduct(id);
        }

        if (editingId === id) {
            handleCloseForm();
        }
        fetchItems(page, searchTerm, activeTab);
    }
  };

  const unitOptions: { value: UnitOfMeasure, label: string }[] = [
      { value: 'un', label: 'Unidade (un)' },
      { value: 'kg', label: 'Quilo (kg)' },
      { value: 'm', label: 'Metro (m)' },
      { value: 'm²', label: 'Metro² (m²)' },
      { value: 'm³', label: 'Metro³ (m³)' },
      { value: 'l', label: 'Litro (l)' },
      { value: 'cx', label: 'Caixa (cx)' },
      { value: 'par', label: 'Par' },
      { value: 'hr', label: 'Hora (hr)' },
      { value: 'dia', label: 'Dia' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-20 h-auto md:h-full flex flex-col">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Catálogo
                    <span className="text-xs font-normal bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                        {totalItems}
                    </span>
                </h2>
                
                {/* Tabs */}
                <div className="flex gap-2 mt-2">
                    <button 
                        onClick={() => handleTabChange('service')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'service' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                    >
                        <Hammer size={12} /> Serviços
                    </button>
                    <button 
                        onClick={() => handleTabChange('product')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'product' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                    >
                        <ShoppingCart size={12} /> Produtos
                    </button>
                </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <div className="flex-1 md:w-64">
                    <Input 
                        placeholder={activeTab === 'service' ? "Buscar serviço..." : "Buscar produto..."}
                        icon={<Search size={18} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="!mb-0"
                    />
                </div>
                {!isCreating && (
                    <Button onClick={handleOpenNew} className="whitespace-nowrap px-3 md:px-4">
                        <Plus size={18} className="md:mr-2" />
                        <span className="hidden md:inline">Novo</span>
                        <span className="md:hidden">Novo</span>
                    </Button>
                )}
            </div>
          </div>

          {/* Creation/Edit Form */}
          {isCreating && (
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-brand-200 dark:border-gray-700 shadow-lg animate-fadeIn shrink-0 ring-1 ring-brand-100 dark:ring-brand-900/20">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider flex items-center">
                        {editingId ? <Edit3 size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                        {editingId ? 'Editar Item' : 'Adicionar Novo Item'}
                    </h4>
                    <button 
                        onClick={handleCloseForm} 
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 bg-gray-50 dark:bg-gray-700 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                        <Input 
                            label="Descrição"
                            placeholder="Ex: Formatação de Computador" 
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {activeTab === 'product' && (
                        <div className="md:col-span-3">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unidade</label>
                             <select
                                value={newUnit}
                                onChange={(e) => setNewUnit(e.target.value as UnitOfMeasure)}
                                className="w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                             >
                                 {unitOptions.map(u => (
                                     <option key={u.value} value={u.value}>{u.label}</option>
                                 ))}
                             </select>
                        </div>
                    )}
                    <div className={`${activeTab === 'product' ? 'md:col-span-2' : 'md:col-span-4'}`}>
                        <Input 
                            label="Preço (R$)"
                            placeholder="0,00" 
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Button 
                            onClick={handleSave} 
                            disabled={!newDesc} 
                            className="w-full flex justify-center h-[42px]"
                            title={editingId ? "Atualizar" : "Salvar"}
                        >
                            <Save size={20} className="mr-2" />
                            {editingId ? "Salvar" : "Adicionar"}
                        </Button>
                    </div>
                </div>
            </div>
          )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
         
         {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
                 <Loader2 className="animate-spin mb-3" size={32} />
                 <p>Carregando {activeTab === 'service' ? 'serviços' : 'produtos'}...</p>
             </div>
         ) : items.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 dark:text-gray-500">
                <Package className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Nenhum item encontrado.</p>
                <p className="text-sm mt-1 max-w-xs mx-auto">
                    {searchTerm ? 'Tente buscar com outro termo.' : 'Use o botão "Novo" para cadastrar itens.'}
                </p>
             </div>
         ) : (
            <>
                {/* --- DESKTOP TABLE VIEW (MD+) --- */}
                <div className="hidden md:block overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                                {activeTab === 'product' && (
                                     <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24 text-center">Un</th>
                                )}
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right w-40">Preço</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {items.map(item => (
                                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group ${editingId === item.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                    <td className="px-6 py-4 text-xs text-gray-400 dark:text-gray-500 font-mono">
                                        #{item.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-white font-medium">
                                        {item.description}
                                    </td>
                                    {activeTab === 'product' && (
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                                                {(item as SavedProduct).unit}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 text-right font-mono">
                                        {item.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(item)}
                                                className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 p-2 rounded-lg transition-colors"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- MOBILE CARD VIEW (<MD) --- */}
                <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                    {items.map(item => (
                        <div 
                            key={item.id} 
                            className={`
                                bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border 
                                ${editingId === item.id ? 'border-brand-300 ring-1 ring-brand-200' : 'border-gray-200 dark:border-gray-700'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                        #{item.id}
                                    </span>
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                                        {item.description}
                                    </h3>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end mt-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Preço Sugerido</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-gray-700 dark:text-gray-200 font-mono">
                                            {item.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        {activeTab === 'product' && (
                                            <span className="text-xs text-gray-500">
                                                / {(item as SavedProduct).unit}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEdit(item)}
                                        className="p-2 text-brand-600 bg-brand-50 dark:bg-brand-900/30 rounded-lg active:scale-95 transition-transform"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg active:scale-95 transition-transform"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
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

export default CatalogView;
