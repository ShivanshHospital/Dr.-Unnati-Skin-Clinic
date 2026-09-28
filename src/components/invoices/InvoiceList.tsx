import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  UserCheck,
  Stethoscope,
  FileText,
  Files,
  X,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  downloadInvoicePDF,
  downloadMultipleInvoicesPDF,
  downloadInvoicesIndividually,
} from '../../lib/invoicePdf';
import { Invoice, InvoiceType, PaymentStatus } from '../../types';

interface InvoiceListProps {
  onViewInvoice: (invoice: Invoice) => void;
  onOpenNewInvoice: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onViewInvoice, onOpenNewInvoice }) => {
  const { invoices, patients, doctors, cancelInvoice, isSyncing, lastSyncTime, syncWithSupabase, settings } = useData();
  const { hasPermission } = useAuth();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    syncWithSupabase().catch(() => {});
  }, []);

  const handleManualSync = async () => {
    setSyncFeedback(null);
    const res = await syncWithSupabase();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDoctor, setFilterDoctor] = useState<string>('ALL');
  const [filterReferral, setFilterReferral] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeDatePreset, setActiveDatePreset] = useState<string>('ALL');

  // Void Invoice modal state
  const [voidingInvoice, setVoidingInvoice] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Multi-PDF Export modal state
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Mapping from patient UHID / patientId to referredBy
  const patientReferralMap = useMemo(() => {
    const map: Record<string, string> = {};
    (patients || []).forEach((p) => {
      if (p.referredBy && p.referredBy.trim()) {
        if (p.id) map[p.id] = p.referredBy.trim();
      }
    });
    return map;
  }, [patients]);

  // Unique lists for dropdowns
  const uniqueDoctors = useMemo(() => {
    const set = new Set<string>();
    (doctors || []).forEach((d) => {
      if (d.name && d.name.trim()) set.add(d.name.trim());
    });
    (invoices || []).forEach((inv) => {
      if (inv.doctorName && inv.doctorName.trim()) set.add(inv.doctorName.trim());
    });
    return Array.from(set).sort();
  }, [doctors, invoices]);

  const uniqueReferralDoctors = useMemo(() => {
    const set = new Set<string>();
    (patients || []).forEach((p) => {
      if (p.referredBy && p.referredBy.trim()) {
        set.add(p.referredBy.trim());
      }
    });
    return Array.from(set).sort();
  }, [patients]);

  // Date preset helper
  const handleDatePreset = (preset: string) => {
    setActiveDatePreset(preset);
    const now = new Date();
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = toDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = toDateStr(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'LAST_7_DAYS') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      setStartDate(toDateStr(past7));
      setEndDate(toDateStr(now));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toDateStr(firstDay));
      setEndDate(toDateStr(now));
    } else if (preset === 'LAST_MONTH') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toDateStr(firstDayLastMonth));
      setEndDate(toDateStr(lastDayLastMonth));
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setFilterPayment('ALL');
    setFilterStatus('ALL');
    setFilterDoctor('ALL');
    setFilterReferral('ALL');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset('ALL');
  };

  const activeFiltersCount = [
    searchQuery.trim() !== '',
    filterType !== 'ALL',
    filterPayment !== 'ALL',
    filterStatus !== 'ALL',
    filterDoctor !== 'ALL',
    filterReferral !== 'ALL',
    startDate !== '',
    endDate !== '',
  ].filter(Boolean).length;

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.patientPhone.includes(q) ||
        (inv.patientUHID && inv.patientUHID.toLowerCase().includes(q));

      // Department / Invoice Type
      const matchesType = filterType === 'ALL' || inv.invoiceType === filterType;

      // Payment Status
      const matchesPayment = filterPayment === 'ALL' || inv.paymentStatus === filterPayment;

      // Active / Cancelled status
      const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;

      // Doctor filter
      const matchesDoctor =
        filterDoctor === 'ALL' ||
        (inv.doctorName && inv.doctorName.toLowerCase() === filterDoctor.toLowerCase());

      // Referral Doctor filter
      const invReferral =
        patientReferralMap[inv.patientUHID || ''] ||
        patientReferralMap[inv.patientId || ''] ||
        '';
      const matchesReferral =
        filterReferral === 'ALL' ||
        (invReferral && invReferral.toLowerCase() === filterReferral.toLowerCase());

      // Date range filter
      const invoiceDateStr = inv.date ? inv.date.slice(0, 10) : '';
      const matchesStartDate = !startDate || invoiceDateStr >= startDate;
      const matchesEndDate = !endDate || invoiceDateStr <= endDate;

      return (
        matchesQuery &&
        matchesType &&
        matchesPayment &&
        matchesStatus &&
        matchesDoctor &&
        matchesReferral &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    invoices,
    searchQuery,
    filterType,
    filterPayment,
    filterStatus,
    filterDoctor,
    filterReferral,
    startDate,
    endDate,
    patientReferralMap,
  ]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Type',
      'Date',
      'Patient Name',
      'UHID',
      'Referral Doctor',
      'Attending Doctor',
      'Subtotal',
      'Discount',
      'Tax Total',
      'Grand Total',
      'Payment Mode',
      'Payment Status',
      'Status',
    ];

    const rows = filteredInvoices.map((inv) => {
      const referral =
        patientReferralMap[inv.patientUHID || ''] ||
        patientReferralMap[inv.patientId || ''] ||
        '';
      return [
        inv.invoiceNo,
        inv.invoiceType,
        formatDate(inv.date),
        `"${inv.patientName}"`,
        inv.patientUHID || '',
        `"${referral}"`,
        `"${inv.doctorName || ''}"`,
        inv.subtotal,
        inv.discountTotal,
        inv.taxTotal,
        inv.grandTotal,
        inv.paymentMode,
        inv.paymentStatus,
        inv.status,
      ];
    });

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

  // Export Combined PDF
  const handleExportCombinedPdf = () => {
    if (filteredInvoices.length === 0) return;
    setIsExportingPdf(true);
    setExportSuccessMsg(null);
    try {
      const typePart = filterType !== 'ALL' ? `_${filterType}` : '';
      const datePart = startDate ? `_${startDate}_to_${endDate || startDate}` : '';
      const filename = `Dr_Unnati_Clinic_Invoices${typePart}${datePart}.pdf`;
      downloadMultipleInvoicesPDF(filteredInvoices, settings, filename, patientReferralMap);
      setExportSuccessMsg(`Successfully generated combined PDF with ${filteredInvoices.length} invoices!`);
      setTimeout(() => {
        setExportSuccessMsg(null);
        setShowExportPdfModal(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to export combined PDF:', err);
      alert('Failed to generate combined PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Individual PDFs Batch
  const handleExportIndividualBatchPdf = async () => {
    if (filteredInvoices.length === 0) return;
    setIsExportingPdf(true);
    setExportProgress({ current: 0, total: filteredInvoices.length });
    setExportSuccessMsg(null);
    try {
      await downloadInvoicesIndividually(
        filteredInvoices,
        settings,
        patientReferralMap,
        (curr, total) => setExportProgress({ current: curr, total })
      );
      setExportSuccessMsg(`Downloaded all ${filteredInvoices.length} individual invoice PDFs!`);
      setTimeout(() => {
        setExportSuccessMsg(null);
        setExportProgress(null);
        setShowExportPdfModal(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to batch download PDFs:', err);
      alert('Batch download encountered an issue. Ensure browser popups are allowed.');
    } finally {
      setIsExportingPdf(false);
    }
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

  const totalFilteredAmount = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => acc + (inv.status === 'ACTIVE' ? inv.grandTotal : 0), 0);
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#C98A7D]" /> Invoice History & Records
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Search, filter, reprint, or export single and multi-page PDFs across all departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Save and backup all invoices and PDFs to Supabase backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>

          {/* Export Multiple PDF Action Button */}
          <button
            onClick={() => {
              if (filteredInvoices.length === 0) {
                alert('No invoices match the selected filters to export.');
                return;
              }
              setShowExportPdfModal(true);
            }}
            className="flex items-center space-x-1.5 bg-[#C98A7D] hover:bg-[#B5776A] text-white border border-[#B5776A] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Export filtered invoices as multiple PDFs or a single combined PDF"
          >
            <Files className="w-3.5 h-3.5" />
            <span>Export Multiple PDF</span>
            <span className="ml-1 bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">
              {filteredInvoices.length}
            </span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-[#FAF7F5] hover:bg-[#E8E2DC] text-[#2B2420] border border-[#E8E2DC] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Export filtered records as CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#5B8A72]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewInvoice}
            className="flex items-center space-x-1.5 bg-[#2B2420] hover:bg-[#3D342E] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
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

      {/* Comprehensive Filter Panel */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2DC] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2B2420]">
            <Filter className="w-4 h-4 text-[#C98A7D]" />
            <span>Filter Invoices & Records</span>
            {activeFiltersCount > 0 && (
              <span className="bg-[#C98A7D] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-[#C98A7D] hover:text-[#B5776A] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Date Filter Bar & Quick Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#FAF7F5] p-3 rounded-xl border border-[#E8E2DC]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#7C7067] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#C98A7D]" /> Date Range:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset('CUSTOM');
                }}
                className="px-2.5 py-1 text-xs bg-white border border-[#E8E2DC] rounded-lg text-[#2B2420] focus:ring-1 focus:ring-[#C98A7D]"
                title="Start Date"
              />
              <span className="text-xs text-[#7C7067]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset('CUSTOM');
                }}
                className="px-2.5 py-1 text-xs bg-white border border-[#E8E2DC] rounded-lg text-[#2B2420] focus:ring-1 focus:ring-[#C98A7D]"
                title="End Date"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'All Dates' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_MONTH', label: 'Last Month' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleDatePreset(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  activeDatePreset === preset.id
                    ? 'bg-[#C98A7D] text-white shadow-xs'
                    : 'bg-white text-[#7C7067] border border-[#E8E2DC] hover:bg-[#E8E2DC]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7C7067]" />
            <input
              type="text"
              placeholder="Search invoice, patient, UHID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] focus:ring-1 focus:ring-[#C98A7D]"
            />
          </div>

          {/* Filter Type: OPD, IPD/Procedure, Pharmacy */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold focus:ring-1 focus:ring-[#C98A7D]"
            >
              <option value="ALL">All Types / Depts</option>
              <option value="OPD">OPD Consultation</option>
              <option value="PROCEDURE">Procedure / IPD / Laser</option>
              <option value="MEDICINE">Pharmacy Sale</option>
            </select>
          </div>

          {/* Filter Doctor Name */}
          <div>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold focus:ring-1 focus:ring-[#C98A7D]"
            >
              <option value="ALL">All Attending Doctors</option>
              {uniqueDoctors.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Referral Doctor */}
          <div>
            <select
              value={filterReferral}
              onChange={(e) => setFilterReferral(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold focus:ring-1 focus:ring-[#C98A7D]"
            >
              <option value="ALL">All Referral Doctors</option>
              {uniqueReferralDoctors.map((ref) => (
                <option key={ref} value={ref}>
                  {ref}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status (Payment & Void) */}
          <div className="flex gap-2">
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold"
              title="Payment Status"
            >
              <option value="ALL">All Pay</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420] font-semibold"
              title="Invoice Status"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Voided</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Results Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#7C7067] pt-2 border-t border-[#E8E2DC]/60">
          <div>
            Showing <strong className="text-[#2B2420]">{filteredInvoices.length}</strong> matching invoices
            {invoices.length !== filteredInvoices.length && (
              <span> (out of {invoices.length} total)</span>
            )}
          </div>
          <div>
            Total Active Revenue:{' '}
            <strong className="text-[#2B2420] font-mono">{formatCurrency(totalFilteredAmount)}</strong>
          </div>
        </div>
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
                <th className="py-3.5 px-4">Doctor & Referral</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const referral =
                    patientReferralMap[inv.patientUHID || ''] ||
                    patientReferralMap[inv.patientId || ''] ||
                    '';
                  return (
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
                        <div className="text-[10px] text-[#7C7067] font-mono">
                          {inv.patientPhone} {inv.patientUHID ? `• ${inv.patientUHID}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2B2420]">
                          {inv.doctorName || 'Dr. Unnati Suthar'}
                        </div>
                        {referral && (
                          <div className="text-[10px] text-[#C98A7D] flex items-center gap-1 mt-0.5">
                            <span className="font-semibold text-[#7C7067]">Ref:</span> {referral}
                          </div>
                        )}
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
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#2B2420] hover:bg-[#C98A7D] hover:text-white transition-all font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                            title="View & Print Bill"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>

                          <button
                            onClick={() => downloadInvoicePDF(inv, settings, referral)}
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
                              className="p-1.5 rounded-lg bg-red-50 text-[#D9534F] hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                              title="Cancel / Void Invoice"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                  className="px-3 py-1.5 text-xs text-[#7C7067] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#D9534F] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm & Void Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-PDF Export Options Modal */}
      {showExportPdfModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E8E2DC] space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-3">
              <div className="flex items-center space-x-2 text-[#2B2420]">
                <Files className="w-5 h-5 text-[#C98A7D]" />
                <h3 className="font-serif text-base font-bold">Export Multiple Invoices (PDF)</h3>
              </div>
              <button
                onClick={() => {
                  if (!isExportingPdf) setShowExportPdfModal(false);
                }}
                disabled={isExportingPdf}
                className="text-[#7C7067] hover:text-[#2B2420] p-1 rounded-lg cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Summary Context Box */}
            <div className="bg-[#FAF7F5] rounded-xl p-4 border border-[#E8E2DC] text-xs space-y-2">
              <div className="font-bold text-[#2B2420] text-sm flex items-center justify-between">
                <span>Matching Invoices: {filteredInvoices.length} selected</span>
                <span className="font-mono text-[#C98A7D]">{formatCurrency(totalFilteredAmount)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#7C7067] pt-1 border-t border-[#E8E2DC]/60">
                <div>
                  <span className="font-semibold text-[#2B2420]">Department: </span>
                  {filterType === 'ALL' ? 'All (OPD, IPD, Pharmacy)' : filterType}
                </div>
                <div>
                  <span className="font-semibold text-[#2B2420]">Date Range: </span>
                  {startDate || endDate ? `${startDate || 'Start'} to ${endDate || 'Now'}` : 'All Dates'}
                </div>
                <div>
                  <span className="font-semibold text-[#2B2420]">Doctor: </span>
                  {filterDoctor === 'ALL' ? 'All Doctors' : filterDoctor}
                </div>
                <div>
                  <span className="font-semibold text-[#2B2420]">Referral: </span>
                  {filterReferral === 'ALL' ? 'All Referrals' : filterReferral}
                </div>
              </div>
            </div>

            {/* Progress Bar during batch download */}
            {exportProgress && (
              <div className="space-y-1.5 bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <div className="flex justify-between text-xs font-bold text-blue-900">
                  <span>Downloading individual PDFs...</span>
                  <span>{exportProgress.current} of {exportProgress.total}</span>
                </div>
                <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200"
                    style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success message */}
            {exportSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportSuccessMsg}</span>
              </div>
            )}

            {/* Two Export Options */}
            <div className="space-y-3 pt-1">
              {/* Option 1: Combined Multi-Page PDF */}
              <div className="border border-[#E8E2DC] hover:border-[#C98A7D] p-4 rounded-xl transition-all bg-white hover:bg-[#FAF7F5]/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#2B2420] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#C98A7D]" />
                    <span>Combined Multi-Page PDF (All-in-One)</span>
                  </div>
                  <p className="text-[11px] text-[#7C7067] leading-relaxed">
                    Merges all {filteredInvoices.length} invoices into a single multi-page PDF document (1 invoice per page with clinic branding, patient info, referral doctor, and line items). Best for bulk printing and accounting.
                  </p>
                </div>
                <button
                  onClick={handleExportCombinedPdf}
                  disabled={isExportingPdf}
                  className="shrink-0 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isExportingPdf && !exportProgress ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Combined PDF</span>
                </button>
              </div>

              {/* Option 2: Individual PDFs Batch Download */}
              <div className="border border-[#E8E2DC] hover:border-[#5B8A72] p-4 rounded-xl transition-all bg-white hover:bg-[#FAF7F5]/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#2B2420] flex items-center gap-1.5">
                    <Files className="w-4 h-4 text-[#5B8A72]" />
                    <span>Individual Separate PDFs (Batch Download)</span>
                  </div>
                  <p className="text-[11px] text-[#7C7067] leading-relaxed">
                    Downloads each of the {filteredInvoices.length} invoices as an individual PDF file sequentially. Please ensure your browser allows multiple downloads.
                  </p>
                </div>
                <button
                  onClick={handleExportIndividualBatchPdf}
                  disabled={isExportingPdf}
                  className="shrink-0 bg-[#5B8A72] hover:bg-[#4C7560] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isExportingPdf && exportProgress ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Separate PDFs</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowExportPdfModal(false)}
                disabled={isExportingPdf}
                className="px-4 py-2 text-xs font-semibold text-[#7C7067] hover:text-[#2B2420] cursor-pointer disabled:opacity-40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
