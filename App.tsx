
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { QuoteData, INITIAL_QUOTE, CompanyProfile, User, QuoteStatus } from './types';
import StepIndicator from './components/StepIndicator';
import CompanyForm from './components/CompanyForm';
import ClientForm from './components/ClientForm';
import ItemsForm from './components/ItemsForm';
import QuotePreview from './components/QuotePreview';
import PublicQuoteView from './components/PublicQuoteView'; // Import new component
import CompanySettingsModal from './components/CompanySettingsModal';
import ServiceManagerModal from './components/ServiceManagerModal';
import Sidebar from './components/Sidebar'; 
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { clientService } from './services/clientService';
import { useDebounce } from './hooks/useDebounce';
import { 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Check, 
  Menu,
  UserPlus
} from 'lucide-react';

const AuthView = lazy(() => import('./components/AuthView'));
const DashboardView = lazy(() => import('./components/DashboardView'));
const HistoryModal = lazy(() => import('./components/HistoryModal'));
const ReportsView = lazy(() => import('./components/ReportsView'));
const CatalogView = lazy(() => import('./components/CatalogView'));
const ClientsView = lazy(() => import('./components/ClientsView'));

const STORAGE_KEY = 'orcaFacil_data'; 
const STORAGE_KEY_PROFILE = 'orcaFacil_profile';
const STORAGE_KEY_THEME = 'orcaFacil_theme';

type AppView = 'dashboard' | 'editor' | 'history' | 'reports' | 'catalog' | 'clients' | 'public-view';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentStep, setCurrentStep] = useState(0);
  const [quoteData, setQuoteData] = useState<QuoteData>(INITIAL_QUOTE);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const debouncedQuoteData = useDebounce(quoteData, 1000);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showServiceManager, setShowServiceManager] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [defaultCompany, setDefaultCompany] = useState<CompanyProfile>(INITIAL_QUOTE.company);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setIsAuthChecking(false);
  }, []);

  // Browser History Management
  useEffect(() => {
    // Initial push
    if (currentUser) {
       window.history.replaceState({ view: 'dashboard' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.view) {
            setCurrentView(event.state.view);
            // If going back to editor, maybe ensure step is preserved? 
            // For now simple view switching.
        } else {
            // Default fallback
            setCurrentView('dashboard');
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
        const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
        if (!savedProfile) {
            const newProfile: CompanyProfile = {
                name: currentUser.name,
                document: currentUser.document,
                email: currentUser.email,
                phone: currentUser.whatsapp || '',
                website: currentUser.website,
                address: ''
            };
            setDefaultCompany(newProfile);
            localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(newProfile));
        }
    }
  }, [currentUser]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }

    const initData = async () => {
        if (currentUser) {
            const savedData = localStorage.getItem(STORAGE_KEY);
            const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
            
            let profileToUse = INITIAL_QUOTE.company;

            if (savedProfile) {
                try {
                    const parsedProfile = JSON.parse(savedProfile);
                    setDefaultCompany(parsedProfile);
                    profileToUse = parsedProfile;
                } catch (e) {
                    console.error("Failed to parse profile", e);
                }
            }

            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    // Defensive hydration
                    setQuoteData({
                        ...INITIAL_QUOTE,
                        ...parsed,
                        items: Array.isArray(parsed.items) ? parsed.items : [],
                        company: { ...INITIAL_QUOTE.company, ...(parsed.company || {}) },
                        client: { ...INITIAL_QUOTE.client, ...(parsed.client || {}) }
                    });
                } catch (e) {
                    console.error("Failed to parse saved data", e);
                    // If parsing fails, start new with next number
                    const nextNum = await storageService.getNextQuoteNumber();
                    setQuoteData({ ...INITIAL_QUOTE, number: nextNum, company: profileToUse });
                }
            } else {
                // No saved draft, start new with next number
                const nextNum = await storageService.getNextQuoteNumber();
                setQuoteData({ ...INITIAL_QUOTE, number: nextNum, company: profileToUse });
            }
            
            setIsLoaded(true);
        }
    };
    
    initData();

  }, [currentUser]);

  useEffect(() => {
    if (isLoaded && currentUser && currentView !== 'public-view') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(debouncedQuoteData));
    }
  }, [debouncedQuoteData, isLoaded, currentUser, currentView]);

  const toggleTheme = useCallback(() => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem(STORAGE_KEY_THEME, newMode ? 'dark' : 'light');
      if (newMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [isDarkMode]);

  const handleSaveSettings = (profile: CompanyProfile) => {
    setDefaultCompany(profile);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    
    if (!quoteData.company.name) {
      setQuoteData(prev => ({ ...prev, company: profile }));
    }
  };

  const handleSaveToHistory = async () => {
    if (!quoteData.client.name) {
      alert("Por favor, preencha pelo menos o nome do cliente antes de salvar.");
      if (currentStep !== 1) setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    const savedQuote = await storageService.save(quoteData);
    setQuoteData(savedQuote); 
    setIsSaving(false);
    
    setLastSavedId(savedQuote.id);
    setTimeout(() => setLastSavedId(null), 3000);
  };
  
  const handleApproveQuote = async () => {
      setIsSaving(true);
      const approvedQuote = { ...quoteData, status: 'approved' as const };
      const saved = await storageService.save(approvedQuote);
      setQuoteData(saved);
      setIsSaving(false);
      setLastSavedId(saved.id);
      showToast("Orçamento APROVADO com sucesso!");
      setTimeout(() => setLastSavedId(null), 3000);
  };

  const handleResendQuote = async () => {
      setIsSaving(true);
      const updatedQuote: QuoteData = { 
          ...quoteData, 
          status: 'pending', // Back to pending
          clientFeedback: undefined, // Clear old feedback
          signature: undefined // Clear old signature if any
      };
      const saved = await storageService.save(updatedQuote);
      setQuoteData(saved);
      setIsSaving(false);
      setLastSavedId(saved.id);
      showToast("Orçamento reenviado (status pendente)!");
      setTimeout(() => setLastSavedId(null), 3000);
  };

  // NEW: Handle logic from the Public Client View Simulation
  const handlePublicStatusChange = async (status: QuoteStatus, feedback?: string) => {
      setIsSaving(true);
      const updatedQuote = { ...quoteData, status, clientFeedback: feedback };
      const saved = await storageService.save(updatedQuote);
      setQuoteData(saved);
      setIsSaving(false);
      
      if(status === 'approved') showToast("Cliente APROVOU o orçamento!");
      if(status === 'rejected') showToast("Cliente REJEITOU o orçamento.");
      if(status === 'negotiating') showToast("Cliente solicitou AJUSTES.");
  };

  const handleLoadQuote = useCallback((quote: QuoteData) => {
    if (currentView === 'editor' && !confirm('Carregar este orçamento substituirá o rascunho atual. Deseja continuar?')) {
        return;
    }
    setQuoteData(quote);
    setCurrentStep(3);
    
    // Update Router
    setCurrentView('editor');
    window.history.pushState({ view: 'editor' }, '', '#editor');
    
    setIsSidebarOpen(false);
  }, [currentView]);

  const updateData = useCallback((newData: Partial<QuoteData>) => {
    setQuoteData(prev => ({ ...prev, ...newData }));
    if (lastSavedId) setLastSavedId(null);
  }, [lastSavedId]);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const nextStep = () => {
      if (currentStep === 1) {
          if (!quoteData.client.name) {
              alert("Por favor, preencha o nome do cliente.");
              return;
          }
          const savedNewClient = clientService.autoSaveClient(quoteData.client);
          if (savedNewClient) {
              showToast("Cliente salvo automaticamente na sua carteira!");
          }
      }
      setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleNewQuote = useCallback(async () => {
    // 1. Check if it's a completely blank draft (safe to reset/ignore)
    const isBlank = !quoteData.id && !quoteData.client.name && quoteData.items.length === 0;
    
    // 2. Check if it's an Unsaved Draft (No ID, but has content)
    const isUnsavedDraft = !quoteData.id && (quoteData.client.name || quoteData.items.length > 0);

    if (isUnsavedDraft) {
        if(!window.confirm('Você tem um rascunho não salvo. Deseja descartá-lo e iniciar um novo?')) {
            return; // User cancelled
        }
    }

    // 3. Reset logic with new NUMBER
    const nextNumber = await storageService.getNextQuoteNumber();

    setQuoteData({
        ...INITIAL_QUOTE,
        id: '', 
        number: nextNumber, // Auto-incremented number
        company: defaultCompany.name ? defaultCompany : INITIAL_QUOTE.company
    });
    setLastSavedId(null);
    setCurrentStep(0);
    
    setCurrentView('editor');
    window.history.pushState({ view: 'editor' }, '', '#new');
    
    setIsSidebarOpen(false);

  }, [quoteData, defaultCompany]);

  const handleLogout = useCallback(() => {
      if (confirm('Tem certeza que deseja sair?')) {
          authService.logout();
          setCurrentUser(null);
          setQuoteData(INITIAL_QUOTE);
          setCurrentStep(0);
          setCurrentView('dashboard');
          window.history.pushState({ view: 'dashboard' }, '', '/');
      }
  }, []);

  const handleNavigate = useCallback((view: any) => {
      if (view === 'settings') { 
          setShowSettings(true); 
      } else {
          setCurrentView(view);
          window.history.pushState({ view }, '', `#${view}`);
      }
      setIsSidebarOpen(false);
  }, []);

  // --- RENDER HELPERS ---
  
  // Special Full Screen View for "Public Client Simulation"
  if (currentView === 'public-view') {
      return (
          <PublicQuoteView 
            data={quoteData} 
            onStatusChange={handlePublicStatusChange}
            onBack={() => {
                setCurrentView('editor');
                window.history.pushState({ view: 'editor' }, '', '#editor');
            }}
          />
      );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <CompanyForm data={quoteData} updateData={updateData} defaultCompany={defaultCompany} />;
      case 1: return <ClientForm data={quoteData} updateData={updateData} />;
      case 2: return <ItemsForm data={quoteData} updateData={updateData} />;
      case 3: return (
        <QuotePreview 
            data={quoteData} 
            onEdit={() => setCurrentStep(2)} 
            onApprove={handleApproveQuote} 
            onSimulateClientView={() => {
                setCurrentView('public-view');
                window.history.pushState({ view: 'public-view' }, '', '#preview');
            }}
            onResend={handleResendQuote}
            isSaving={isSaving} 
        />
      );
      default: return null;
    }
  };

  const getHeaderTitle = () => {
    switch (currentView) {
        case 'dashboard': return 'Visão Geral';
        case 'history': return 'Meus Orçamentos';
        case 'reports': return 'Relatórios e KPIs';
        case 'catalog': return 'Catálogo de Serviços';
        case 'clients': return 'Meus Clientes';
        case 'editor': return quoteData.client.name ? `Orçamento - ${quoteData.client.name}` : 'Criando Novo Orçamento';
    }
  };

  const renderContent = () => {
      if (currentView === 'dashboard' && currentUser) {
          return (
             <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-brand-600"/></div>}>
                <DashboardView 
                    user={currentUser} 
                    onNavigate={handleNavigate} 
                    onLoadQuote={handleLoadQuote}
                    onNewQuote={handleNewQuote}
                />
             </Suspense>
          );
      }
      if (currentView === 'history') {
          return (
            <div className="max-w-6xl mx-auto h-auto md:h-full flex flex-col">
                <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-brand-600"/></div>}>
                    <HistoryModal 
                        isOpen={true} 
                        onClose={() => {}} 
                        onLoadQuote={handleLoadQuote} 
                    />
                </Suspense>
            </div>
          );
      }
      if (currentView === 'reports') {
          return (
            <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-brand-600"/></div>}>
                <ReportsView />
            </Suspense>
          );
      }
      if (currentView === 'catalog') {
          return (
            <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-brand-600"/></div>}>
                <CatalogView />
            </Suspense>
          );
      }
      if (currentView === 'clients') {
          return (
            <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-brand-600"/></div>}>
                <ClientsView />
            </Suspense>
          );
      }
      
      // Default: Editor
      return (
        <div className="max-w-4xl mx-auto pb-10">
            <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
            <div className="mt-6">
                {renderStep()}
            </div>
            {currentStep < 3 && (
                <div className="mt-8 flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                    currentStep === 0 
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Voltar
                </button>
                <button
                    onClick={nextStep}
                    className="flex items-center px-8 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5"
                >
                    {currentStep === 2 ? 'Ver Resumo' : 'Próximo'}
                    <ArrowRight size={20} className="ml-2" />
                </button>
                </div>
            )}
        </div>
      );
  };

  if (isAuthChecking) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="animate-spin text-brand-600" /></div>;
  }

  if (!currentUser) {
      return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="animate-spin text-brand-600" /></div>}>
            <AuthView onLoginSuccess={() => {
                const user = authService.getCurrentUser();
                setCurrentUser(user);
                setCurrentView('dashboard'); 
                window.history.pushState({ view: 'dashboard' }, '', '/');
            }} />
        </Suspense>
      );
  }

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="animate-spin text-brand-600" /></div>;

  const hasActiveDraft = Boolean(quoteData.client.name || quoteData.items.length > 0);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden transition-colors duration-200">
      
      {toastMessage && (
          <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-fadeIn">
              <Check size={18} className="text-green-400 dark:text-green-600" />
              <span className="font-medium text-sm">{toastMessage}</span>
          </div>
      )}
      
      <CompanySettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        initialData={defaultCompany}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
      
      <ServiceManagerModal 
        isOpen={showServiceManager} 
        onClose={() => setShowServiceManager(false)} 
        onUpdate={() => {}} 
      />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}
         currentView={currentView}
         onNavigate={handleNavigate}
         onNewQuote={handleNewQuote}
         onToggleTheme={toggleTheme}
         isDarkMode={isDarkMode}
         onLogout={handleLogout}
         currentUser={currentUser}
         hasActiveDraft={hasActiveDraft}
         setShowSettings={setShowSettings}
      />

      <div className="flex-1 flex flex-col h-full w-full relative">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 shadow-sm transition-colors">
           <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden mr-4 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg"
              >
                <Menu size={24} />
              </button>
              
              <div className="hidden sm:block">
                 <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {getHeaderTitle()}
                 </h1>
                 {currentView === 'editor' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {quoteData.number ? `#${quoteData.number}` : 'Sem número'}
                    </p>
                 )}
              </div>
           </div>

           <div className="flex items-center gap-2">
              {currentView === 'editor' && (
                  <button 
                    onClick={handleSaveToHistory}
                    disabled={isSaving}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all border shadow-sm ${
                        lastSavedId 
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isSaving ? (
                        <Loader2 size={18} className="animate-spin sm:mr-2" />
                    ) : lastSavedId ? (
                        <Check size={18} className="sm:mr-2" />
                    ) : (
                        <Save size={18} className="sm:mr-2 text-brand-600 dark:text-brand-400" />
                    )}
                    <span className="hidden sm:inline">
                        {lastSavedId ? 'Salvo!' : 'Salvar'}
                    </span>
                  </button>
              )}
           </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative bg-gray-50/50 dark:bg-gray-900 transition-colors">
           {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
