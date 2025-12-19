
import React, { useState } from 'react';
import { QuoteData } from '../types';
import { Download, Edit3, MessageCircle, Mail, Paperclip, PenTool, CheckCircle2, Lock, ThumbsUp, Globe, Copy, Eye, AlertCircle, AlertTriangle, Send } from 'lucide-react';
import { generateQuotePDF } from '../services/pdfService';
import { calculateQuoteTotals } from '../utils/calculations';
import SignaturePad from './ui/SignaturePad';
import Card from './ui/Card';
import Button from './ui/Button';

interface Props {
  data: QuoteData;
  onEdit: () => void;
  onApprove: () => void;
  onSimulateClientView?: () => void;
  onResend?: () => void; // New Prop
  isSaving?: boolean;
}

const QuotePreview: React.FC<Props> = ({ data, onEdit, onApprove, onSimulateClientView, onResend, isSaving }) => {
  const { subtotal, discount, total } = calculateQuoteTotals(data);
  const [signature, setSignature] = useState<string | undefined>(data.signature);
  
  const isApproved = data.status === 'approved';
  const isRejected = data.status === 'rejected';
  const isNegotiating = data.status === 'negotiating';

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSignAndApprove = (sig: string) => {
      setSignature(sig);
      data.signature = sig; // Mutate for PDF/Approve
      onApprove();
  };

  const handleClearSignature = () => {
      if(isApproved) return;
      setSignature(undefined);
      data.signature = undefined;
  };

  // --- Share Handlers ---
  const handleCopyLink = () => {
      const dummyLink = `https://orcafacil.app/v/${data.id || 'demo'}`;
      navigator.clipboard.writeText(dummyLink);
      alert('Link copiado! (Lembre-se: este é um link de demonstração. Use o botão "Visão do Cliente" para testar o fluxo).');
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto pb-20">
      
      {/* Actions Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex gap-2 w-full md:w-auto">
            <button
                onClick={onEdit}
                disabled={isApproved}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg border font-medium transition-colors flex items-center justify-center ${
                    isApproved
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                {isApproved ? <Lock size={18} className="mr-2" /> : <Edit3 size={18} className="mr-2" />}
                {isApproved ? 'Fechado' : 'Editar'}
            </button>

            {/* Resend Button logic */}
            {(isNegotiating || isRejected) && onResend && (
                <button
                    onClick={onResend}
                    className="flex-1 md:flex-none px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all flex items-center justify-center"
                >
                    <Send size={18} className="mr-2" />
                    Reenviar
                </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <button
              onClick={handleCopyLink}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center shadow-sm"
              title="Copiar Link Web"
            >
              <Copy size={18} className="mr-2" />
              Copiar Link
            </button>
            
            {onSimulateClientView && (
                <button
                    onClick={onSimulateClientView}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center shadow-sm"
                >
                    <Eye size={18} className="mr-2" />
                    Simular Visão do Cliente
                </button>
            )}

            <button
              onClick={() => generateQuotePDF(data)}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center min-w-[160px]"
            >
              <Download size={20} className="mr-2" />
              Baixar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main A4 Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-2xl rounded-sm min-h-[800px] p-8 md:p-12 pb-32 relative overflow-hidden border border-gray-200 print:shadow-none mx-auto w-full">
                
                {/* STATUS STAMPS */}
                {isApproved && (
                    <div className="absolute top-10 right-10 border-4 border-green-600 text-green-600 font-bold text-3xl px-4 py-2 rounded transform rotate-12 opacity-50 pointer-events-none z-10">
                        APROVADO
                    </div>
                )}
                {isRejected && (
                    <div className="absolute top-10 right-10 border-4 border-red-600 text-red-600 font-bold text-3xl px-4 py-2 rounded transform rotate-12 opacity-50 pointer-events-none z-10">
                        REJEITADO
                    </div>
                )}
                 {isNegotiating && (
                    <div className="absolute top-10 right-10 border-4 border-yellow-600 text-yellow-600 font-bold text-2xl px-4 py-2 rounded transform rotate-12 opacity-50 pointer-events-none z-10">
                        EM NEGOCIAÇÃO
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
                    <div>
                        {/* Fixed: Using nome_fantasia instead of name */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.company.nome_fantasia || 'Sua Empresa'}</h1>
                        <div className="text-sm text-gray-500 space-y-1">
                            {/* Fixed: Using cnpj, endereco, telefone instead of document, address, phone */}
                            {data.company.cnpj && <p>CNPJ/CPF: {data.company.cnpj}</p>}
                            {data.company.endereco && <p>{data.company.endereco}</p>}
                            <p>{data.company.email} {data.company.telefone && `| ${data.company.telefone}`}</p>
                        </div>
                    </div>
                    <div className="md:text-right">
                        <h2 className="text-4xl font-bold text-gray-100 tracking-tight">ORÇAMENTO</h2>
                        <div className="text-sm text-gray-500 mt-2">
                            <p className="font-semibold text-gray-700">#{data.number}</p>
                            <p>Data: {new Date(data.date).toLocaleDateString('pt-BR')}</p>
                            {data.dueDate && <p>Válido até: {new Date(data.dueDate).toLocaleDateString('pt-BR')}</p>}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Client */}
                <div className="mb-12">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Dados do Cliente</h3>
                    <div className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-xl font-bold text-brand-900">{data.client.name || 'Nome do Cliente'}</p>
                        <div className="text-sm text-gray-600 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {data.client.document && <p><span className="font-semibold">Doc:</span> {data.client.document}</p>}
                            {data.client.email && <p><span className="font-semibold">Email:</span> {data.client.email}</p>}
                            {data.client.phone && <p><span className="font-semibold">Tel:</span> {data.client.phone}</p>}
                            {data.client.address && <p className="sm:col-span-2"><span className="font-semibold">Endereço:</span> {data.client.address}</p>}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mb-8 overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[500px]">
                        <thead>
                            <tr className="bg-brand-600 text-white">
                                <th className="py-3 px-4 text-left font-semibold text-sm">Descrição</th>
                                <th className="py-3 px-4 text-center font-semibold text-sm w-20">Qtd</th>
                                <th className="py-3 px-4 text-right font-semibold text-sm w-32">Unitário</th>
                                <th className="py-3 px-4 text-right font-semibold text-sm w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {data.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm whitespace-normal break-words">{item.description}</td>
                                    <td className="py-4 px-4 text-center text-sm">{item.quantity} {item.unit}</td>
                                    <td className="py-4 px-4 text-right text-sm">
                                        {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="py-4 px-4 text-right font-medium text-sm text-gray-900">
                                        {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                </tr>
                            ))}
                            {data.items.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-400 italic">Nenhum item adicionado</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex flex-col items-end mb-12">
                    <div className="w-full sm:w-72 space-y-3 bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal:</span>
                            <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-red-500 font-medium">
                                <span>Desconto {data.discountPercent ? `(${data.discountPercent}%)` : ''}:</span>
                                <span>- {discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-brand-700 border-t border-gray-200 pt-3">
                            <span>Total:</span>
                            <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {data.notes && (
                    <div className="bg-yellow-50/50 p-6 rounded-lg border border-yellow-100 text-sm text-gray-600 mb-8">
                        <p className="font-bold mb-2 text-gray-800 flex items-center">
                            Observações e Condições
                        </p>
                        <p className="whitespace-pre-line leading-relaxed">{data.notes}</p>
                    </div>
                )}
                
                {/* HIGH VISIBILITY CLIENT FEEDBACK (NEGOTIATION/REJECTION) */}
                {data.clientFeedback && (
                    <div className={`p-6 rounded-xl border-l-4 mb-8 shadow-sm ${
                        isRejected 
                        ? 'bg-red-50 border-red-500 text-red-900' 
                        : 'bg-yellow-50 border-yellow-500 text-yellow-900'
                    }`}>
                         <div className="flex items-center gap-2 mb-2">
                             {isRejected ? <AlertCircle className="text-red-600"/> : <AlertTriangle className="text-yellow-600"/>}
                             <p className="font-bold text-lg uppercase tracking-wide">
                                 {isRejected ? 'Motivo da Recusa:' : 'Solicitação de Ajuste do Cliente:'}
                             </p>
                         </div>
                         <div className="bg-white/50 p-4 rounded-lg border border-black/5 text-base font-medium italic">
                            "{data.clientFeedback}"
                         </div>
                    </div>
                )}

                {/* Signature Preview (In Document) */}
                {signature && (
                    <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                         <div className="text-center">
                            <img src={signature} alt="Assinatura" className="h-16 mb-1 mx-auto" />
                            <p className="text-xs text-gray-500 border-t border-gray-300 pt-1 px-4">Aceite do Cliente</p>
                         </div>
                    </div>
                )}

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center border-t border-gray-100 bg-white">
                    <p className="text-gray-400 text-xs">Obrigado pela preferência!</p>
                    <p className="text-gray-300 text-[10px] mt-1">Gerado via OrçaFácil</p>
                </div>

            </div>
          </div>

          {/* Sidebar Tools - CLOSING CENTER */}
          <div className="lg:col-span-1 space-y-6">
              
              {isApproved ? (
                 <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                     <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 mx-auto mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Negócio Fechado!</h3>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                            Este orçamento foi aprovado e registrado no seu histórico.
                        </p>
                     </div>
                 </Card>
              ) : isRejected ? (
                 <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                     <div className="text-center py-6">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center text-red-600 dark:text-red-300 mx-auto mb-4">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-red-800 dark:text-red-300">Orçamento Rejeitado</h3>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                            O cliente optou por não prosseguir.
                        </p>
                     </div>
                 </Card>
              ) : (
                <>
                {/* Digital Signature Panel */}
                <Card 
                    title="Assinatura Presencial" 
                    icon={<PenTool size={20} />}
                    className="!overflow-visible border-brand-200 dark:border-brand-800 shadow-lg"
                >
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Cliente presente? Colete a assinatura aqui.
                    </p>
                    <SignaturePad 
                        onSave={handleSignAndApprove} 
                        onClear={handleClearSignature} 
                        existingSignature={signature}
                    />
                </Card>

                {/* Link Sharing Panel */}
                <Card title="Negociação Online" icon={<Globe size={20} />}>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                      <p className="text-xs">
                          Envie um <strong>Link Inteligente</strong>. O cliente acessa, visualiza e clica em Aprovar ou Pedir Ajuste.
                      </p>
                      
                      <button 
                        onClick={onSimulateClientView}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                      >
                          <Eye size={18} />
                          Simular Visão do Cliente
                      </button>
                      
                      <div className="text-[10px] text-center text-gray-400">
                          * Como este é um app local, use a simulação para ver como funciona.
                      </div>
                  </div>
                </Card>
                </>
              )}

          </div>
      </div>
    </div>
  );
};

export default QuotePreview;
