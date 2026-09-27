import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  IndianRupee,
  Clock,
  Boxes,
  Stethoscope,
  Filter,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '../../lib/utils';

export const ReportsView: React.FC = () => {
  const { invoices, medicines, batches, doctors } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'stock' | 'expiring' | 'doctors'>('sales');

  const activeInvoices = invoices.filter((i) => i.status === 'ACTIVE');

  // Sales Register Summary
  const totalSales = activeInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalSubtotal = activeInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDiscount = activeInvoices.reduce((sum, i) => sum + i.discountTotal, 0);
  const totalTax = activeInvoices.reduce((sum, i) => sum + i.taxTotal, 0);

  // Stock Valuation Summary
  const totalPurchaseValue = batches.reduce((sum, b) => sum + b.purchasePrice * b.quantityInStock, 0);
  const totalRetailValue = batches.reduce((sum, b) => sum + b.sellingPrice * b.quantityInStock, 0);
  const projectedMargin = totalRetailValue - totalPurchaseValue;

  // Expiring Batches (<60 days)
  const expiringBatches = batches
    .filter((b) => getDaysUntilExpiry(b.expiryDate) <= 60 && b.quantityInStock > 0)
    .map((b) => {
      const med = medicines.find((m) => m.id === b.medicineId);
      return {
        ...b,
        medicineName: med ? med.name : 'Unknown',
        daysLeft: getDaysUntilExpiry(b.expiryDate),
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#C98A7D]" /> Clinic Reports & Analytics
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Financial sales register, inventory valuation, doctor performance, and expiring stock reports.
          </p>
        </div>

        {/* SubTab Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8E2DC]">
          <button
            onClick={() => setActiveSubTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'sales'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067] hover:bg-[#E8E2DC]'
            }`}
          >
            1. Sales Register & Tax
          </button>
          <button
            onClick={() => setActiveSubTab('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'stock'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067] hover:bg-[#E8E2DC]'
            }`}
          >
            2. Inventory Stock Valuation
          </button>
          <button
            onClick={() => setActiveSubTab('expiring')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'expiring'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067] hover:bg-[#E8E2DC]'
            }`}
          >
            3. Expiring Medicines ({expiringBatches.length})
          </button>
          <button
            onClick={() => setActiveSubTab('doctors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'doctors'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067] hover:bg-[#E8E2DC]'
            }`}
          >
            4. Doctor Performance
          </button>
        </div>
      </div>

      {/* 1. SALES REGISTER REPORT */}
      {activeSubTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow">
              <span className="text-xs font-bold text-[#7C7067] uppercase">Total Billed Gross</span>
              <p className="text-2xl font-bold font-mono text-[#2B2420] mt-1">{formatCurrency(totalSubtotal)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow">
              <span className="text-xs font-bold text-[#7C7067] uppercase">Total Discounts</span>
              <p className="text-2xl font-bold font-mono text-[#D9534F] mt-1">{formatCurrency(totalDiscount)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow">
              <span className="text-xs font-bold text-[#7C7067] uppercase">GST Collected</span>
              <p className="text-2xl font-bold font-mono text-[#2B2420] mt-1">{formatCurrency(totalTax)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow">
              <span className="text-xs font-bold text-[#7C7067] uppercase">Net Collection</span>
              <p className="text-2xl font-bold font-mono text-[#5B8A72] mt-1">{formatCurrency(totalSales)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
            <div className="p-4 bg-[#FAF7F5] border-b border-[#E8E2DC] font-serif font-bold text-sm text-[#2B2420]">
              Sales Register Log
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2DC]">
                {activeInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 px-4 font-mono font-bold text-[#C98A7D]">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-[#7C7067]">{formatDate(inv.date)}</td>
                    <td className="py-3 px-4 font-bold">{inv.invoiceType}</td>
                    <td className="py-3 px-4 text-[#2B2420]">{inv.patientName}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#D9534F]">{formatCurrency(inv.discountTotal)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(inv.taxTotal)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{formatCurrency(inv.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. INVENTORY STOCK VALUATION */}
      {activeSubTab === 'stock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow">
              <span className="text-xs font-bold text-[#7C7067] uppercase">Stock Purchase Cost</span>
              <p className="text-2xl font-bold font-mono text-[#2B2420] mt-1">{formatCurrency(totalPurchaseValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow">
              <span className="text-xs font-bold text-[#7C7067] uppercase">Retail Selling Value</span>
              <p className="text-2xl font-bold font-mono text-[#C98A7D] mt-1">{formatCurrency(totalRetailValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow">
              <span className="text-xs font-bold text-[#7C7067] uppercase">Projected Pharmacy Margin</span>
              <p className="text-2xl font-bold font-mono text-[#5B8A72] mt-1">{formatCurrency(projectedMargin)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXPIRING MEDICINES */}
      {activeSubTab === 'expiring' && (
        <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
          <div className="p-4 bg-[#FAF7F5] border-b border-[#E8E2DC] font-serif font-bold text-sm text-[#2B2420]">
            Expiring Batches Audit (&lt;60 Days)
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                <th className="py-3 px-4">Batch No</th>
                <th className="py-3 px-4">Medicine</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Days Left</th>
                <th className="py-3 px-4 text-center">Stock Left</th>
                <th className="py-3 px-4 text-right">Stock Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {expiringBatches.map((b) => (
                <tr key={b.id} className="hover:bg-[#FDF2F2]">
                  <td className="py-3 px-4 font-mono font-bold text-[#C98A7D]">{b.batchNo}</td>
                  <td className="py-3 px-4 font-bold text-[#2B2420]">{b.medicineName}</td>
                  <td className="py-3 px-4 font-mono text-[#D9534F]">{formatDate(b.expiryDate)}</td>
                  <td className="py-3 px-4 text-center font-bold text-[#D9534F]">{b.daysLeft} days</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{b.quantityInStock} units</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {formatCurrency(b.sellingPrice * b.quantityInStock)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. DOCTOR PERFORMANCE */}
      {activeSubTab === 'doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doc) => {
            const docInvoices = activeInvoices.filter((i) => i.doctorName === doc.name);
            const docRevenue = docInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

            return (
              <div key={doc.id} className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2B2420]">{doc.name}</h3>
                    <p className="text-xs text-[#7C7067]">{doc.specialization}</p>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#C98A7D]">
                    {formatCurrency(docRevenue)}
                  </span>
                </div>
                <div className="text-xs text-[#7C7067]">
                  Total Invoices Billed: <strong className="text-[#2B2420]">{docInvoices.length}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
