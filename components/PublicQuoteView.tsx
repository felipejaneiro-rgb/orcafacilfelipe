
import React, { useState } from 'react';
import { QuoteData, QuoteStatus } from '../types';
import { calculateQuoteTotals } from '../utils/calculations';
import { generateQuotePDF } from '../services/pdfService';
import { 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    Phone, 
    Mail, 
    Calendar, 
    FileText,
    ShieldCheck,
    AlertTriangle,
    Download
} from 'lucide-react';
import Button from './ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  data: QuoteData;
  onStatusChange: (status: QuoteStatus, feedback?: string) => void;
  onBack: () => void;
}

const PublicQuoteView: React.FC<Props> = ({ data, onStatusChange, onBack }) => {
  const { t } = useLanguage();
  const { subtotal, discount, total } = calculateQuoteTotals(data);
  const [activeModal, setActiveModal] = useState<'approve' | 'reject' | 'adjust' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [clientName, setClientName] = useState(data.client.name);

  // Status visual helpers
  const isPending = data.status === 'pending';
  const isApproved = data.status === 'approved';
  const isRejected = data.status === 'rejected';
  const isNegotiating = data.status === 'negotiating';

  const handleAction = (status: QuoteStatus) => {
      onStatusChange(status, feedback);
      setActiveModal(null);
  };

  const StatusBanner = () => {
      if (isApproved) {
          return (
              <div className="bg-green-600 text-white p-6 rounded-xl text-center shadow-lg mb-6 animate-fadeIn">
                  <div className="flex justify-center mb-2">
                      <div className="bg-white/20 p-3 rounded-full">
                          <CheckCircle size={48} />
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold">{t.publicView.approvedTitle}</h2>
                  <p className="opacity-90 mt-1">{t.publicView.approvedDesc}</p>
              </div>
          );
      }
      if (isRejected) {
          return (
              <div className="bg-red-600 text-white p-6 rounded-xl text-center shadow-lg mb-6 animate-fadeIn">
                  <div className="flex justify-center mb-2">
                      <div className="bg-white/20 p-3 rounded-full">
                          <XCircle size={48} />
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold">{t.publicView.rejectedTitle}</h2>
                  <p className="opacity-90 mt-1">{t.publicView.rejectedDesc}</p>
              </div>
          );
      }
      if (isNegotiating) {
          return (
              <div className="bg-yellow-500 text-white p-6 rounded-xl text-center shadow-lg mb-6 animate-fadeIn">
                  <div className="flex justify-center mb-2">
                      <div className="bg-white/20 p-3 rounded-full">
                          <MessageSquare size={48} />
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold">{t.publicView.negotiatingTitle}</h2>
                  <p className="opacity-90 mt-1">{t.publicView.negotiatingDesc}</p>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-24 md:pb-10 relative">
      
      {/* Simulation Header */}
      <div className="bg-gray-800 text-gray-400 text-xs py-2 text-center sticky top-0 z-50 shadow-md flex justify-center items-center gap-4">
          <span>{t.publicView.simulationMode}</span>
          <div className="h-4 w-px bg-gray-600"></div>
          <button onClick={onBack} className="text-white hover:underline underline-offset-2 font-bold">
              {t.publicView.backToPanel}
          </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        
        {/* PDF Download Action - Visible to Client */}
        <div className="flex justify-end mb-4">
            <Button 
                onClick={() => generateQuotePDF(data)}
                className="bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30 font-semibold"
            >
                <Download size={18} className="mr-2" />
                {t.common.downloadPdf}
            </Button>
        </div>

        <StatusBanner />

        {/* Company Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="bg-brand-600 h-24 relative">
                <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 bg-white dark:bg-gray-700 rounded-xl shadow-md border-4 border-white dark:border-gray-800 flex items-center justify-center overflow-hidden">
                         {data.company.logoUrl ? (
                             <img src={data.company.logoUrl} className="w-full h-full object-contain" />
                         ) : (
                             <ShieldCheck size={40} className="text-brand-600" />
                         )}
                    </div>
                </div>
            </div>
            <div className="pt-12 pb-6 px-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.company.name}</h1>
                <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <Mail size={14} /> {data.company.email}
                    </div>
                    {data.company.phone && (
                        <div className="flex items-center gap-2">
                            <Phone size={14} /> {data.company.phone}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Quote Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orçamento</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">#{data.number}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.common.date}</p>
                        <p className="text-sm text-gray-800 dark:text-white flex items-center justify-end gap-1">
                            <Calendar size={14} /> {new Date(data.date).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t.publicView.preparedFor}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{data.client.name}</p>
                    {data.client.document && <p className="text-xs text-gray-500">{data.client.document}</p>}
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-brand-600" /> {t.publicView.itemsServices}
                </h3>
                <div className="space-y-3">
                    {data.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex-1 pr-4">
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{item.description}</p>
                                <p className="text-xs text-gray-500">{item.quantity}x {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                            <div className="font-semibold text-gray-800 dark:text-white text-sm">
                                {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{t.common.subtotal}</span>
                        <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>{t.common.discount}</span>
                            <span>- {discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-gray-700">
                        <span>{t.common.total}</span>
                        <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            </div>

            {data.notes && (
                <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border-t border-yellow-100 dark:border-yellow-900/30">
                     <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-2">
                         {t.common.notes}
                     </p>
                     <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                         {data.notes}
                     </p>
                </div>
            )}
        </div>

      </div>

      {/* STICKY ACTION BAR */}
      {isPending && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-2xl z-40">
              <div className="max-w-2xl mx-auto flex gap-3">
                  <button 
                    onClick={() => setActiveModal('reject')}
                    className="flex-1 py-3 px-2 rounded-xl border border-red-200 text-red-600 font-semibold text-xs sm:text-sm hover:bg-red-50 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                      <XCircle size={20} />
                      {t.publicView.rejectAction}
                  </button>
                  <button 
                    onClick={() => setActiveModal('adjust')}
                    className="flex-1 py-3 px-2 rounded-xl bg-yellow-100 text-yellow-800 font-semibold text-xs sm:text-sm hover:bg-yellow-200 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                      <MessageSquare size={20} />
                      {t.publicView.adjustAction}
                  </button>
                  <button 
                    onClick={() => setActiveModal('approve')}
                    className="flex-[1.5] py-3 px-2 rounded-xl bg-green-600 text-white font-bold text-sm sm:text-base hover:bg-green-700 shadow-lg shadow-green-500/30 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                      <CheckCircle size={20} />
                      {t.publicView.approveAction}
                  </button>
              </div>
          </div>
      )}

      {/* MODALS */}
      {activeModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-slideUp">
                  
                  {activeModal === 'approve' && (
                      <>
                        <div className="text-center mb-4">
                            <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.publicView.confirmApprove}</h3>
                            <p className="text-sm text-gray-500">{t.publicView.confirmApproveDesc}</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t.publicView.yourName}</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                />
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction('approved')}>
                                {t.publicView.confirmClose}
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setActiveModal(null)}>{t.common.cancel}</Button>
                        </div>
                      </>
                  )}

                  {activeModal === 'reject' && (
                      <>
                        <div className="text-center mb-4">
                            <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <XCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.publicView.confirmReject}</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                {t.publicView.confirmRejectDesc}
                            </p>
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg text-left flex items-start gap-3">
                                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                                    {t.publicView.rejectWarning}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                             <label className="block text-xs font-bold text-gray-500">{t.publicView.reasonOptional}</label>
                             <textarea 
                                className="w-full border border-gray-300 rounded-lg p-3 h-20 text-sm resize-none"
                                placeholder={t.publicView.reasonPlaceholder}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-xs px-1" onClick={() => handleAction('rejected')}>
                                    {t.publicView.yesReject}
                                </Button>
                                <Button variant="secondary" className="w-full text-xs px-1" onClick={() => setActiveModal(null)}>
                                    {t.publicView.noReject}
                                </Button>
                            </div>
                        </div>
                      </>
                  )}

                  {activeModal === 'adjust' && (
                      <>
                        <div className="text-center mb-4">
                            <div className="bg-yellow-100 text-yellow-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.publicView.requestAdjust}</h3>
                            <p className="text-sm text-gray-500">{t.publicView.negotiatingDesc}</p>
                        </div>
                        <div className="space-y-3">
                             <textarea 
                                className="w-full border border-gray-300 rounded-lg p-3 h-24 text-sm resize-none"
                                placeholder={t.publicView.adjustPlaceholder}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => handleAction('negotiating')} disabled={!feedback}>
                                {t.publicView.sendRequest}
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setActiveModal(null)}>{t.common.cancel}</Button>
                        </div>
                      </>
                  )}

              </div>
          </div>
      )}

    </div>
  );
};

export default PublicQuoteView;
