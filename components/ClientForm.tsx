
import React, { useState } from 'react';
import { QuoteData, SavedClient } from '../types';
import { User, MapPin, Mail, Phone, Briefcase, UserCircle, Search, Users } from 'lucide-react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { validateCNPJ, validateCPF, validateEmail, validatePhone } from '../utils/validation';
import { maskCNPJ, maskCPF, maskPhone } from '../utils/masks';
import ClientPickerModal from './ClientPickerModal';

interface Props {
  data: QuoteData;
  updateData: (data: Partial<QuoteData>) => void;
}

const ClientForm: React.FC<Props> = ({ data, updateData }) => {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showClientPicker, setShowClientPicker] = useState(false);
  
  const currentType = data.client.personType || 'PJ';

  const validateField = (name: string, value: string) => {
    let error: string | null = null;
    if (name === 'document') {
        error = currentType === 'PJ' ? validateCNPJ(value) : validateCPF(value);
    }
    if (name === 'email') error = validateEmail(value);
    if (name === 'phone') error = validatePhone(value);
    
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    // Apply Masks
    if (name === 'phone') {
        maskedValue = maskPhone(value);
    }
    if (name === 'document') {
        maskedValue = currentType === 'PJ' ? maskCNPJ(value) : maskCPF(value);
    }

    updateData({
      client: {
        ...data.client,
        [name]: maskedValue
      }
    });

    if (name === 'document' || name === 'phone' || errors[name]) {
        validateField(name, maskedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const setPersonType = (type: 'PF' | 'PJ') => {
    updateData({
      client: {
        ...data.client,
        personType: type,
        document: '' // Clear document on switch
      }
    });
    setErrors(prev => ({ ...prev, document: null }));
  };

  const handleClientSelect = (client: SavedClient) => {
      updateData({
          client: {
              name: client.name,
              personType: client.personType,
              document: client.document,
              email: client.email,
              phone: client.phone,
              address: client.address
          }
      });
      setShowClientPicker(false);
      // Clear errors
      setErrors({});
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <ClientPickerModal 
        isOpen={showClientPicker} 
        onClose={() => setShowClientPicker(false)}
        onSelect={handleClientSelect}
      />

      <Card 
        title="Dados do Cliente" 
        icon={<User size={24} />}
        action={
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowClientPicker(true)}
                className="!py-1.5 !px-3 text-xs border-brand-200 text-brand-600 hover:bg-brand-50"
            >
                <Users size={16} className="mr-1.5" />
                Selecionar Cliente
            </Button>
        }
      >
        {/* Seletor de Tipo de Pessoa */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Cliente</label>
          <div className="flex gap-3">
            <button
              onClick={() => setPersonType('PF')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg border transition-all ${
                currentType === 'PF'
                  ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300 font-medium ring-1 ring-brand-500'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <UserCircle size={18} className="mr-2" />
              Pessoa Física
            </button>
            <button
              onClick={() => setPersonType('PJ')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg border transition-all ${
                currentType === 'PJ'
                  ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300 font-medium ring-1 ring-brand-500'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Briefcase size={18} className="mr-2" />
              Pessoa Jurídica
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            containerClassName="col-span-1 lg:col-span-2"
            label="Nome do Cliente / Empresa *"
            name="name"
            value={data.client.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={currentType === 'PJ' ? "Nome da Empresa Ltda" : "João da Silva"}
            autoFocus
          />

          <Input
            label={currentType === 'PJ' ? 'CNPJ' : 'CPF'}
            name="document"
            value={data.client.document || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={currentType === 'PJ' ? "00.000.000/0001-00" : "000.000.000-00"}
            icon={currentType === 'PJ' ? <Briefcase size={18} /> : <UserCircle size={18} />}
            error={errors.document}
            maxLength={currentType === 'PJ' ? 18 : 14}
            helpText={currentType === 'PJ' ? "Formato: 00.000.000/0001-00" : "Formato: 000.000.000-00"}
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={data.client.email || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="cliente@email.com"
            icon={<Mail size={18} />}
            error={errors.email}
          />

          <Input
            containerClassName="col-span-1 lg:col-span-2"
            label="Telefone"
            name="phone"
            value={data.client.phone || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="(00) 00000-0000"
            icon={<Phone size={18} />}
            error={errors.phone}
            maxLength={15}
            helpText="Celular ou Fixo. Formato: (DD) 99999-9999"
          />

          <Input
            containerClassName="col-span-1 lg:col-span-2"
            label="Endereço"
            name="address"
            value={data.client.address || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Endereço completo"
            icon={<MapPin size={18} />}
          />
        </div>
      </Card>
    </div>
  );
};

export default ClientForm;
