
import React, { useState } from 'react';
import { LayoutDashboard, Lock, Mail, Globe, Phone, Briefcase, User, CheckCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Code } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import { authService } from '../services/authService';
import { validateCNPJ, validateEmail } from '../utils/validation';
import { maskCNPJ, maskPhone } from '../utils/masks';

interface Props {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

const AuthView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    whatsapp: '',
    website: '',
    password: '',
    confirmPassword: '',
    remember: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;

    // Apply Masks
    if (name === 'document') value = maskCNPJ(value as string);
    if (name === 'whatsapp') value = maskPhone(value as string);

    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 800)); // Simulate delay
      authService.login(formData.document, formData.password, Boolean(formData.remember));
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    const devDoc = "99.999.999/9999-99";
    const devPass = "dev123";
    
    try {
        // Tenta logar
        authService.login(devDoc, devPass, true);
        onLoginSuccess();
    } catch (e) {
        // Se falhar (usuário não existe), cria e loga
        try {
            authService.register({
                name: "Ambiente de Teste (Dev)",
                document: devDoc,
                email: "dev@orcafacil.com",
                whatsapp: "(11) 99999-9999",
                website: "localhost",
                password: devPass
            });
            onLoginSuccess();
        } catch (regError: any) {
            setError("Erro ao criar ambiente dev: " + regError.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem.");
        return;
    }
    const cnpjError = validateCNPJ(formData.document);
    if (cnpjError) { setError(cnpjError); return; }

    const emailError = validateEmail(formData.email);
    if (emailError) { setError(emailError); return; }

    setLoading(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 1000));
      authService.register({
        name: formData.name,
        document: formData.document,
        email: formData.email,
        whatsapp: formData.whatsapp,
        website: formData.website,
        password: formData.password
      });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
        await new Promise(r => setTimeout(r, 1000));
        authService.resetPassword(formData.document, formData.email, formData.password);
        setSuccessMsg("Senha alterada com sucesso! Faça login.");
        setTimeout(() => {
            setMode('login');
            setSuccessMsg(null);
        }, 2000);
    } catch (err: any) {
        setError(err.message || 'Erro ao resetar senha');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row transition-colors duration-300 relative">
      
      {/* Left Panel - Branding */}
      <div className="md:w-1/2 bg-brand-600 dark:bg-gray-950 flex flex-col justify-center items-center text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-600 dark:bg-black opacity-50 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
        
        <div className="relative z-10 text-center">
            <div className="bg-white/10 p-4 rounded-2xl inline-block mb-6 backdrop-blur-sm border border-white/20">
                <LayoutDashboard size={64} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">OrçaFácil</h1>
            <p className="text-lg md:text-xl text-brand-100 dark:text-gray-400 max-w-md mx-auto">
                Gestão profissional de orçamentos para empreendedores e autônomos.
            </p>
            
            <div className="mt-12 space-y-4 text-left max-w-sm mx-auto hidden md:block">
                <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" /> <span>Geração de PDF profissional</span>
                </div>
                <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" /> <span>Catálogo de serviços</span>
                </div>
                <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" /> <span>Gestão financeira (KPIs)</span>
                </div>
            </div>
        </div>
      </div>

      {/* Right Panel - Forms */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
            
            <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mode === 'login' && 'Bem-vindo de volta'}
                    {mode === 'register' && 'Crie sua conta'}
                    {mode === 'forgot' && 'Recuperar senha'}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {mode === 'login' && 'Acesse sua conta para gerenciar seus orçamentos.'}
                    {mode === 'register' && 'Preencha os dados da sua empresa para começar.'}
                    {mode === 'forgot' && 'Confirme seus dados para redefinir o acesso.'}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 animate-fadeIn">
                    {error}
                </div>
            )}
            
            {successMsg && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm font-medium border border-green-200 dark:border-green-800 animate-fadeIn">
                    {successMsg}
                </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
                    <Input 
                        label="CNPJ da Empresa"
                        placeholder="00.000.000/0001-00"
                        name="document"
                        value={formData.document}
                        onChange={handleChange}
                        icon={<Briefcase size={18} />}
                        maxLength={18}
                        autoFocus
                    />
                    <div>
                        <Input 
                            label="Senha"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            onIconClick={() => setShowPassword(!showPassword)}
                        />
                        <div className="flex justify-between items-center mt-2">
                             <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="remember"
                                    checked={Boolean(formData.remember)}
                                    onChange={handleChange}
                                    className="mr-2 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                Lembrar CNPJ
                             </label>
                             <button 
                                type="button"
                                onClick={() => { setMode('forgot'); setError(null); }}
                                className="text-sm font-medium text-brand-600 hover:text-brand-500"
                             >
                                Esqueceu a senha?
                             </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Entrar na plataforma <ArrowRight size={18} className="ml-2" />
                    </Button>

                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Não tem uma conta?{' '}
                        <button 
                            type="button" 
                            onClick={() => { setMode('register'); setError(null); }}
                            className="font-bold text-brand-600 hover:text-brand-500"
                        >
                            Cadastre-se grátis
                        </button>
                    </div>

                    {/* DEV BUTTON - TESTING ONLY */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={handleDevLogin}
                            className="w-full py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-2"
                        >
                            <Code size={14} />
                            Dev Auto Login (Modo Teste)
                        </button>
                    </div>
                </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
                    <Input 
                        label="Nome da Empresa"
                        placeholder="Minha Empresa Ltda"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        icon={<User size={18} />}
                    />
                    <Input 
                        label="CNPJ"
                        placeholder="00.000.000/0001-00"
                        name="document"
                        value={formData.document}
                        onChange={handleChange}
                        icon={<Briefcase size={18} />}
                        maxLength={18}
                    />
                    <Input 
                        label="Email Comercial"
                        type="email"
                        placeholder="contato@empresa.com"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        icon={<Mail size={18} />}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="WhatsApp"
                            placeholder="(00) 00000-0000"
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleChange}
                            icon={<Phone size={18} />}
                            maxLength={15}
                        />
                         <Input 
                            label="Site (Opcional)"
                            placeholder="www.site.com"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            icon={<Globe size={18} />}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Senha"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            onIconClick={() => setShowPassword(!showPassword)}
                        />
                         <Input 
                            label="Confirmar"
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            onIconClick={() => setShowPassword(!showPassword)}
                        />
                    </div>

                    <Button type="submit" className="w-full mt-2" isLoading={loading}>
                        Criar Conta
                    </Button>

                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Já possui conta?{' '}
                        <button 
                            type="button" 
                            onClick={() => { setMode('login'); setError(null); }}
                            className="font-bold text-brand-600 hover:text-brand-500"
                        >
                            Fazer Login
                        </button>
                    </div>
                </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
                 <form onSubmit={handleReset} className="space-y-5 animate-fadeIn">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                        Confirme seus dados cadastrais para definir uma nova senha.
                    </div>
                    <Input 
                        label="CNPJ Cadastrado"
                        placeholder="00.000.000/0001-00"
                        name="document"
                        value={formData.document}
                        onChange={handleChange}
                        icon={<Briefcase size={18} />}
                        maxLength={18}
                    />
                    <Input 
                        label="Email Cadastrado"
                        type="email"
                        placeholder="contato@empresa.com"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        icon={<Mail size={18} />}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Nova Senha"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            onIconClick={() => setShowPassword(!showPassword)}
                        />
                         <Input 
                            label="Confirmar"
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            onIconClick={() => setShowPassword(!showPassword)}
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Redefinir Senha
                    </Button>

                    <button 
                        type="button" 
                        onClick={() => { setMode('login'); setError(null); }}
                        className="w-full flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-4"
                    >
                        <ArrowLeft size={16} className="mr-2" /> Voltar para o Login
                    </button>
                 </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
