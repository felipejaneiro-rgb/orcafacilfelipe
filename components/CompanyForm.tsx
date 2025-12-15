
import React, { useState } from 'react';
import { QuoteData, CompanyProfile } from '../types';
import { Building, MapPin, Mail, Phone, Hash, RotateCcw } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';
import { validateCNPJ, validateEmail, validatePhone } from '../utils/validation';
import { maskCNPJ, maskPhone } from '../utils/masks';

interface Props {
  data: QuoteData;
  updateData: (data: Partial<QuoteData>) => void;
  defaultCompany?: CompanyProfile;
}

const CompanyForm: React.FC<Props> = ({ data, updateData, defaultCompany }) => {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateField = (name: string, value: string) => {
    let error: string | null = null;
    if (name === 'document') error = validateCNPJ(value);
    if (name === 'email') error = validateEmail(value);
    if (name === 'phone') error = validatePhone(value);
    
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    // Apply Masks
    if (name === 'document') maskedValue = maskCNPJ(value);
    if (name === 'phone') maskedValue = maskPhone(value);
    
    // Update data
    updateData({
      company: {
        ...data.company,
        [name]: maskedValue
      }
    });

    // Validate on change
    validateField(name, maskedValue);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({
      [e.target.name]: e.target.value
    });
  };

  const loadDefaults = () => {
    if (defaultCompany && confirm('Deseja preencher com os dados salvos da sua empresa?')) {
      updateData({ company: defaultCompany });
      // Clear errors
      setErrors({});
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card 
        title="Dados da Sua Empresa" 
        icon={<Building size={24} />}
        action={defaultCompany?.name && (
            <Button 
                variant="ghost" 
                onClick={loadDefaults} 
                className="!text-xs !py-1"
                icon={<RotateCcw size={14} />}
            >
                Usar meus dados
            </Button>
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
             containerClassName="col-span-1 lg:col-span-2"
             label="Nome da Empresa *"
             name="name"
             value={data.company.name}
             onChange={handleChange}
             placeholder="Ex: Soluções Técnicas Ltda"
          />

          <Input
             label="CNPJ ou CPF"
             name="document"
             value={data.company.document}
             onChange={handleChange}
             placeholder="00.000.000/0001-00"
             icon={<Hash size={18} />}
             error={errors.document}
             maxLength={18}
             helpText="A formatação será aplicada automaticamente ao digitar."
          />

          <Input
             label="Email"
             name="email"
             type="email"
             value={data.company.email}
             onChange={handleChange}
             placeholder="contato@empresa.com"
             icon={<Mail size={18} />}
             error={errors.email}
          />

          <Input
             containerClassName="col-span-1 lg:col-span-2"
             label="Telefone/WhatsApp"
             name="phone"
             value={data.company.phone}
             onChange={handleChange}
             placeholder="(00) 00000-0000"
             icon={<Phone size={18} />}
             error={errors.phone}
             maxLength={15}
             helpText="Este número aparecerá no cabeçalho do PDF."
          />

          <Input
             containerClassName="col-span-1 lg:col-span-2"
             label="Endereço Completo"
             name="address"
             value={data.company.address}
             onChange={handleChange}
             placeholder="Rua Exemplo, 123 - Centro, Cidade - UF"
             icon={<MapPin size={18} />}
          />
        </div>
      </Card>

      <Card title="Configurações do Orçamento" icon={<Hash size={24} />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Número do Orçamento"
            name="number"
            value={data.number}
            onChange={handleDateChange}
            helpText="Pode conter letras e números. Ex: 2023/001"
          />
          <Input
            label="Data de Emissão"
            type="date"
            name="date"
            value={data.date}
            onChange={handleDateChange}
          />
          <Input
            label="Data de Validade"
            type="date"
            name="dueDate"
            value={data.dueDate || ''}
            onChange={handleDateChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default CompanyForm;
