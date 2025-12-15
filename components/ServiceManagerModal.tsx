
import React, { useState, useEffect } from 'react';
import { SavedService } from '../types';
import { catalogService } from '../services/catalogService';
import { X, Plus, Trash2, Package, Save, Ban } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Trigger parent refresh
}

const ServiceManagerModal: React.FC<Props> = ({ isOpen, onClose, onUpdate }) => {
  const [services, setServices] = useState<SavedService[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadServices();
      setIsCreating(false); // Reset Form state
    }
  }, [isOpen]);

  const loadServices = () => {
    setServices(catalogService.getServices());
  };

  const handleAdd = () => {
    if (!newDesc) return;
    const updated = catalogService.addService({
      description: newDesc,
      defaultPrice: parseFloat(newPrice) || 0
    });
    setServices(updated);
    setNewDesc('');
    setNewPrice('');
    // We keep isCreating true to allow rapid entry of multiple items
    onUpdate();
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este serviço?')) {
        const updated = catalogService.deleteService(id);
        setServices(updated);
        onUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-brand-600 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-semibold text-lg flex items-center">
            <Package className="mr-2" size={20} />
            Gerenciar Catálogo
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 flex flex-col">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center shrink-0">
             <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Meus Serviços</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie preços e descrições padrão.</p>
             </div>
             {!isCreating && (
                 <Button onClick={() => setIsCreating(true)} size="sm">
                    <Plus size={18} className="mr-2" />
                    Novo Serviço
                 </Button>
             )}
          </div>

          {/* Create Form (Conditional) */}
          {isCreating && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-brand-200 dark:border-gray-600 animate-fadeIn shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider">Adicionar Novo</h4>
                    <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={16} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-7">
                        <Input 
                            label="Descrição"
                            placeholder="Ex: Formatação de Computador" 
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="md:col-span-3">
                        <Input 
                            label="Preço (R$)"
                            placeholder="0,00" 
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                        <Button 
                            onClick={handleAdd} 
                            disabled={!newDesc} 
                            className="w-full !px-0 flex justify-center"
                            title="Salvar"
                        >
                            <Save size={20} />
                        </Button>
                    </div>
                </div>
            </div>
          )}

          {/* List - Table View */}
          <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Descrição</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right w-32 border-b border-gray-200 dark:border-gray-700">Preço</th>
                    <th className="px-5 py-3 w-20 border-b border-gray-200 dark:border-gray-700 text-center">Ações</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {services.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                                <Package className="h-10 w-10 mb-2 opacity-20" />
                                <p>Nenhum serviço salvo ainda.</p>
                                {!isCreating && (
                                    <button 
                                        onClick={() => setIsCreating(true)}
                                        className="mt-2 text-brand-600 hover:underline text-sm font-medium"
                                    >
                                        Cadastrar o primeiro
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ) : (
                    services.map(service => (
                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                        <td className="px-5 py-3.5 text-sm text-gray-800 dark:text-white font-medium">
                        {service.description}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 text-right font-mono">
                        {service.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                        <button 
                            onClick={() => handleDelete(service.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceManagerModal;
