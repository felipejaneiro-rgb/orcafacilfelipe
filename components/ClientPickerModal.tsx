
import React, { useState, useEffect } from 'react';
import { SavedClient } from '../types';
import { clientService } from '../services/clientService';
import { Search, User, Briefcase, X, UserPlus } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: SavedClient) => void;
}

const ClientPickerModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setClients(clientService.getClients());
      setSearchTerm('');
    }
  }, [isOpen]);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.document && c.document.includes(searchTerm))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                <UserPlus size={18} className="mr-2 text-brand-600" />
                Importar Cliente
            </h3>
            <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <Input 
                placeholder="Buscar por nome ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={18} />}
                autoFocus
                containerClassName="!mb-0"
            />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <p>Nenhum cliente encontrado.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(client => (
                        <button
                            key={client.id}
                            onClick={() => onSelect(client)}
                            className="w-full text-left p-3 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg border border-transparent hover:border-brand-200 dark:hover:border-brand-800 transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-md ${client.personType === 'PJ' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                        {client.personType === 'PJ' ? <Briefcase size={16} /> : <User size={16} />}
                                    </div>
                                    <span className="font-bold text-gray-800 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400">
                                        {client.name}
                                    </span>
                                </div>
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">
                                    {client.personType}
                                </span>
                            </div>
                            <div className="mt-1 pl-9 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-0.5">
                                {client.document && <span>Doc: {client.document}</span>}
                                {client.email && <span>{client.email}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClientPickerModal;
