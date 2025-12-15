
import React, { memo } from 'react';
import { 
  Home, 
  Edit, 
  PlusCircle, 
  FolderOpen, 
  BarChart2, 
  Package, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  X,
  Users
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: any) => void;
  onNewQuote: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLogout: () => void;
  currentUser: User | null;
  hasActiveDraft: boolean; 
  setShowSettings: (show: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onNewQuote,
  onLogout,
  currentUser,
  hasActiveDraft,
  setShowSettings
}) => {
  const { t } = useLanguage();

  return (
    <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 dark:bg-gray-950 text-white transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-gray-950 dark:bg-black">
           <LayoutDashboard className="text-brand-500 mr-3" size={24} />
           <span className="text-xl font-bold tracking-tight">OrçaFácil</span>
           <button 
             onClick={onClose} 
             className="md:hidden ml-auto text-gray-400 hover:text-white"
           >
             <X size={20} />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 flex flex-col overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            {t.sidebar.main}
          </div>
          
           <button 
            onClick={() => { onNavigate('dashboard'); onClose(); }}
            className={`w-full flex items-center px-3 py-2.5 mb-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === 'dashboard'
                ? 'bg-gray-800 text-white ring-1 ring-gray-700'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Home size={18} className="mr-3" />
            {t.sidebar.dashboard}
          </button>

          <button 
            onClick={onNewQuote}
            className={`w-full flex items-center px-3 py-2.5 mb-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                currentView === 'editor' 
                ? 'bg-brand-600 text-white hover:bg-brand-700' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {currentView === 'editor' && hasActiveDraft ? (
                 <><Edit size={18} className="mr-3" /> {t.sidebar.editDraft}</>
            ) : (
                 <><PlusCircle size={18} className="mr-3" /> {t.sidebar.newQuote}</>
            )}
          </button>

          <button 
            onClick={() => { onNavigate('history'); onClose(); }}
            className={`w-full flex items-center px-3 py-2.5 mb-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === 'history'
                ? 'bg-gray-800 text-white ring-1 ring-gray-700'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <FolderOpen size={18} className="mr-3" />
            {t.sidebar.history}
          </button>

          <button 
            onClick={() => { onNavigate('clients'); onClose(); }}
            className={`w-full flex items-center px-3 py-2.5 mb-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === 'clients'
                ? 'bg-gray-800 text-white ring-1 ring-gray-700'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Users size={18} className="mr-3" />
            {t.sidebar.clients}
          </button>

          <button 
            onClick={() => { onNavigate('catalog'); onClose(); }}
            className={`w-full flex items-center px-3 py-2.5 mb-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === 'catalog'
                ? 'bg-gray-800 text-white ring-1 ring-gray-700'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Package size={18} className="mr-3" />
            {t.sidebar.catalog}
          </button>

          <button 
            onClick={() => { onNavigate('reports'); onClose(); }}
            className={`w-full flex items-center px-3 py-2.5 mb-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === 'reports'
                ? 'bg-gray-800 text-white ring-1 ring-gray-700'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <BarChart2 size={18} className="mr-3" />
            {t.sidebar.reports}
          </button>

          <div className="mt-8 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            {t.sidebar.config}
          </div>

          <button 
            onClick={() => { setShowSettings(true); onClose(); }}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings size={18} className="mr-3" />
            {t.sidebar.settings}
          </button>

           <button 
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors mt-auto"
          >
            <LogOut size={18} className="mr-3" />
            {t.sidebar.logout}
          </button>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 dark:bg-black">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center text-brand-200 font-bold text-xs uppercase">
                {currentUser?.name.substring(0,2) || 'OF'}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
               <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
             </div>
          </div>
        </div>
      </aside>
  );
};

export default memo(Sidebar);
