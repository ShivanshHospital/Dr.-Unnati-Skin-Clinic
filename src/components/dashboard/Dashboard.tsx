import React from 'react';
import {
  TrendingUp,
  IndianRupee,
  Receipt,
  Users,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowUpRight,
  Eye,
  Pill,
  Stethoscope,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '../../lib/utils';
import { Invoice } from '../../types';

interface DashboardProps {
  onOpenNewInvoice: (type?: 'OPD' | 'PROCEDURE' | 'MEDICINE') => void;
  onViewInvoice: (invoice: Invoice) => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenNewInvoice,
  onViewInvoice,
  onNavigateTab,
}) => {
  const {
    invoices,
    patients,
    medicines,
    batches,
    doctors,
    lowStockItemsCount,
    expiringBatchesCount,
  } = useData();

  // Helper for today's date comparisons
  const todayStr = new Date().toISOString().split('T')[0];

  const activeInvoices = invoices.filter((i) => i.status === 'ACTIVE');

  // Revenue metrics
  const todayInvoices = activeInvoices.filter((i) => i.date.startsWith(todayStr));
  const todayRevenue = todayInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  const thisMonthInvoices = activeInvoices.filter((i) => {
    const d = new Date(i.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonthInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  // Revenue split by invoice type
  const opdRevenue = activeInvoices
    .filter((i) => i.invoiceType === 'OPD')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const procRevenue = activeInvoices
    .filter((i) => i.invoiceType === 'PROCEDURE')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const medRevenue = activeInvoices
    .filter((i) => i.invoiceType === 'MEDICINE')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalAllRevenue = opdRevenue + procRevenue + medRevenue || 1;

  // Revenue split by doctor
  const doctorRevenueMap: Record<string, number> = {};
  doctors.forEach((doc) => {
    doctorRevenueMap[doc.name] = activeInvoices
      .filter((i) => i.doctorName === doc.name)
      .reduce((sum, i) => sum + i.grandTotal, 0);
  });

  // Low stock list
  const lowStockList = medicines
    .map((m) => {
      const medBatches = batches.filter((b) => b.medicineId === m.id);
      const totalStock = medBatches.reduce((sum, b) => sum + b.quantityInStock, 0);
      return { ...m, totalStock };
    })
    .filter((m) => m.totalStock <= m.reorderLevel)
    .slice(0, 4);

  // Expiring batches list (<60 days)
  const expiringList = batches
    .filter((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      return days <= 60 && b.quantityInStock > 0;
    })
    .map((b) => {
      const med = medicines.find((m) => m.id === b.medicineId);
      return {
        ...b,
        medicineName: med ? med.name : 'Unknown Medicine',
        daysLeft: getDaysUntilExpiry(b.expiryDate),
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Billing Banner */}
      <div className="bg-gradient-to-r from-[#2B2420] via-[#3B3029] to-[#2B2420] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-[#C98A7D]/20 border border-[#C98A7D]/40 text-[#F9EFEF] px-3 py-1 rounded-full text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C98A7D]" />
            <span>Dr. Unnati Skin Clinic Management</span>
          </div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Welcome to Clinic Operations
          </h2>
          <p className="text-sm text-[#D8CFC8] mt-1 max-w-xl leading-relaxed">
            Generate OPD consultations, procedure invoices, OTC pharmacy sales, and monitor real-time stock levels.
          </p>
        </div>

        {/* Quick Action Billing Buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => onOpenNewInvoice('OPD')}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all backdrop-blur-xs cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-[#C98A7D]" />
            <span>OPD Consultation</span>
          </button>
          <button
            onClick={() => onOpenNewInvoice('PROCEDURE')}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all backdrop-blur-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Procedure Invoice</span>
          </button>
          <button
            onClick={() => onOpenNewInvoice('MEDICINE')}
            className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Pill className="w-4 h-4" />
            <span>Pharmacy Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow clinic-shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7C7067] uppercase tracking-wider">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-[#EFF6F2] text-[#5B8A72] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-[#2B2420]">
              {formatCurrency(todayRevenue)}
            </h3>
            <p className="text-xs text-[#7C7067] mt-1 flex items-center gap-1 font-medium">
              <span className="text-[#5B8A72] font-semibold">{todayInvoices.length} bill(s)</span> processed today
            </p>
          </div>
        </div>

        {/* This Month's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow clinic-shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7C7067] uppercase tracking-wider">This Month Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-[#F9EFEF] text-[#C98A7D] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-[#2B2420]">
              {formatCurrency(monthRevenue)}
            </h3>
            <p className="text-xs text-[#7C7067] mt-1 font-medium">
              {thisMonthInvoices.length} invoices generated in FY 25-26
            </p>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow clinic-shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7C7067] uppercase tracking-wider">Registered Patients</span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F5] text-[#2B2420] flex items-center justify-center border border-[#E8E2DC]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-[#2B2420]">{patients.length}</h3>
            <p className="text-xs text-[#C98A7D] mt-1 font-medium cursor-pointer hover:underline" onClick={() => onNavigateTab('patients')}>
              View patient directory →
            </p>
          </div>
        </div>

        {/* Stock & Expiry Alert KPI */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow clinic-shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7C7067] uppercase tracking-wider">Stock & Expiry Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF5EE] text-[#D97736] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <h3 className="text-2xl font-bold font-mono text-[#D97736]">
                {lowStockItemsCount + expiringBatchesCount}
              </h3>
              <p className="text-xs text-[#7C7067] mt-1 font-medium">
                {lowStockItemsCount} low stock • {expiringBatchesCount} expiring
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Split & Doctor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Split by Invoice Type */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2B2420]">Revenue Split by Category</h3>
              <p className="text-xs text-[#7C7067]">Breakdown of OPD, Procedure, and Pharmacy revenue</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-[#C98A7D] hover:text-[#B5776A] flex items-center gap-1"
            >
              Full Reports <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* OPD */}
            <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#E8E2DC]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#7C7067] mb-2">
                <span>OPD Consultation</span>
                <span className="text-[#2B2420]">
                  {Math.round((opdRevenue / totalAllRevenue) * 100)}%
                </span>
              </div>
              <p className="text-xl font-bold font-mono text-[#2B2420]">{formatCurrency(opdRevenue)}</p>
              <div className="w-full bg-[#E8E2DC] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#C98A7D] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (opdRevenue / totalAllRevenue) * 100)}%` }}
                />
              </div>
            </div>

            {/* Procedure */}
            <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#E8E2DC]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#7C7067] mb-2">
                <span>Procedures & Lasers</span>
                <span className="text-[#2B2420]">
                  {Math.round((procRevenue / totalAllRevenue) * 100)}%
                </span>
              </div>
              <p className="text-xl font-bold font-mono text-[#2B2420]">{formatCurrency(procRevenue)}</p>
              <div className="w-full bg-[#E8E2DC] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (procRevenue / totalAllRevenue) * 100)}%` }}
                />
              </div>
            </div>

            {/* Medicine */}
            <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#E8E2DC]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#7C7067] mb-2">
                <span>Pharmacy Sales</span>
                <span className="text-[#2B2420]">
                  {Math.round((medRevenue / totalAllRevenue) * 100)}%
                </span>
              </div>
              <p className="text-xl font-bold font-mono text-[#2B2420]">{formatCurrency(medRevenue)}</p>
              <div className="w-full bg-[#E8E2DC] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#5B8A72] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (medRevenue / totalAllRevenue) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Wise Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#2B2420] border-b border-[#E8E2DC] pb-3">
            Doctor Revenue Contribution
          </h3>
          <div className="space-y-3">
            {doctors.map((doc) => {
              const rev = doctorRevenueMap[doc.name] || 0;
              const pct = Math.round((rev / totalAllRevenue) * 100) || 0;
              return (
                <div key={doc.id} className="p-3 bg-[#FAF7F5] rounded-xl border border-[#E8E2DC]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2B2420] truncate">{doc.name}</span>
                    <span className="font-mono font-bold text-[#C98A7D]">{formatCurrency(rev)}</span>
                  </div>
                  <div className="text-[11px] text-[#7C7067] mt-1">{doc.specialization}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Urgent Alerts Section */}
      {(lowStockList.length > 0 || expiringList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Items Alert Table */}
          {lowStockList.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-[#FDE3D3] clinic-shadow">
              <div className="flex items-center justify-between mb-3 border-b border-[#E8E2DC] pb-2">
                <h4 className="text-sm font-bold text-[#2B2420] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97736]" /> Low Stock Warning
                </h4>
                <button
                  onClick={() => onNavigateTab('pharmacy_inventory')}
                  className="text-xs font-semibold text-[#D97736] hover:underline"
                >
                  Manage Stock →
                </button>
              </div>
              <div className="space-y-2">
                {lowStockList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#FFF5EE] border border-[#FDE3D3] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#2B2420]">{item.name}</p>
                      <p className="text-[#7C7067] text-[11px]">
                        Category: {item.category} • Reorder Threshold: {item.reorderLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#D97736] text-white font-mono font-bold">
                        {item.totalStock} in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Batches Alert Table */}
          {expiringList.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-[#FAD8D8] clinic-shadow">
              <div className="flex items-center justify-between mb-3 border-b border-[#E8E2DC] pb-2">
                <h4 className="text-sm font-bold text-[#2B2420] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D9534F]" /> Expiring Batches (&lt;60 Days)
                </h4>
                <button
                  onClick={() => onNavigateTab('pharmacy_stock')}
                  className="text-xs font-semibold text-[#D9534F] hover:underline"
                >
                  View Batches →
                </button>
              </div>
              <div className="space-y-2">
                {expiringList.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3 bg-[#FDF2F2] border border-[#FAD8D8] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#2B2420]">{batch.medicineName}</p>
                      <p className="text-[#7C7067] text-[11px]">
                        Batch No: <span className="font-mono font-bold text-[#2B2420]">{batch.batchNo}</span> • Expiry: {formatDate(batch.expiryDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D9534F] text-white font-mono font-bold">
                        {batch.daysLeft} days left ({batch.quantityInStock} units)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Invoices Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow">
        <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2B2420]">Recent Invoices</h3>
            <p className="text-xs text-[#7C7067]">Latest generated OPD, procedure, and pharmacy bills</p>
          </div>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs font-semibold text-[#C98A7D] hover:text-[#B5776A] flex items-center gap-1"
          >
            All Invoices →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold tracking-wider">
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Patient Name</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {invoices.slice(0, 6).map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAF7F5] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#2B2420]">{inv.invoiceNo}</td>
                  <td className="py-3 px-3">
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
                  <td className="py-3 px-3 font-semibold text-[#2B2420]">
                    {inv.patientName}
                    <div className="text-[10px] text-[#7C7067] font-mono">{inv.patientPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-[#7C7067]">{formatDate(inv.date, true)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-right text-[#2B2420]">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#2B2420]">{inv.paymentMode}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6F2] text-[#5B8A72]">
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="p-1.5 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#2B2420] hover:bg-[#C98A7D] hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
