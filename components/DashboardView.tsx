
import React, { useEffect, useState, useMemo } from 'react';
import { User, QuoteData } from '../types';
import { storageService } from '../services/storageService';
import { calculateQuoteTotals } from '../utils/calculations';
import { 
    PlusCircle, 
    FolderOpen, 
    Package, 
    Settings, 
    Clock, 
    CheckCircle, 
    TrendingUp,
    ArrowRight,
    Briefcase,
    Users,
    AlertTriangle,
    MessageSquare
} from 'lucide-react';
import Card from './ui/Card';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  user: User;
  onNavigate: (view: 'editor' | 'history' | 'catalog' | 'settings' | 'clients') => void;
  onLoadQuote: (quote: QuoteData) => void;
  onNewQuote: () => void;
}

const DashboardView: React.FC<Props> = ({ user, onNavigate, onLoadQuote, onNewQuote }) => {
  const { t } = useLanguage();
  const [allQuotes, setAllQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
        const data = await storageService.getAll();
        setAllQuotes(data);
        setLoading(false);
    };
    loadDashboardData();
  }, []);

  // Memoized derived state to prevent recalculation on every render
  const { recentQuotes, negotiatingQuotes, stats } = useMemo(() => {
      // 1. Filter Negotiating
      const negotiating = allQuotes.filter(q => q.status === 'negotiating');

      // 2. Recent Activity (Already sorted by service, just slice)
      const recent = allQuotes.slice(0, 5);

      // 3. Stats for current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let revenue = 0;
      let pending = 0;
      let approved = 0;

      allQuotes.forEach(q => {
          const qDate = new Date(q.date);
          const isThisMonth = qDate.getMonth() === currentMonth && qDate.getFullYear() === currentYear;
          
          if (q.status === 'pending') pending++;
          if (q.status === 'approved') {
              if (isThisMonth) {
                  revenue += calculateQuoteTotals(q).total;
              }
              approved++;
          }
      });

      return {
          recentQuotes: recent,
          negotiatingQuotes: negotiating,
          stats: {
              monthlyRevenue: revenue,
              pendingCount: pending,
              approvedCount: approved
          }
      };
  }, [allQuotes]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard.greetingMorning;
    if (hour < 18) return t.dashboard.greetingAfternoon;
    return t.dashboard.greetingEvening;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-10">
        
        {/* Welcome Banner */}
        <div className="bg-brand-600 dark:bg-gray-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Briefcase size={120} />
            </div>
            <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">{getGreeting()}, {user.name.split(' ')[0]}!</h1>
                <p className="text-brand-100 dark:text-gray-300 max-w-lg">
                    {t.dashboard.welcomeMessage}
                </p>
            </div>
        </div>

        {/* ACTION REQUIRED SECTION - ALERT FOR NEGOTIATION */}
        {negotiatingQuotes.length > 0 && (
            <div className="animate-slideUp">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-yellow-500" />
                    {t.dashboard.actionRequired}
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">{negotiatingQuotes.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {negotiatingQuotes.map(quote => (
                        <div 
                            key={quote.id}
                            onClick={() => onLoadQuote(quote)}
                            className="bg-white dark:bg-gray-800 border-l-4 border-yellow-500 rounded-r-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <MessageSquare size={60} className="text-yellow-500" />
                            </div>
                            
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{quote.client.name}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">#{quote.number}</span>
                                </div>
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                    {t.dashboard.requestedAdjustment}
                                </div>
                            </div>
                            
                            {quote.clientFeedback && (
                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                                    <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 mb-1 uppercase flex items-center gap-1">
                                        <MessageSquare size={12} /> Mensagem do cliente:
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic line-clamp-2">
                                        "{quote.clientFeedback}"
                                    </p>
                                </div>
                            )}

                            <div className="mt-3 flex items-center text-brand-600 dark:text-brand-400 text-sm font-medium group-hover:underline">
                                {t.dashboard.resolveNow} <ArrowRight size={16} className="ml-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg mr-4">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.monthlyRevenue}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                        {loading ? '...' : stats.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg mr-4">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.pendingQuotes}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '...' : stats.pendingCount}</p>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg mr-4">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.totalApproved}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '...' : stats.approvedCount}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t.dashboard.quickAccess}</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     <button 
                        onClick={onNewQuote}
                        className="p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group text-left flex flex-col items-center sm:items-start text-center sm:text-left"
                     >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                            <PlusCircle size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-sm sm:text-base">{t.sidebar.newQuote}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t.dashboard.createProposal}</p>
                     </button>

                     <button 
                        onClick={() => onNavigate('clients')}
                        className="p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group text-left flex flex-col items-center sm:items-start text-center sm:text-left"
                     >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-sm sm:text-base">{t.sidebar.clients}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t.dashboard.managePortfolio}</p>
                     </button>

                     <button 
                        onClick={() => onNavigate('history')}
                        className="p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group text-left flex flex-col items-center sm:items-start text-center sm:text-left"
                     >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                            <FolderOpen size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-sm sm:text-base">{t.sidebar.history}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t.dashboard.viewOld}</p>
                     </button>

                     <button 
                        onClick={() => onNavigate('catalog')}
                        className="p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group text-left flex flex-col items-center sm:items-start text-center sm:text-left"
                     >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                            <Package size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-sm sm:text-base">{t.sidebar.catalog}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t.dashboard.pricesServices}</p>
                     </button>

                     <button 
                        onClick={() => onNavigate('settings')}
                        className="p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group text-left flex flex-col items-center sm:items-start text-center sm:text-left"
                     >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                            <Settings size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-sm sm:text-base">{t.sidebar.settings}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t.dashboard.dataBackup}</p>
                     </button>
                 </div>
            </div>

            {/* Recent Activity */}
            <div>
                 <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t.dashboard.recentActivity}</h2>
                 <Card className="h-full !p-0 overflow-hidden">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recentQuotes.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                {t.dashboard.noActivity}
                            </div>
                        ) : (
                            recentQuotes.map(quote => (
                                <div 
                                    key={quote.id} 
                                    onClick={() => onLoadQuote(quote)}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-gray-800 dark:text-white text-sm">
                                            {quote.client.name}
                                        </span>
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                            #{quote.number}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span>{new Date(quote.date).toLocaleDateString('pt-BR')}</span>
                                            {quote.status === 'negotiating' && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Em negociação"></span>}
                                        </div>
                                        <div className="flex items-center text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Open <ArrowRight size={12} className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {recentQuotes.length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-center">
                            <button 
                                onClick={() => onNavigate('history')}
                                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                            >
                                {t.dashboard.viewFullHistory}
                            </button>
                        </div>
                    )}
                 </Card>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
