
import React, { useState, useEffect, useCallback } from 'react';
import { SavedClient } from '../types';
import { clientService, PaginatedClientResponse } from '../services/clientService';
import { Plus, Trash2, Users, Save, X, Search, Edit3, ChevronLeft, ChevronRight, Loader2, Briefcase, User, Phone, Mail, MapPin } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';
import { maskCNPJ, maskCPF, maskPhone } from '../utils/masks';

const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 8;

  // Form
  const [formData, setFormData] = useState<Partial<SavedClient>>({
    name: '',
    personType: 'PJ',
    document: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchClients = useCallback(async (p: number, search: string) => {
    setLoading(true);
    const result: PaginatedClientResponse = await clientService.getPaginated(p, LIMIT, search);
    setClients(result.data);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        const targetPage = searchTerm ? 1 : page; 
        if (searchTerm) setPage(1); 
        fetchClients(targetPage, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchClients]);

  useEffect(() => {
    fetchClients(page, searchTerm);
  }, [page]); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      let finalValue = value;
      
      if (name === 'phone') finalValue = maskPhone(value);
      if (name === 'document') {
          finalValue = formData.personType === 'PJ' ? maskCNPJ(value) : maskCPF(value);
      }

      setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleTypeChange = (type: 'PF' | 'PJ') => {
      setFormData(prev => ({ ...prev, personType: type, document: '' }));
  };

  const handleSave = async () => {
    if (!formData.name) return;

    clientService.saveClient({
        id: editingId || undefined,
        name: formData.name,
        personType: formData.personType || 'PJ',
        document: formData.document,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
    });
    
    handleCloseForm();
    fetchClients(page, searchTerm);
  };

  const handleEdit = (client: SavedClient) => {
      setEditingId(client.id);
      setFormData(client);
      setIsCreating(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNew = () => {
      setEditingId(null);
      setFormData({ name: '', personType: 'PJ', document: '', email: '', phone: '', address: '' });
      setIsCreating(true);
  };

  const handleCloseForm = () => {
      setIsCreating(false);
      setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este cliente?')) {
        clientService.deleteClient(id);
        if (editingId === id) handleCloseForm();
        fetchClients(page, searchTerm);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-20 h-auto md:h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col gap-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Meus Clientes
                    <span className="text-xs font-normal bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                        {totalItems}
                    </span>
                </h2>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="flex-1 md:w-64">
                    <Input 
                        placeholder="Buscar cliente..." 
                        icon={<Search size={18} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="!mb-0"
                    />
                </div>
                {!isCreating && (
                    <Button onClick={handleOpenNew} className="whitespace-nowrap px-3 md:px-4">
                        <Plus size={18} className="md:mr-2" />
                        <span className="hidden md:inline">Novo Cliente</span>
                        <span className="md:hidden">Novo</span>
                    </Button>
                )}
            </div>
          </div>

          {/* Form */}
          {isCreating && (
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-brand-200 dark:border-gray-700 shadow-lg animate-fadeIn shrink-0 ring-1 ring-brand-100 dark:ring-brand-900/20">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider flex items-center">
                        {editingId ? <Edit3 size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                        {editingId ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
                    </h4>
                    <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 bg-gray-50 dark:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Person Type Toggle */}
                <div className="flex gap-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="radio" 
                            name="personType" 
                            checked={formData.personType === 'PJ'} 
                            onChange={() => handleTypeChange('PJ')}
                            className="mr-2 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pessoa Jurídica</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="radio" 
                            name="personType" 
                            checked={formData.personType === 'PF'} 
                            onChange={() => handleTypeChange('PF')}
                            className="mr-2 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pessoa Física</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input 
                            label="Nome Completo / Razão Social"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            autoFocus
                        />
                    </div>
                    <Input 
                        label={formData.personType === 'PJ' ? 'CNPJ' : 'CPF'}
                        name="document"
                        value={formData.document}
                        onChange={handleInputChange}
                        maxLength={18}
                    />
                    <Input 
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                    <Input 
                        label="Telefone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={15}
                    />
                    <Input 
                        label="Endereço"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={!formData.name} className="min-w-[120px]">
                        <Save size={20} className="mr-2" />
                        Salvar
                    </Button>
                </div>
            </div>
          )}
      </div>

      {/* List */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
         {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
                 <Loader2 className="animate-spin mb-3" size={32} />
                 <p>Carregando clientes...</p>
             </div>
         ) : clients.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 dark:text-gray-500">
                <Users className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Nenhum cliente encontrado.</p>
                <p className="text-sm mt-1">Crie sua carteira de clientes para agilizar os orçamentos.</p>
             </div>
         ) : (
            <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente / Caracterização</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-32">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {clients.map(client => (
                                <tr key={client.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group ${editingId === client.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                        #{client.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-1.5 rounded-lg shrink-0 ${client.personType === 'PJ' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                                {client.personType === 'PJ' ? <Briefcase size={16} /> : <User size={16} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{client.name}</div>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                        client.personType === 'PJ' 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                                                        : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                                    }`}>
                                                        {client.personType === 'PJ' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
                                                    </span>
                                                    {client.document && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                            {client.document}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex flex-col gap-1">
                                            {client.phone && <div className="flex items-center gap-1.5"><Phone size={12}/> {client.phone}</div>}
                                            {client.email && <div className="flex items-center gap-1.5"><Mail size={12}/> {client.email}</div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(client)} className="text-gray-400 hover:text-brand-600 p-2"><Edit3 size={18} /></button>
                                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                            <button onClick={() => handleDelete(client.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                    {clients.map(client => (
                        <div key={client.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                        #{client.id}
                                    </span>
                                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                        client.personType === 'PJ' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                                        : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                    }`}>
                                        {client.personType === 'PJ' ? 'PJ' : 'PF'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-0.5">{client.name}</h3>
                                {client.document && <p className="text-xs text-gray-500 font-mono">{client.document}</p>}
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
                                    {client.personType === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-300 mb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                {client.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {client.phone}</div>}
                                {client.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {client.email}</div>}
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => handleEdit(client)} className="p-2 text-brand-600 bg-brand-50 rounded-lg"><Edit3 size={18} /></button>
                                <button onClick={() => handleDelete(client.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 size={18} /></button>
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
                  <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="!px-3 !py-1.5 h-9"><ChevronLeft size={16} /></Button>
                  <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="!px-3 !py-1.5 h-9"><ChevronRight size={16} /></Button>
              </div>
         </div>
      </div>
    </div>
  );
};

export default ClientsView;
