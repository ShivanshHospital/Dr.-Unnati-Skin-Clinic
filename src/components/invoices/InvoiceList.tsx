import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  XCircle,
  Download,
  PlusCircle,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Cloud,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { downloadInvoicePDF } from '../../lib/invoicePdf';
import { Invoice, InvoiceType, PaymentStatus } from '../../types';

interface InvoiceListProps {
  onViewInvoice: (invoice: Invoice) => void;
  onOpenNewInvoice: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onViewInvoice, onOpenNewInvoice }) => {
  const { invoices, cancelInvoice, isSyncing, lastSyncTime, syncWithSupabase, settings } = useData();
  const { hasPermission } = useAuth();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setSyncFeedback(null);
    const res = await syncWithSupabase();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Void Invoice modal state
  const [voidingInvoice, setVoidingInvoice] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesQuery =
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientPhone.includes(searchQuery);

    const matchesType = filterType === 'ALL' || inv.invoiceType === filterType;
    const matchesPayment = filterPayment === 'ALL' || inv.paymentStatus === filterPayment;
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;

    return matchesQuery && matchesType && matchesPayment && matchesStatus;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Type',
      'Date',
      'Patient Name',
      'UHID',
      'Doctor',
      'Subtotal',
      'Discount',
      'Tax Total',
      'Grand Total',
      'Payment Mode',
      'Payment Status',
      'Status',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNo,
      inv.invoiceType,
      formatDate(inv.date),
      `"${inv.patientName}"`,
      inv.patientUHID || '',
      `"${inv.doctorName || ''}"`,
      inv.subtotal,
      inv.discountTotal,
      inv.taxTotal,
      inv.grandTotal,
      inv.paymentMode,
      inv.paymentStatus,
      inv.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dr_Unnati_Clinic_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingInvoice || !voidReason.trim()) {
      alert('A mandatory cancellation reason must be provided.');
      return;
    }
    cancelInvoice(voidingInvoice.id, voidReason);
    setVoidingInvoice(null);
    setVoidReason('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#C98A7D]" /> Invoice History & Records
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Search, filter, reprint, or void billing invoices across all departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Save and backup all invoices and PDFs to Supabase backend"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Supabase Backend'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-[#FAF7F5] hover:bg-[#E8E2DC] text-[#2B2420] border border-[#E8E2DC] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#5B8A72]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenNewInvoice}
            className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2DC] clinic-shadow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C7067]" />
          <input
            type="text"
            placeholder="Search invoice no, patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
          />
        </div>

        {/* Filter Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold"
        >
          <option value="ALL">All Invoice Types</option>
          <option value="OPD">OPD Consultation</option>
          <option value="PROCEDURE">Procedure / Laser</option>
          <option value="MEDICINE">Pharmacy Sale</option>
        </select>

        {/* Filter Payment */}
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold"
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>

        {/* Filter Void Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold"
        >
          <option value="ALL">Active & Voided</option>
          <option value="ACTIVE">Active Only</option>
          <option value="CANCELLED">Voided / Cancelled Only</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-[#FAF7F5] transition-colors ${
                      inv.status === 'CANCELLED' ? 'bg-red-50/40 opacity-70' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C98A7D]">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                          inv.invoiceType === 'OPD'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : inv.invoiceType === 'PROCEDURE'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {inv.invoiceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#2B2420]">
                      {inv.patientName}
                      <div className="text-[10px] text-[#7C7067] font-mono">{inv.patientPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">
                      {inv.doctorName || 'Pharmacy'}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">
                      {formatDate(inv.date, true)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-right text-[#2B2420]">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#2B2420]">{inv.paymentMode}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6F2] text-[#5B8A72]">
                          {inv.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {inv.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                          VOIDED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#2B2420] hover:bg-[#C98A7D] hover:text-white transition-all font-semibold flex items-center gap-1 text-[11px]"
                          title="View & Print Bill"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        <button
                          onClick={() => downloadInvoicePDF(inv, settings)}
                          className="p-1.5 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#7C7067] hover:bg-[#C98A7D] hover:text-white transition-all cursor-pointer"
                          title="Download PDF directly"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {inv.pdfUrl && (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all"
                            title="Open Cloud PDF (Supabase Storage)"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {inv.status === 'ACTIVE' && hasPermission('cancel_invoice') && (
                          <button
                            onClick={() => setVoidingInvoice(inv)}
                            className="p-1.5 rounded-lg bg-red-50 text-[#D9534F] hover:bg-red-600 hover:text-white transition-all"
                            title="Cancel / Void Invoice"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#7C7067]">
                    No invoices found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Reason Void Invoice Modal */}
      {voidingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E8E2DC] space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-[#D9534F]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-base font-bold">Void Invoice — {voidingInvoice.invoiceNo}</h3>
            </div>
            <p className="text-xs text-[#7C7067]">
              Warning: Voiding will mark this invoice as CANCELLED in the audit log. If this is a Medicine invoice, medicine stock will automatically be restored.
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">
                  Mandatory Cancellation Reason <span className="text-[#D9534F]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Billing calculation error / Patient cancelled treatment..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setVoidingInvoice(null)}
                  className="px-3 py-1.5 text-xs text-[#7C7067]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#D9534F] text-white rounded-xl shadow-xs"
                >
                  Confirm & Void Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
