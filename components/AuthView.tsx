
import React, { useState } from 'react';
import { LayoutDashboard, Mail, Hash, Phone, MapPin, Briefcase, User, CheckCircle, ArrowRight, ArrowLeft, Eye, EyeOff, MailCheck, ChevronLeft, Lock } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import { authService } from '../services/authService';
import { maskCNPJ, maskCPF, maskPhone } from '../utils/masks';
import { User as AppUser } from '../types';

interface Props {
  onLoginSuccess: (user: AppUser) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'verify-email';

const AuthView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [personType, setPersonType] = useState<'pessoa_fisica' | 'pessoa_juridica'>('pessoa_juridica');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
        setError("Informe e-mail e senha.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await authService.login(formData.email, formData.password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.password) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formData.password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const { user, session } = await authService.register({
        email: formData.email,
        password: formData.password,
        name: formData.nome
      });

      if (session && user) {
        onLoginSuccess(user);
      } else {
        setMode('verify-email');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao realizar cadastro.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com Google.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row transition-colors duration-300 relative">
      
      {/* Lado Esquerdo - Branding */}
      <div className="hidden md:flex md:w-5/12 lg:w-4/12 bg-brand-600 dark:bg-gray-900 flex-col justify-center items-center text-white p-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800 dark:from-black dark:to-gray-900 opacity-90 z-0"></div>
        <div className="relative z-10 text-center animate-fadeIn">
            <div className="bg-white/10 p-6 rounded-[2.5rem] inline-block mb-8 backdrop-blur-xl border border-white/20 shadow-2xl">
                <LayoutDashboard size={64} className="text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tighter text-white">OrçaFácil</h1>
            <p className="text-lg text-brand-100 dark:text-gray-400 max-w-xs mx-auto font-medium">
                Sua oficina profissional de orçamentos rápidos e elegantes.
            </p>
        </div>
      </div>

      {/* Lado Direito - Formulários */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-12 bg-white dark:bg-gray-950 overflow-y-auto min-h-screen">
        <div className="w-full max-w-md space-y-8 py-8 animate-slideUp relative">
            
            {/* Mobile Logo Header */}
            <div className="flex md:hidden flex-col items-center mb-8">
                <div className="bg-brand-600 p-3.5 rounded-[1.25rem] shadow-lg mb-3">
                    <LayoutDashboard size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">OrçaFácil</h1>
            </div>

            {/* Botão Voltar */}
            {(mode === 'register' || mode === 'forgot') && (
                <button 
                    onClick={() => setMode('login')}
                    className="absolute -top-4 left-0 flex items-center gap-2 text-gray-400 hover:text-brand-600 font-bold transition-colors group"
                >
                    <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-900 group-hover:bg-brand-50 transition-colors">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-sm">Voltar para Login</span>
                </button>
            )}

            {mode === 'verify-email' ? (
                <div className="text-center space-y-6 animate-fadeIn pt-10">
                    <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-[3rem] inline-block mb-4">
                        <MailCheck size={64} className="text-green-600 mx-auto" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Confirme seu E-mail</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-sm mx-auto">
                        Enviamos um link de ativação para <strong>{formData.email}</strong>. 
                        Acesse seu e-mail para desbloquear sua conta.
                    </p>
                    <div className="pt-4">
                        <Button onClick={() => setMode('login')} className="w-full h-14 rounded-2xl">
                            Ir para o Login
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                <div className="text-center md:text-left pt-2 md:pt-6">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {mode === 'login' && 'Bem-vindo de volta'}
                        {mode === 'register' && 'Crie sua conta'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {mode === 'login' ? 'Identifique-se para acessar seus orçamentos.' : 'Preencha seus dados para começar gratuitamente.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-100 dark:border-red-800 flex items-center gap-3">
                        {error}
                    </div>
                )}

                {mode === 'login' && (
                    <div className="space-y-6">
                        <button 
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                            {loading ? 'Processando...' : 'Entrar com Google'}
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                            <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Ou use seu e-mail</span>
                            <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail size={18} />} placeholder="seu@email.com" />
                            <div>
                                <Input label="Senha" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />} onIconClick={() => setShowPassword(!showPassword)} placeholder="Sua senha" />
                                <div className="flex justify-end mt-2">
                                    <button type="button" onClick={() => setMode('forgot')} className="text-xs font-bold text-brand-600 hover:underline">Esqueceu a senha?</button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl shadow-lg shadow-brand-500/20" isLoading={loading}>
                                Entrar <ArrowRight size={20} className="ml-2" />
                            </Button>
                            <div className="text-center text-sm font-medium text-gray-500">
                                Novo por aqui? <button type="button" onClick={() => setMode('register')} className="font-black text-brand-600 hover:underline">Crie uma conta</button>
                            </div>
                        </form>
                    </div>
                )}

                {mode === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-5 animate-fadeIn">
                        <Input label="Nome Completo *" name="nome" value={formData.nome} onChange={handleChange} icon={<User size={18}/>} placeholder="Como quer ser chamado" />
                        <Input label="E-mail de Acesso *" type="email" name="email" value={formData.email} onChange={handleChange} icon={<Mail size={18} />} placeholder="seu@email.com" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Crie uma Senha *" type="password" name="password" value={formData.password} onChange={handleChange} icon={<Lock size={18} />} placeholder="Mín. 6 chars" />
                            <Input label="Confirme a Senha *" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} icon={<Lock size={18} />} placeholder="Repita a senha" />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-brand-500/20" isLoading={loading}>
                                Cadastrar e Iniciar
                            </Button>
                        </div>
                        <div className="text-center text-sm font-medium text-gray-500">
                            Já tem conta? <button type="button" onClick={() => setMode('login')} className="font-black text-brand-600 hover:underline">Fazer login</button>
                        </div>
                    </form>
                )}

                {mode === 'forgot' && (
                    <div className="animate-fadeIn space-y-6 text-center pt-10">
                        <div className="bg-brand-50 dark:bg-brand-900/20 p-6 rounded-3xl inline-block mb-4">
                            <Mail size={32} className="text-brand-600 mx-auto" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">Insira seu e-mail para receber as instruções de recuperação.</p>
                        <Input label="E-mail" placeholder="seu@email.com" icon={<Mail size={18}/>} />
                        <Button className="w-full h-14 rounded-2xl">Enviar Link</Button>
                    </div>
                )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
