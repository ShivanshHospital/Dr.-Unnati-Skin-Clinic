import React from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Receipt,
  Eye,
  PlusCircle,
  FileText,
  Clock,
  IndianRupee,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Invoice, Patient } from '../../types';

interface PatientProfileModalProps {
  patientId: string;
  onClose: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onOpenNewInvoiceForPatient: (patient: Patient) => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  patientId,
  onClose,
  onViewInvoice,
  onOpenNewInvoiceForPatient,
}) => {
  const { patients, invoices } = useData();

  const patient = patients.find((p) => p.id === patientId);

  if (!patient) return null;

  // Filter invoices for this patient (by patientId or patientUHID)
  const patientInvoices = invoices.filter(
    (i) => i.patientId === patient.id || i.patientUHID === patient.id
  );

  const activeInvoices = patientInvoices.filter((i) => i.status === 'ACTIVE');
  const totalSpent = activeInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const lastVisit = patientInvoices.length > 0 ? patientInvoices[0].date : patient.registeredAt;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E8E2DC] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#2B2420] via-[#3B3029] to-[#2B2420] text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C98A7D] text-white font-serif text-xl font-bold flex items-center justify-center shadow-md">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-xl font-bold text-white">{patient.fullName}</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[#F9EFEF]">
                  {patient.id}
                </span>
              </div>
              <p className="text-xs text-[#D8CFC8] mt-0.5">
                {patient.gender}, {patient.age} Yrs • Registered {formatDate(patient.registeredAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onClose();
                onOpenNewInvoiceForPatient(patient);
              }}
              className="flex items-center space-x-1.5 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white font-bold text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF7F5]">
          {/* Patient Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E8E2DC]">
              <span className="text-[11px] font-bold text-[#7C7067] uppercase tracking-wider">Total Visits</span>
              <p className="text-xl font-bold font-mono text-[#2B2420] mt-1">{patientInvoices.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E8E2DC]">
              <span className="text-[11px] font-bold text-[#7C7067] uppercase tracking-wider">Total Billing (Spent)</span>
              <p className="text-xl font-bold font-mono text-[#5B8A72] mt-1">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E8E2DC]">
              <span className="text-[11px] font-bold text-[#7C7067] uppercase tracking-wider">Last Visit Date</span>
              <p className="text-sm font-bold text-[#2B2420] mt-1.5">{formatDate(lastVisit, true)}</p>
            </div>
          </div>

          {/* Demographics Detail Grid */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#2B2420] border-b border-[#E8E2DC] pb-2">
              Patient Demographics & Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center space-x-2 text-[#7C7067]">
                <Phone className="w-4 h-4 text-[#C98A7D]" />
                <span className="font-mono font-bold text-[#2B2420]">{patient.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-[#7C7067]">
                <Mail className="w-4 h-4 text-[#C98A7D]" />
                <span>{patient.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center space-x-2 text-[#7C7067]">
                <MapPin className="w-4 h-4 text-[#C98A7D]" />
                <span>{patient.address || 'Surendranagar'}</span>
              </div>
              <div className="flex items-center space-x-2 text-[#7C7067]">
                <User className="w-4 h-4 text-[#C98A7D]" />
                <span>Referred By: <strong className="text-[#2B2420]">{patient.referredBy || 'Direct'}</strong></span>
              </div>
            </div>

            {patient.allergiesNotes && (
              <div className="p-3 bg-[#FFF5EE] border border-[#FDE3D3] rounded-xl text-xs flex items-start space-x-2 mt-2">
                <AlertTriangle className="w-4 h-4 text-[#D97736] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#2B2420]">Medical Notes & Allergies:</span>
                  <p className="text-[#7C7067] mt-0.5">{patient.allergiesNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Invoice & Visit Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] space-y-4">
            <h3 className="font-serif text-base font-bold text-[#2B2420] border-b border-[#E8E2DC] pb-2 flex items-center justify-between">
              <span>Complete Invoice & Visit Timeline</span>
              <span className="text-xs font-normal text-[#7C7067]">
                Showing {patientInvoices.length} bill(s)
              </span>
            </h3>

            {patientInvoices.length > 0 ? (
              <div className="space-y-3">
                {patientInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl hover:border-[#C98A7D] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-[#2B2420]">
                          {inv.invoiceNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            inv.invoiceType === 'OPD'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : inv.invoiceType === 'PROCEDURE'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {inv.invoiceType}
                        </span>
                        {inv.status === 'CANCELLED' && (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-700 border border-red-300">
                            VOIDED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7C7067]">
                        Date: {formatDate(inv.date, true)} • Doctor: {inv.doctorName || 'Pharmacy'}
                      </p>
                      <div className="text-[11px] text-[#2B2420]">
                        Items: {inv.items.map((i) => i.description).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#2B2420]">
                          {formatCurrency(inv.grandTotal)}
                        </span>
                        <div className="text-[10px] font-semibold text-[#5B8A72]">
                          {inv.paymentMode} ({inv.paymentStatus})
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onViewInvoice(inv);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2DC] text-[#2B2420] hover:bg-[#C98A7D] hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Bill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#7C7067]">
                No invoices recorded for this patient yet. Click "Create Invoice" above to generate their first bill.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
