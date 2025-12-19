
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteData } from '../types';
import { calculateQuoteTotals } from '../utils/calculations';

export const generateQuotePDF = (quote: QuoteData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Set Metadata
  doc.setProperties({
      title: `Orçamento #${quote.number} - ${quote.client.name}`,
      subject: 'Proposta Comercial',
      // Fixed: Property 'name' does not exist on type 'CompanyProfile'. Using nome_fantasia.
      author: quote.company.nome_fantasia || 'OrçaFácil',
      creator: 'OrçaFácil App'
  });

  // --- COLOR CONFIGURATION ---
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [37, 99, 235];
  };

  // Fixed: Property 'brandColor' does not exist on type 'CompanyProfile'. Using brand_color.
  const brandColorHex = quote.company.brand_color || '#2563eb';
  const primaryColor = hexToRgb(brandColorHex);
  
  const grayColor = [100, 116, 139]; // Slate-500
  const blackColor = [30, 41, 59]; // Slate-800
  const redColor = [220, 38, 38]; // Red-600

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // --- HEADER ---
  let yPos = 20;

  // 1. Render Logo if exists
  // Fixed: Property 'logoUrl' does not exist on type 'CompanyProfile'. Using logo_url.
  if (quote.company.logo_url) {
    try {
        // Render logo (max width 40mm, max height 25mm)
        // Fixed: Property 'logoUrl' does not exist on type 'CompanyProfile'. Using logo_url.
        doc.addImage(quote.company.logo_url, 14, 15, 35, 0); 
        yPos = 45; 
    } catch (e) {
        console.error("Error rendering logo", e);
        yPos = 20;
    }
  }

  // 2. Company Info (Left)
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  // Fixed: Property 'name' does not exist on type 'CompanyProfile'. Using nome_fantasia.
  doc.text(quote.company.nome_fantasia || "Sua Empresa", 14, yPos);

  yPos += 8; // Move down for details

  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont("helvetica", "normal");
  
  // Fixed: Property 'document', 'address', 'phone' do not exist on type 'CompanyProfile'. Using cnpj, endereco, telefone.
  if (quote.company.cnpj) { doc.text(`CNPJ/CPF: ${quote.company.cnpj}`, 14, yPos); yPos += 5; }
  if (quote.company.endereco) { doc.text(quote.company.endereco, 14, yPos); yPos += 5; }
  if (quote.company.email || quote.company.telefone) { 
    doc.text(`${quote.company.email} | ${quote.company.telefone}`, 14, yPos); 
  }

  // 3. Quote Info (Right - Fixed Position)
  const rightYStart = 20;
  
  doc.setFontSize(10);
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("ORÇAMENTO", pageWidth - 14, rightYStart, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`#${quote.number}`, pageWidth - 14, rightYStart + 6, { align: "right" });
  doc.text(`Data: ${new Date(quote.date).toLocaleDateString('pt-BR')}`, pageWidth - 14, rightYStart + 12, { align: "right" });
  if (quote.dueDate) {
    doc.text(`Válido até: ${new Date(quote.dueDate).toLocaleDateString('pt-BR')}`, pageWidth - 14, rightYStart + 18, { align: "right" });
  }

  // Divider
  const dividerY = Math.max(yPos, 50) + 5;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(14, dividerY, pageWidth - 14, dividerY);

  // --- CLIENT SECTION ---
  yPos = dividerY + 10;
  doc.setFontSize(12);
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Orçamento para:", 14, yPos);
  
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(quote.client.name, 14, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  if (quote.client.document) { doc.text(`CPF/CNPJ: ${quote.client.document}`, 14, yPos); yPos += 5; }
  if (quote.client.address) { doc.text(quote.client.address, 14, yPos); yPos += 5; }
  if (quote.client.email || quote.client.phone) { 
    doc.text(`${quote.client.email || ''} ${quote.client.phone ? '• ' + quote.client.phone : ''}`, 14, yPos); 
  }

  // --- ITEMS TABLE ---
  const tableColumn = ["Descrição", "Qtd", "Preço Unit.", "Total"];
  const tableRows = quote.items.map(item => [
    item.description,
    `${item.quantity} ${item.unit || ''}`, // Add unit here
    formatCurrency(item.unitPrice),
    formatCurrency(item.quantity * item.unitPrice)
  ]);

  autoTable(doc, {
    startY: yPos + 10,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor as any, // Use Brand Color
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Description
      1: { cellWidth: 25, halign: 'center' }, // Qty + Unit
      2: { cellWidth: 35, halign: 'right' }, // Unit Price
      3: { cellWidth: 35, halign: 'right' }, // Total
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
    }
  });

  // --- TOTALS ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const { subtotal, discount, total } = calculateQuoteTotals(quote);

  const totalsX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  doc.text("Subtotal:", totalsX, finalY);
  doc.text(formatCurrency(subtotal), pageWidth - 14, finalY, { align: "right" });

  if (discount > 0) {
    doc.setTextColor(redColor[0], redColor[1], redColor[2]);
    let discountLabel = "Desconto:";
    if (quote.discountPercent && quote.discountPercent > 0) {
        discountLabel = `Desconto (${quote.discountPercent}%):`;
    }
    doc.text(discountLabel, totalsX, finalY + 6);
    doc.text(`- ${formatCurrency(discount)}`, pageWidth - 14, finalY + 6, { align: "right" });
  }

  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Brand Color
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", totalsX, finalY + 14);
  doc.text(formatCurrency(total), pageWidth - 14, finalY + 14, { align: "right" });

  // --- NOTES ---
  let noteY = finalY + 30;
  if (quote.notes) {
    doc.setFontSize(10);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Observações e Condições:", 14, noteY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    
    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - 28);
    doc.text(splitNotes, 14, noteY + 6);
    noteY += 6 + (splitNotes.length * 5); // Update Y pos based on text length
  }

  // --- APPROVAL SECTION (DIGITAL SIGNATURE ONLY) ---
  
  // Calculate position for footer elements
  const footerAreaStart = Math.max(noteY + 10, pageHeight - 60);

  // Check if we need a new page
  if (footerAreaStart > pageHeight - 40) {
      doc.addPage();
      // Reset Y for new page
      noteY = 20; 
  }

  // 1. DIGITAL SIGNATURE (If present - Captured in App)
  if (quote.signature) {
      const sigY = Math.max(noteY + 10, pageHeight - 50);
      try {
        // Draw the signature image
        doc.addImage(quote.signature, 'PNG', pageWidth / 2 - 25, sigY - 25, 50, 25);
        
        // Draw the line under it
        doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
        
        doc.setFontSize(10);
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text(`Aceite de ${quote.client.name.split(' ')[0]}`, pageWidth / 2, sigY + 5, { align: "center" });
      } catch (e) {
        console.error("Failed to render signature", e);
      }
  } else if (quote.company.showSignature !== false) {
      // 2. MANUAL SIGNATURE LINE (If enabled in settings and not digitally signed)
      // Fixed: Property 'showSignature' is now available on CompanyProfile via types.ts update.
      const sigY = Math.max(noteY + 10, pageHeight - 50);
      
      doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
      
      doc.setFontSize(10);
      doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.text("Assinatura do Cliente", pageWidth / 2, sigY + 5, { align: "center" });
  }

  // --- FOOTER ---
  const footerY = pageHeight - 15;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Obrigado pela preferência!", pageWidth / 2, footerY, { align: "center" });
  doc.text("Gerado via OrçaFácil", pageWidth / 2, footerY + 4, { align: "center" });

  const safeName = quote.client.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`${dateStr}_Orcamento_${safeName}_${quote.number}.pdf`);
};
