
import React, { useState, useEffect } from 'react';
import { QuoteData, QuoteItem, SavedService, SavedProduct } from '../types';
import { Plus, Trash2, DollarSign, Package, AlertCircle, Settings, ArrowUp, ArrowDown, TrendingUp, Hammer, ShoppingCart, Calculator } from 'lucide-react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { calculateQuoteTotals } from '../utils/calculations';
import { catalogService } from '../services/catalogService';
import ServiceManagerModal from './ServiceManagerModal';

interface Props {
  data: QuoteData;
  updateData: (data: Partial<QuoteData>) => void;
}

const ItemsForm: React.FC<Props> = ({ data, updateData }) => {
  const [newItem, setNewItem] = useState<Omit<QuoteItem, 'id'>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    cost: 0,
    unit: 'un', // Default unit
    type: 'service' // Default type
  });

  const [savedServices, setSavedServices] = useState<SavedService[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [activeCatalogType, setActiveCatalogType] = useState<'service' | 'product'>('service');
  
  const [showManager, setShowManager] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [showCostColumn, setShowCostColumn] = useState(true); // Default to true now since math is requested

  // Carregar serviços/produtos ao montar
  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = () => {
    setSavedServices(catalogService.getServices());
    setSavedProducts(catalogService.getProducts());
  };

  // --- CÁLCULOS FINANCEIROS ---
  const { subtotal, discount, total: totalRevenue } = calculateQuoteTotals(data);

  // Soma dos Custos (Produtos + Serviços)
  const totalCosts = data.items.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0);
  
  // Lucro Bruto (Venda sem desconto - Custos)
  const grossProfit = subtotal - totalCosts;

  // Lucro Líquido (Venda com desconto - Custos)
  const netProfit = totalRevenue - totalCosts;
  
  // Margem de Lucro Real
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handleAddItem = () => {
    if (!newItem.description) return;

    const item: QuoteItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      type: activeCatalogType // Ensure type captures current tab if manual
    };

    updateData({
      items: [...data.items, item]
    });

    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      cost: 0,
      unit: 'un',
      type: activeCatalogType
    });
    setSelectedCatalogId(''); // Reset dropdown
  };

  const handleRemoveItem = (id: string) => {
    updateData({
      items: data.items.filter(item => item.id !== id)
    });
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    updateData({
      items: data.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...data.items];
    if (direction === 'up' && index > 0) {
        [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    updateData({ items: newItems });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleDiscountValueChange = (value: number) => {
    const newPercent = subtotal > 0 ? (value / subtotal) * 100 : 0;
    updateData({ 
      discount: value,
      discountPercent: parseFloat(newPercent.toFixed(2))
    });
  };

  const handleDiscountPercentChange = (percent: number) => {
    const newValue = (subtotal * percent) / 100;
    updateData({ 
      discount: parseFloat(newValue.toFixed(2)),
      discountPercent: percent
    });
  };

  // Mantém a lógica de sincronização
  useEffect(() => {
    if (data.discountPercent && data.discountPercent > 0 && subtotal > 0) {
      const expectedValue = (subtotal * data.discountPercent) / 100;
      if (Math.abs((data.discount || 0) - expectedValue) > 0.05) {
         updateData({ discount: parseFloat(expectedValue.toFixed(2)) });
      }
    }
  }, [subtotal, data.discountPercent]);

  const handleCatalogSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCatalogId(id);
    
    if (id === '') return;

    if (activeCatalogType === 'service') {
        const service = savedServices.find(s => s.id === id);
        if (service) {
            setNewItem(prev => ({
                ...prev,
                description: service.description,
                unitPrice: service.defaultPrice,
                unit: 'un',
                type: 'service'
            }));
        }
    } else {
        const product = savedProducts.find(p => p.id === id);
        if (product) {
            setNewItem(prev => ({
                ...prev,
                description: product.description,
                unitPrice: product.defaultPrice,
                unit: product.unit || 'un',
                type: 'product'
            }));
        }
    }
  };

  // Helper formatting
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 animate-fadeIn">
      <ServiceManagerModal 
        isOpen={showManager} 
        onClose={() => setShowManager(false)} 
        onUpdate={loadCatalog}
      />

      {/* Add Item Form */}
      <Card title="Adicionar Itens" icon={<Package size={24} />}>
        {/* Service/Product Selector */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
             {/* Toggle */}
             <div className="flex gap-2">
                 <button 
                    onClick={() => { setActiveCatalogType('service'); setSelectedCatalogId(''); setNewItem(p => ({...p, type: 'service'})); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeCatalogType === 'service' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                 >
                     <Hammer size={12} /> Serviços
                 </button>
                 <button 
                    onClick={() => { setActiveCatalogType('product'); setSelectedCatalogId(''); setNewItem(p => ({...p, type: 'product'})); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeCatalogType === 'product' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                 >
                     <ShoppingCart size={12} /> Produtos
                 </button>
             </div>

             <div className="flex flex-col sm:flex-row gap-3 items-center">
                <select 
                    value={selectedCatalogId}
                    onChange={handleCatalogSelect}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                >
                    <option value="">
                        {activeCatalogType === 'service' ? 'Selecione um serviço salvo...' : 'Selecione um produto salvo...'}
                    </option>
                    {activeCatalogType === 'service' 
                        ? savedServices.map(s => (
                            <option key={s.id} value={s.id}>{s.description} - {s.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                          ))
                        : savedProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.description} ({p.unit}) - {p.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                          ))
                    }
                </select>
                <div className="pb-0.5">
                    <Button variant="secondary" onClick={() => setShowManager(true)} className="text-xs whitespace-nowrap !py-2">
                        <Settings size={14} className="mr-1.5" />
                        Gerenciar
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-2 md:gap-4 items-end">
          <div className="col-span-12 md:col-span-5">
            <Input
              label="Descrição"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Descrição do item"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
          </div>
          <div className="col-span-3 md:col-span-2">
            <Input
              label="Qtd"
              type="number"
              min={1}
              value={newItem.quantity}
              onFocus={handleFocus}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
              className="text-center"
            />
          </div>
          
          <div className="col-span-3 md:col-span-1">
             <Input
                label="Un"
                value={newItem.unit || 'un'}
                onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                className="text-center text-xs px-1"
                placeholder="un"
             />
          </div>

          <div className="col-span-6 md:col-span-2">
            <Input
              label="Preço Venda"
              type="number"
              min={0}
              step="0.01"
              value={newItem.unitPrice || ''}
              onFocus={handleFocus}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0,00"
            />
          </div>
          <div className="col-span-12 md:col-span-2 pb-0.5">
            <Button
              onClick={handleAddItem}
              disabled={!newItem.description}
              className="w-full h-[46px]"
              title="Adicionar"
            >
              <Plus size={24} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Items List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-3 border-b border-blue-100 dark:border-blue-900/50 flex justify-between items-center">
           <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
             <AlertCircle size={16} className="mr-2 shrink-0" />
             <span>Clique para editar.</span>
           </div>
           
           <label className="flex items-center text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showCostColumn}
                onChange={() => setShowCostColumn(!showCostColumn)}
                className="mr-2 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Ver Coluna Custo
           </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-3 w-10"></th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10 text-center">Tipo</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">Descrição</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 text-center">Qtd</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16 text-center">Un</th>
                {showCostColumn && (
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-24 text-right">Custo Unit</th>
                )}
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32 text-right">Total</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={showCostColumn ? 8 : 7} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                    Nenhum item adicionado ainda.
                  </td>
                </tr>
              ) : (
                data.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                    <td className="px-2 py-3 text-center">
                        <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleMoveItem(index, 'up')} 
                                disabled={index === 0}
                                className="p-0.5 hover:text-brand-600 disabled:opacity-30"
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button 
                                onClick={() => handleMoveItem(index, 'down')}
                                disabled={index === data.items.length - 1}
                                className="p-0.5 hover:text-brand-600 disabled:opacity-30"
                            >
                                <ArrowDown size={14} />
                            </button>
                        </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                        {/* Removed title property from icons to fix TypeScript error */}
                        {item.type === 'product' ? (
                            <ShoppingCart size={14} className="text-orange-500 inline" />
                        ) : (
                            <Hammer size={14} className="text-blue-500 inline" />
                        )}
                    </td>
                    <td className="px-3 py-3">
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/50 rounded px-2 py-1 transition-all outline-none text-gray-800 dark:text-white font-medium"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input 
                        type="number" 
                        min="0"
                        value={item.quantity}
                        onFocus={handleFocus}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        className="w-full bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/50 rounded px-2 py-1 transition-all outline-none text-center text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-3">
                        <input 
                            type="text" 
                            value={item.unit || 'un'}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            className="w-full text-center text-xs text-gray-500 bg-transparent border-none outline-none focus:bg-white dark:focus:bg-gray-700 rounded"
                        />
                    </td>
                    
                    {showCostColumn && (
                        <td className="px-3 py-3 text-right">
                        <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={item.cost || 0}
                            onFocus={handleFocus}
                            onChange={(e) => handleUpdateItem(item.id, 'cost', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-full bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/50 rounded px-2 py-1 transition-all outline-none text-right text-gray-500 dark:text-gray-400 font-mono text-sm"
                        />
                        </td>
                    )}

                    <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {fmt(item.quantity * item.unitPrice)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all md:opacity-0 group-hover:opacity-100 opacity-100"
                        title="Remover item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Observações / Condições">
          <textarea
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="w-full h-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Ex: Prazo de entrega, validade da proposta, formas de pagamento..."
          ></textarea>
        </Card>

        <div className="space-y-4">
             
             {/* Client Totals Card */}
            <Card className="flex flex-col justify-center">
            <div className="space-y-4">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-medium text-lg">{fmt(subtotal)}</span>
                </div>
                
                {/* Área de Descontos */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DollarSign size={16} className="mr-1"/> Descontos
                    </div>
                    <div className="flex gap-3">
                        {/* Input Percentual */}
                        <div className="flex-1 relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs font-bold">%</span>
                            <input 
                            type="number" 
                            min="0"
                            max="100"
                            step="0.1"
                            value={data.discountPercent === 0 ? '' : data.discountPercent} 
                            onFocus={handleFocus}
                            onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-6 pr-2 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0%"
                            />
                        </div>
                        {/* Input Monetário */}
                        <div className="flex-[2] relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs font-bold">R$</span>
                            <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={data.discount === 0 ? '' : data.discount} 
                            onFocus={handleFocus}
                            onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
                            className="w-full text-right border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700"
                            placeholder="0,00"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>

            <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-brand-700 dark:text-brand-400">{fmt(totalRevenue)}</span>
            </div>
            </Card>

            {/* Profit Card (Internal Only) - ENHANCED */}
             <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-5 rounded-xl shadow-md border border-gray-700 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10">
                    <TrendingUp size={80} />
                </div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Calculator size={14}/> Gestão Financeira (Interno)
                </h4>
                
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Venda (Bruto)</span>
                        <span className="font-mono">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-300/80">
                        <span className="flex items-center gap-1"><span className="text-[10px]">(-)</span> Descontos</span>
                        <span className="font-mono">{discount > 0 ? `-${fmt(discount)}` : 'R$ 0,00'}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-300/80">
                        <span className="flex items-center gap-1"><span className="text-[10px]">(-)</span> Custos Totais</span>
                        <span className="font-mono">{totalCosts > 0 ? `-${fmt(totalCosts)}` : 'R$ 0,00'}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-gray-300 font-bold">Lucro Líquido</span>
                            <div className={`text-[10px] ${marginPercent >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                                Margem: {marginPercent.toFixed(1)}%
                            </div>
                        </div>
                        <span className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {fmt(netProfit)}
                        </span>
                    </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsForm;
