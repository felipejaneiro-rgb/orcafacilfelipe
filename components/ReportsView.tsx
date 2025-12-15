
import React, { useEffect, useState, useMemo } from 'react';
import { QuoteData } from '../types';
import { storageService } from '../services/storageService';
import { calculateQuoteTotals } from '../utils/calculations';
import { 
    TrendingUp, 
    TrendingDown,
    PieChart, 
    DollarSign, 
    Activity, 
    Target,
    Calendar,
    Download,
    Filter,
    X,
    BarChart3,
    Award,
    ChevronRight,
    ShoppingCart,
    Hammer
} from 'lucide-react';

// --- SVG DONUT CHART COMPONENT ---
const DonutChart = ({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let cumulativeAngle = 0;
  
    if (total === 0) {
        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <div className="w-full h-full rounded-full border-4 border-gray-100 dark:border-gray-700"></div>
                <div className="absolute text-xs text-gray-400">Sem dados</div>
            </div>
        );
    }
  
    const paths = data.map((slice, i) => {
        const angle = (slice.value / total) * 360;
        const x1 = 50 + 50 * Math.cos((Math.PI * cumulativeAngle) / 180);
        const y1 = 50 + 50 * Math.sin((Math.PI * cumulativeAngle) / 180);
        const x2 = 50 + 50 * Math.cos((Math.PI * (cumulativeAngle + angle)) / 180);
        const y2 = 50 + 50 * Math.sin((Math.PI * (cumulativeAngle + angle)) / 180);
        
        // Large arc flag
        const largeArc = angle > 180 ? 1 : 0;
        
        const pathData = total === slice.value 
            ? `M 50 0 A 50 50 0 1 1 49.99 0` // Full circle fix
            : `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
        cumulativeAngle += angle;
        
        return <path key={i} d={pathData} fill={slice.color} className="transition-all duration-500 hover:opacity-90 stroke-white dark:stroke-gray-800 stroke-[2px]" />;
    });
  
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
             <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {paths}
                {/* Center Hole - Matches background color */}
                <circle cx="50" cy="50" r="35" className="fill-white dark:fill-gray-800" />
             </svg>
             <div className="absolute flex flex-col items-center pointer-events-none">
                 <span className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{total}</span>
                 <span className="text-[9px] md:text-[10px] text-gray-500 uppercase">Total</span>
             </div>
        </div>
    );
};

const ReportsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  
  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilter, setActiveFilter] = useState<'thisMonth' | 'lastMonth' | 'last90' | 'all'>('thisMonth');
  const [showDateInputs, setShowDateInputs] = useState(false);
  
  // Year Comparison State
  const [showYearComparison, setShowYearComparison] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        const data = await storageService.getAll();
        setQuotes(data);
        setLoading(false);
        // Set default filter
        handleQuickFilter('thisMonth');
    };
    loadData();
  }, []);

  const handleQuickFilter = (type: 'thisMonth' | 'lastMonth' | 'last90' | 'all') => {
    setActiveFilter(type);
    setShowDateInputs(false);
    const now = new Date();
    
    if (type === 'all') {
        setStartDate('');
        setEndDate('');
        return;
    }

    if (type === 'thisMonth') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }

    if (type === 'lastMonth') {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }

    if (type === 'last90') {
        const past = new Date();
        past.setDate(past.getDate() - 90);
        setStartDate(past.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // --- DATA PROCESSING HELPERS ---
  const getTotal = (q: QuoteData) => calculateQuoteTotals(q).total;

  const getDateRange = () => {
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
      const start = startDate ? new Date(startDate + 'T00:00:00') : new Date(new Date().setMonth(new Date().getMonth() - 12)); // Default lookback
      return { start, end };
  };

  const getFilteredData = (data: QuoteData[], start: Date, end: Date) => {
      return data.filter(q => {
          if (!q.date) return false;
          const qDate = new Date(q.date + 'T00:00:00');
          return qDate >= start && qDate <= end;
      });
  };

  // 1. Current Period Data
  const { start: currentStart, end: currentEnd } = getDateRange();
  const currentQuotes = useMemo(() => getFilteredData(quotes, currentStart, currentEnd), [quotes, currentStart, currentEnd]);

  // 2. Previous Period Data (for Trend Calculation)
  // Logic: Same duration as current filter, immediately preceding it.
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const prevEnd = new Date(currentStart.getTime() - 1); // 1ms before current start
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  const previousQuotes = useMemo(() => getFilteredData(quotes, prevStart, prevEnd), [quotes, prevStart, prevEnd]);

  // --- KPI CALCULATIONS ---
  const calculateMetrics = (dataset: QuoteData[]) => {
      const approved = dataset.filter(q => q.status === 'approved');
      const pending = dataset.filter(q => q.status === 'pending');
      const rejected = dataset.filter(q => q.status === 'rejected');
      
      const revenue = approved.reduce((acc, q) => acc + getTotal(q), 0);
      const pipeline = pending.reduce((acc, q) => acc + getTotal(q), 0);
      const avgTicket = approved.length > 0 ? revenue / approved.length : 0;
      const conversion = (approved.length + rejected.length) > 0 
          ? (approved.length / (approved.length + rejected.length)) * 100 
          : 0;

      return { revenue, pipeline, avgTicket, conversion, approvedCount: approved.length };
  };

  const currentMetrics = calculateMetrics(currentQuotes);
  const prevMetrics = calculateMetrics(previousQuotes);

  // Growth helper
  const getGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
  };

  // --- CHART DATA GENERATION ---
  const getChartData = () => {
    let chartMonths: Record<string, { value: number, prevValue: number, sortKey: number }> = {};
    
    // Generate buckets for the display range
    let iterator = new Date(currentStart);
    iterator.setDate(1); // Align to month start for chart consistency

    // Limit chart bars to avoid UI breakage if range is huge
    let safety = 0;
    while (iterator <= currentEnd && safety < 13) {
        const key = iterator.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const sortKey = iterator.getFullYear() * 100 + (iterator.getMonth() + 1);
        chartMonths[key] = { value: 0, prevValue: 0, sortKey };
        iterator.setMonth(iterator.getMonth() + 1);
        safety++;
    }

    const allApproved = quotes.filter(q => q.status === 'approved');

    allApproved.forEach(q => {
        if (!q.date) return;
        const d = new Date(q.date + 'T00:00:00');
        const quoteSortKey = d.getFullYear() * 100 + (d.getMonth() + 1);
        
        Object.values(chartMonths).forEach(monthData => {
            // Current Year Data
            if (monthData.sortKey === quoteSortKey) {
                monthData.value += getTotal(q);
            }
            // Previous Year Data (YoY)
            if (showYearComparison && (quoteSortKey + 100 === monthData.sortKey)) {
                monthData.prevValue += getTotal(q);
            }
        });
    });

    return Object.entries(chartMonths)
        .sort(([,a], [,b]) => a.sortKey - b.sortKey)
        .map(([label, data]) => ({ label, value: data.value, prevValue: data.prevValue }));
  };

  const chartData = getChartData();
  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.value, d.prevValue)), 1);

  // --- TOP SERVICES & PRODUCTS ANALYSIS ---
  const { topServices, topProducts } = useMemo(() => {
      const serviceMap: Record<string, number> = {};
      const productMap: Record<string, number> = {};
      const approved = currentQuotes.filter(q => q.status === 'approved');
      
      approved.forEach(q => {
          if (!q.items || !Array.isArray(q.items)) return;
          
          q.items.forEach(item => {
              if (!item) return;
              const total = (item.quantity || 0) * (item.unitPrice || 0);
              const key = (item.description || 'Item sem nome').trim(); 
              
              if (item.type === 'product') {
                  productMap[key] = (productMap[key] || 0) + total;
              } else {
                  // Default to service if type undefined or explicitly service
                  serviceMap[key] = (serviceMap[key] || 0) + total;
              }
          });
      });

      const services = Object.entries(serviceMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5

      const products = Object.entries(productMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5
      
      return { topServices: services, topProducts: products };
  }, [currentQuotes]);

  // --- EXPORT CSV ---
  const handleExportCSV = () => {
      const headers = ['Data', 'Número', 'Cliente', 'Documento', 'Status', 'Total', 'Itens'];
      const rows = currentQuotes.map(q => [
          new Date(q.date).toLocaleDateString('pt-BR'),
          q.number || '',
          `"${q.client.name}"`, // Escape commas
          q.client.document || '',
          q.status,
          calculateQuoteTotals(q).total.toFixed(2).replace('.', ','),
          `"${(q.items || []).map(i => i.description).join(', ')}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_orcafacil_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const TrendIndicator = ({ current, prev, isInverse = false }: { current: number, prev: number, isInverse?: boolean }) => {
      const growth = getGrowth(current, prev);
      const isPositive = growth >= 0;
      const isGood = isInverse ? !isPositive : isPositive; 
      
      if (Math.abs(growth) < 0.1) return <span className="text-gray-300 dark:text-gray-600 text-[10px] ml-1.5">- 0%</span>;

      return (
          <div className={`flex items-center text-[10px] sm:text-xs ml-1.5 font-bold ${isGood ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
              {Math.abs(growth).toFixed(0)}%
          </div>
      );
  };

  const RankingCard = ({ title, icon, items }: { title: string, icon: React.ReactNode, items: {name: string, value: number}[] }) => (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex-1">
         <div className="flex items-center mb-4 sm:mb-6">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg mr-3">
                {icon}
            </div>
            <div>
                <h3 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Mais vendidos (Receita)</p>
            </div>
         </div>

         <div className="space-y-3 sm:space-y-4">
            {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs sm:text-sm">Nenhum item vendido no período.</div>
            ) : (
                items.map((item, idx) => {
                    const maxVal = items[0].value;
                    const percent = (item.value / maxVal) * 100;
                    
                    return (
                        <div key={idx} className="relative group">
                            <div className="flex justify-between text-xs sm:text-sm mb-1 z-10 relative">
                                <span className="font-medium text-gray-700 dark:text-gray-200 truncate pr-4 max-w-[150px] sm:max-w-none">
                                    {idx + 1}. {item.name}
                                </span>
                                <span className="font-mono text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">
                                    {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors" 
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    )
                })
            )}
         </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8 animate-fadeIn pb-24 md:pb-20">
        
        {/* Header & Filters */}
        <div className="flex flex-col space-y-4">
            <div className="flex flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        Relatórios <span className="text-[10px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full font-bold">BI</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
                        {currentStart.toLocaleDateString('pt-BR')} até {currentEnd.toLocaleDateString('pt-BR')}
                    </p>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    title="Exportar CSV"
                >
                    <Download size={14} className="mr-1.5" />
                    <span className="hidden sm:inline">Exportar CSV</span>
                    <span className="sm:hidden">CSV</span>
                </button>
            </div>

            {/* Mobile-Optimized Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3 transition-colors">
                
                {/* Horizontal Scrollable Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0 uppercase tracking-wider">
                        <Filter size={12} /> Período
                    </span>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                    
                    {[
                        { id: 'thisMonth', label: 'Este Mês' },
                        { id: 'lastMonth', label: 'Mês Passado' },
                        { id: 'last90', label: '90 Dias' },
                        { id: 'all', label: 'Tudo' }
                    ].map((opt) => (
                         <button 
                            key={opt.id}
                            onClick={() => handleQuickFilter(opt.id as any)} 
                            className={`
                                whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all shrink-0
                                ${activeFilter === opt.id 
                                    ? 'bg-brand-600 text-white shadow-sm' 
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}
                            `}
                         >
                            {opt.label}
                         </button>
                    ))}
                    
                    <button 
                        onClick={() => setShowDateInputs(!showDateInputs)}
                        className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all shrink-0 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 ${showDateInputs ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    >
                        Personalizado
                    </button>
                </div>

                {/* Collapsible Date Inputs */}
                {showDateInputs && (
                    <div className="flex items-center gap-2 animate-fadeIn pt-2 border-t border-gray-100 dark:border-gray-700">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="date-input flex-1" />
                        <span className="text-gray-400 text-xs">até</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="date-input flex-1" />
                    </div>
                )}
            </div>
        </div>

        {/* --- KPI CARDS (2-Column Grid on Mobile) --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            
            {/* KPI: Conversion */}
            <div className="kpi-card relative overflow-hidden group">
                <div className="flex items-center gap-1.5 mb-1 text-gray-500 dark:text-gray-400">
                    <Activity size={14} />
                    <span className="text-xs font-bold uppercase tracking-wide">Conversão</span>
                </div>
                <div className="flex items-baseline mt-1">
                    <h3 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">{currentMetrics.conversion.toFixed(1)}%</h3>
                    <TrendIndicator current={currentMetrics.conversion} prev={prevMetrics.conversion} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 sm:mt-2 truncate">
                    {currentMetrics.approvedCount} aprovações
                </p>
            </div>

            {/* KPI: Revenue */}
            <div className="kpi-card">
                <div className="flex items-center gap-1.5 mb-1 text-gray-500 dark:text-gray-400">
                    <div className="p-1 bg-green-50 dark:bg-green-900/30 text-green-600 rounded">
                        <DollarSign size={12} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Faturamento</span>
                </div>
                <div className="flex items-baseline mt-1 flex-wrap">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
                        {currentMetrics.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </h3>
                    <TrendIndicator current={currentMetrics.revenue} prev={prevMetrics.revenue} />
                </div>
            </div>

            {/* KPI: Pipeline */}
            <div className="kpi-card">
                 <div className="flex items-center gap-1.5 mb-1 text-gray-500 dark:text-gray-400">
                    <div className="p-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 rounded">
                        <TrendingUp size={12} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Pipeline</span>
                </div>
                <div className="flex items-baseline mt-1 flex-wrap">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
                        {currentMetrics.pipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </h3>
                    <TrendIndicator current={currentMetrics.pipeline} prev={prevMetrics.pipeline} />
                </div>
            </div>

            {/* KPI: Avg Ticket */}
            <div className="kpi-card">
                <div className="flex items-center gap-1.5 mb-1 text-gray-500 dark:text-gray-400">
                    <div className="p-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded">
                        <PieChart size={12} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Ticket Médio</span>
                </div>
                <div className="flex items-baseline mt-1 flex-wrap">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
                        {currentMetrics.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </h3>
                    <TrendIndicator current={currentMetrics.avgTicket} prev={prevMetrics.avgTicket} />
                </div>
            </div>
        </div>

        {/* --- MAIN CHART & DONUT & LIST --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Monthly Revenue Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="flex flex-row justify-between items-center mb-4 sm:mb-6 gap-2">
                    <h3 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white flex items-center">
                        <BarChart3 size={18} className="mr-2 text-brand-500" />
                        Faturamento
                    </h3>
                    
                    <button
                        onClick={() => setShowYearComparison(!showYearComparison)}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                            showYearComparison 
                            ? 'bg-brand-50 text-brand-600 border border-brand-200' 
                            : 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                        }`}
                    >
                        <Calendar size={12} />
                        {showYearComparison ? 'Ano Anterior' : 'Comparar'}
                    </button>
                </div>
                
                {chartData.length === 0 ? (
                    <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 italic text-sm">Sem dados neste filtro</div>
                ) : (
                    <div className="relative group">
                         {/* Mobile Scroll Hint */}
                        <div className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-40 pointer-events-none animate-pulse">
                            <ChevronRight size={24} className="text-gray-400"/>
                        </div>

                        <div className="h-48 sm:h-64 flex items-end justify-start gap-2 overflow-x-auto pb-4 snap-x no-scrollbar pr-6">
                            {chartData.map((data, idx) => {
                                const heightPercent = maxChartValue > 0 ? (data.value / maxChartValue) * 100 : 0;
                                const prevHeightPercent = maxChartValue > 0 ? (data.prevValue / maxChartValue) * 100 : 0;
                                
                                return (
                                    <div key={idx} className="flex flex-col items-center h-full justify-end group min-w-[32px] sm:min-w-[40px] flex-1 snap-center">
                                        <div className="relative w-full flex justify-center items-end h-full gap-0.5 sm:gap-1">
                                            {/* Prev Year Bar */}
                                            {showYearComparison && (
                                                <div className="relative w-full flex flex-col justify-end h-full">
                                                    <div 
                                                        className="w-full bg-gray-300 dark:bg-gray-600 rounded-t-sm opacity-60 hover:opacity-100 transition-all"
                                                        style={{ height: `${Math.max(prevHeightPercent, 2)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            {/* Current Year Bar */}
                                            <div className="relative w-full flex flex-col justify-end h-full">
                                                {/* Tooltip visible on hover or active on mobile */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 text-[9px] font-bold bg-gray-800 text-white px-1 py-0.5 rounded transition-opacity z-20 pointer-events-none whitespace-nowrap">
                                                    {((data.value/1000).toFixed(1))}k
                                                </div>
                                                <div 
                                                    className="w-full bg-brand-500 dark:bg-brand-500 rounded-t-sm hover:bg-brand-600 active:bg-brand-700 transition-all cursor-pointer"
                                                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] text-gray-500 mt-2 truncate max-w-full">{data.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* --- STATUS BREAKDOWN (DONUT) --- */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                <h3 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white mb-2 sm:mb-4">Status</h3>
                
                <div className="flex-1 flex flex-row lg:flex-col items-center justify-around lg:justify-center gap-4">
                    <div className="shrink-0">
                        <DonutChart 
                            size={120}
                            data={[
                                { label: 'Aprovados', value: currentQuotes.filter(q => q.status === 'approved').length, color: '#22c55e' },
                                { label: 'Pendentes', value: currentQuotes.filter(q => q.status === 'pending').length, color: '#eab308' },
                                { label: 'Rejeitados', value: currentQuotes.filter(q => q.status === 'rejected').length, color: '#ef4444' }
                            ]} 
                        />
                    </div>
                    
                    <div className="flex flex-col lg:flex-row justify-center gap-2 sm:gap-4 text-xs text-gray-600 dark:text-gray-300">
                         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Aprovado</div>
                         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Pendente</div>
                         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Rejeitado</div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- TOP RANKINGS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
             <RankingCard 
                title="Top Serviços" 
                icon={<Award size={20} />} 
                items={topServices} 
             />
             <RankingCard 
                title="Top Produtos" 
                icon={<ShoppingCart size={20} />} 
                items={topProducts} 
             />
        </div>

        <style>{`
            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            .date-input {
                @apply px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 w-full;
            }
            .kpi-card {
                @apply bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors flex flex-col justify-between min-h-[100px] sm:min-h-[140px];
            }
        `}</style>
    </div>
  );
};

export default ReportsView;
