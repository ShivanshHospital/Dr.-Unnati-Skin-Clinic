import React from 'react';
import { Invoice } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, numberToWordsINR } from '../../lib/utils';
import { Printer, Download, X, AlertTriangle } from 'lucide-react';

interface PrintableInvoiceProps {
  invoice: Invoice;
  onClose?: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, onClose }) => {
  const { settings } = useData();

  const handlePrint = () => {
    window.print();
  };

  const isCancelled = invoice.status === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-[#E8E2DC] clinic-shadow flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-serif font-bold text-sm text-[#2B2420]">
            Invoice Preview — <span className="font-mono text-[#C98A7D]">{invoice.invoiceNo}</span>
          </span>
          {isCancelled && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              CANCELLED / VOIDED
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice (A4 / Thermal)</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[#7C7067] hover:bg-[#FAF7F5] rounded-xl font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* PRINTABLE BILL CANVAS (A4 Format) */}
      <div className="printable-area bg-white p-8 rounded-2xl border border-[#E8E2DC] clinic-shadow max-w-4xl mx-auto text-[#2B2420] relative">
        {/* Void Stamp Overlay */}
        {isCancelled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="border-8 border-red-500/40 text-red-500/40 font-serif font-bold text-6xl uppercase tracking-widest px-12 py-6 rounded-3xl -rotate-12 select-none">
              VOID / CANCELLED
            </div>
          </div>
        )}

        {/* Clinic Header */}
        <div className="border-b-2 border-[#2B2420] pb-5 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2B2420] tracking-tight">
              {settings.clinicName}
            </h1>
            <p className="text-xs font-semibold text-[#C98A7D] uppercase tracking-wider mt-0.5">
              {(settings.tagline || 'Advanced Cosmetology, Laser & Aesthetic Care').replace(/Dermatology/gi, 'Cosmetology').replace(/Dermatological/gi, 'Cosmetological')}
            </p>
            <p className="text-xs text-[#7C7067] mt-1.5 max-w-md leading-relaxed">
              {settings.address}
            </p>
            <p className="text-xs text-[#7C7067] mt-0.5 font-mono">
              Phone: {settings.phone} • Email: {settings.email}
            </p>
            <p className="text-xs text-[#7C7067] mt-0.5 font-mono">
              GSTIN: <span className="font-bold text-[#2B2420]">{settings.gstin}</span> • Reg No:{' '}
              <span className="font-bold text-[#2B2420]">{settings.registrationNo}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] font-serif font-bold text-sm text-[#2B2420] uppercase">
              {invoice.invoiceType} INVOICE
            </div>
            <div className="mt-3">
              <p className="text-xs text-[#7C7067]">Invoice Number</p>
              <p className="font-mono font-bold text-base text-[#C98A7D]">{invoice.invoiceNo}</p>
            </div>
            <div className="mt-1">
              <p className="text-xs text-[#7C7067]">Date & Time</p>
              <p className="text-xs font-semibold text-[#2B2420]">
                {formatDate(invoice.date, true)}
              </p>
            </div>
          </div>
        </div>

        {/* Patient & Doctor Meta Banner */}
        <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-[#FAF7F5] rounded-xl border border-[#E8E2DC] text-xs">
          <div>
            <h4 className="font-bold text-[#7C7067] uppercase tracking-wider text-[10px] mb-1">
              Billed To Patient Details
            </h4>
            <p className="font-bold text-sm text-[#2B2420]">{invoice.patientName}</p>
            <p className="text-[#7C7067] font-mono mt-0.5">
              UHID: <span className="font-bold text-[#2B2420]">{invoice.patientUHID || 'N/A'}</span>
            </p>
            <p className="text-[#7C7067] mt-0.5 font-mono">Mobile: {invoice.patientPhone}</p>
            {invoice.patientAgeGender && (
              <p className="text-[#7C7067] mt-0.5">Age/Gender: {invoice.patientAgeGender}</p>
            )}
          </div>

          <div className="text-right">
            <h4 className="font-bold text-[#7C7067] uppercase tracking-wider text-[10px] mb-1">
              Attending Doctor / Staff
            </h4>
            <p className="font-bold text-sm text-[#2B2420]">{invoice.doctorName || 'Dr. Unnati Suthar'}</p>
            <p className="text-[#7C7067] mt-0.5">Cosmetologist & Aesthetic Care</p>
            <p className="text-[#7C7067] mt-1 font-mono text-[11px]">
              Billed by: {invoice.creatorName}
            </p>
          </div>
        </div>

        {/* Itemized Services & Products Table */}
        <div className="my-6 overflow-hidden rounded-xl border border-[#E8E2DC]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#2B2420] uppercase font-bold">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Unit Price (₹)</th>
                <th className="py-3 px-3 text-right">Discount (₹)</th>
                <th className="py-3 px-3 text-right">GST %</th>
                <th className="py-3 px-3 text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {invoice.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-mono text-[#7C7067]">{index + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#2B2420]">
                      {item.description ? item.description.replace(/Dermatology/gi, 'Cosmetology').replace(/Dermatological/gi, 'Cosmetological') : ''}
                    </div>
                    {item.hsnCode && (
                      <div className="text-[10px] text-[#7C7067] font-mono">HSN: {item.hsnCode}</div>
                    )}
                    {item.sessionNote && (
                      <div className="text-[10px] text-purple-700 font-semibold">{item.sessionNote}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-3 text-right font-mono text-[#D9534F]">
                    {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#7C7067]">{item.taxRate}%</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#2B2420]">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Totals & Amount in Words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 pt-4 border-t border-[#E8E2DC]">
          <div>
            <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#E8E2DC] text-xs space-y-1">
              <span className="font-bold text-[#7C7067] uppercase text-[10px]">Grand Total in Words</span>
              <p className="font-serif font-bold text-[#2B2420] italic">
                {numberToWordsINR(invoice.grandTotal)}
              </p>
            </div>

            <div className="mt-4 text-xs space-y-1">
              <p className="text-[#7C7067]">
                Payment Mode:{' '}
                <span className="font-bold text-[#2B2420]">{invoice.paymentMode}</span>
              </p>
              <p className="text-[#7C7067]">
                Payment Status:{' '}
                <span className="font-bold text-[#5B8A72]">{invoice.paymentStatus}</span>
              </p>
              {invoice.notes && (
                <p className="text-[#7C7067] italic mt-1">Remarks: {invoice.notes}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-xs text-right">
            <div className="flex justify-between text-[#7C7067]">
              <span>Subtotal Amount:</span>
              <span className="font-mono font-bold text-[#2B2420]">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-[#D9534F]">
                <span>Total Discount Allowed:</span>
                <span className="font-mono font-bold">
                  - {formatCurrency(invoice.discountTotal)}
                </span>
              </div>
            )}

            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-[#7C7067]">
                <span>GST Tax (CGST + SGST):</span>
                <span className="font-mono font-bold text-[#2B2420]">
                  + {formatCurrency(invoice.taxTotal)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-[#2B2420] flex justify-between items-baseline text-sm">
              <span className="font-bold text-[#2B2420]">Net Payable Grand Total:</span>
              <span className="font-mono font-bold text-lg text-[#C98A7D]">
                {formatCurrency(invoice.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Terms & Signature Line */}
        <div className="mt-12 pt-6 border-t border-[#E8E2DC] flex items-end justify-between text-xs">
          <div className="max-w-md space-y-1 text-[11px] text-[#7C7067]">
            <p className="font-bold text-[#2B2420]">Terms & Conditions:</p>
            <p className="whitespace-pre-line leading-relaxed">{settings.termsAndConditions}</p>
          </div>

          <div className="text-center w-52 space-y-8">
            <div className="border-b border-[#2B2420]" />
            <p className="font-bold text-xs text-[#2B2420]">Authorized Signature</p>
            <p className="text-[10px] text-[#7C7067]">For Dr. Unnati Skin Clinic</p>
          </div>
        </div>
      </div>
    </div>
  );
};
