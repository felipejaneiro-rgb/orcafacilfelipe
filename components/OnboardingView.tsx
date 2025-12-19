
import React, { useState } from 'react';
import { Building2, ArrowRight, ShieldCheck, Mail, Phone, MapPin, Hash, User, Briefcase, CheckCircle2 } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import { maskCNPJ, maskCPF, maskPhone } from '../utils/masks';
import { companyService } from '../services/companyService';
import { CompanyProfile } from '../types';

interface Props {
  userId: string;
  userEmail: string;
  onComplete: (company: CompanyProfile) => void;
}

const OnboardingView: React.FC<Props> = ({ userId, userEmail, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personType, setPersonType] = useState<'pessoa_fisica' | 'pessoa_juridica'>('pessoa_juridica');

  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '', // CPF ou CNPJ
    telefone: '',
    endereco: '',
    email: userEmail
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === 'cnpj') {
      maskedValue = personType === 'pessoa_juridica' ? maskCNPJ(value) : maskCPF(value);
    }
    if (name === 'telefone') maskedValue = maskPhone(value);

    setFormData(prev => ({ ...prev, [name]: maskedValue }));
    if (error) setError(null);
  };

  const handleTypeChange = (type: 'pessoa_fisica' | 'pessoa_juridica') => {
    setPersonType(type);
    setFormData(prev => ({ ...prev, cnpj: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!formData.razao_social || !formData.nome_fantasia || !formData.cnpj || !formData.email || !formData.telefone) {
      setError("Por favor, preencha todos os campos obrigatórios (*)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const companyData: CompanyProfile = {
        razao_social: formData.razao_social,
        nome_fantasia: formData.nome_fantasia,
        cnpj: formData.cnpj,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco || undefined,
        brand_color: '#2563eb',
        tipo_empresa: personType
      };

      const company = await companyService.createCompany(userId, companyData);
      onComplete(company);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao salvar dados. Verifique se o documento já está cadastrado.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 overflow-y-auto sm:py-12">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slideUp">
        
        {/* Banner Superior Premium */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-8 sm:p-12 text-white text-center relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Building2 size={120} />
          </div>
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Bem-vindo ao OrçaFácil</h1>
          <p className="text-brand-100 text-sm sm:text-base max-w-sm mx-auto font-medium">
            Estamos quase prontos. Precisamos de apenas alguns dados da sua empresa para gerar seus orçamentos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-100 dark:border-red-800 flex items-center gap-3 animate-bounce">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              {error}
            </div>
          )}

          {/* Seletor de Tipo de Empresa */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Tipo de Negócio *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeChange('pessoa_juridica')}
                className={`group flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                  personType === 'pessoa_juridica'
                    ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/10 text-brand-700 dark:text-brand-400 ring-4 ring-brand-500/10'
                    : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-colors ${personType === 'pessoa_juridica' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  <Briefcase size={24} />
                </div>
                <span className="font-bold text-sm">Pessoa Jurídica</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleTypeChange('pessoa_fisica')}
                className={`group flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                  personType === 'pessoa_fisica'
                    ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/10 text-brand-700 dark:text-brand-400 ring-4 ring-brand-500/10'
                    : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-colors ${personType === 'pessoa_fisica' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  <User size={24} />
                </div>
                <span className="font-bold text-sm">Pessoa Física</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label={personType === 'pessoa_juridica' ? "Razão Social *" : "Nome Completo *"}
              name="razao_social"
              value={formData.razao_social}
              onChange={handleChange}
              placeholder={personType === 'pessoa_juridica' ? "Ex: Silva & Silva Ltda" : "Seu nome completo"}
              containerClassName="md:col-span-1"
            />
            <Input 
              label="Nome Fantasia *"
              name="nome_fantasia"
              value={formData.nome_fantasia}
              onChange={handleChange}
              placeholder="Ex: Oficina do Silva"
              containerClassName="md:col-span-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label={personType === 'pessoa_juridica' ? "CNPJ *" : "CPF *"}
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              placeholder={personType === 'pessoa_juridica' ? "00.000.000/0000-00" : "000.000.000-00"}
              icon={<Hash size={18} />}
              maxLength={personType === 'pessoa_juridica' ? 18 : 14}
            />
            <Input 
              label="WhatsApp / Telefone *"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              icon={<Phone size={18} />}
              maxLength={15}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Input 
                label="Email Comercial *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contato@suaempresa.com"
                icon={<Mail size={18} />}
                containerClassName="md:col-span-2"
              />
          </div>

          <Input 
            label="Endereço Comercial (Opcional)"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            placeholder="Rua, Número, Bairro, Cidade - UF"
            icon={<MapPin size={18} />}
          />

          <div className="pt-8">
            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-black rounded-[1.5rem] shadow-2xl shadow-brand-500/30 transition-transform active:scale-95" 
              isLoading={loading}
              icon={!loading && <ArrowRight size={24} />}
            >
              Finalizar Cadastro
            </Button>
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
               <CheckCircle2 size={14} className="text-green-500" />
               <span className="text-[10px] uppercase tracking-widest font-bold">Ambiente Seguro e Criptografado</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingView;
