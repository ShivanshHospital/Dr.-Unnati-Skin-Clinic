import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  IndianRupee,
  Building,
  CheckCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '../../lib/utils';
import { MedicineBatch } from '../../types';

export const StockManagement: React.FC = () => {
  const { medicines, suppliers, batches, addBatch, adjustStockManual } = useData();
  const { hasPermission } = useAuth();

  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<MedicineBatch | null>(null);

  // Stock In Form State
  const [stockInData, setStockInData] = useState({
    medicineId: medicines[0]?.id || '',
    batchNo: '',
    expiryDate: '',
    mrp: 300,
    purchasePrice: 180,
    sellingPrice: 270,
    quantityInStock: 50,
    supplierId: suppliers[0]?.id || '',
  });

  // Adjust Form State
  const [adjustData, setAdjustData] = useState({
    quantity: 5,
    type: 'OUT' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN',
    remarks: 'Damage / Write-off',
  });

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInData.batchNo || !stockInData.expiryDate) {
      alert('Batch number and expiry date are required.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === stockInData.supplierId);
    addBatch({
      ...stockInData,
      supplierName: supplier ? supplier.name : 'Unknown Supplier',
    });

    setShowStockInModal(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForAdjust) return;

    adjustStockManual(
      selectedBatchForAdjust.id,
      adjustData.quantity,
      adjustData.type,
      adjustData.remarks
    );

    setShowAdjustModal(false);
    setSelectedBatchForAdjust(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#C98A7D]" /> Stock In & Active Batch Inventory
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Record supplier stock purchases, track batch expiries, and adjust damaged/returned stock.
          </p>
        </div>

        <button
          onClick={() => setShowStockInModal(true)}
          className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Stock In</span>
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
        <div className="p-4 border-b border-[#E8E2DC] bg-[#FAF7F5] flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold text-[#2B2420]">Active Batches Table</h3>
          <span className="text-xs text-[#7C7067]">
            Showing <strong className="text-[#2B2420]">{batches.length}</strong> active batch(es)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                <th className="py-3.5 px-4">Batch No</th>
                <th className="py-3.5 px-4">Medicine Name</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-right">MRP (₹)</th>
                {hasPermission('view_cost_prices') && (
                  <th className="py-3.5 px-4 text-right">Purchase (₹)</th>
                )}
                <th className="py-3.5 px-4 text-right">Selling Price (₹)</th>
                <th className="py-3.5 px-4 text-center">Stock Quantity</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {batches.length > 0 ? (
                batches.map((batch) => {
                const med = medicines.find((m) => m.id === batch.medicineId);
                const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                const isExpiringSoon = daysLeft <= 60;

                return (
                  <tr key={batch.id} className="hover:bg-[#FAF7F5] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C98A7D]">
                      {batch.batchNo}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#2B2420]">
                      {med ? med.name : 'Unknown'}
                      <div className="text-[10px] text-[#7C7067] font-normal">
                        {med?.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[#2B2420]">{formatDate(batch.expiryDate)}</div>
                      {isExpiringSoon && (
                        <div className="text-[10px] font-bold text-[#D9534F] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft} days left!</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#7C7067]">
                      {formatCurrency(batch.mrp)}
                    </td>
                    {hasPermission('view_cost_prices') && (
                      <td className="py-3.5 px-4 text-right font-mono text-[#7C7067]">
                        {formatCurrency(batch.purchasePrice)}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#2B2420]">
                      {formatCurrency(batch.sellingPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          batch.quantityInStock <= 10
                            ? 'bg-[#FFF5EE] text-[#D97736] border border-[#FDE3D3]'
                            : 'bg-[#EFF6F2] text-[#5B8A72]'
                        }`}
                      >
                        {batch.quantityInStock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">{batch.supplierName}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedBatchForAdjust(batch);
                          setShowAdjustModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#2B2420] hover:bg-[#2B2420] hover:text-white transition-all font-semibold text-[11px]"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={hasPermission('view_cost_prices') ? 8 : 7} className="py-8 text-center text-[#7C7067]">
                  No inventory batches recorded yet. Click 'New Purchase Stock In' to add your first medicine batch.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Stock In Purchase Entry Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E8E2DC] space-y-4 shadow-2xl">
            <h3 className="font-serif text-base font-bold text-[#2B2420]">
              Record Purchase Stock In (New Batch)
            </h3>

            <form onSubmit={handleStockInSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Select Medicine *</label>
                <select
                  value={stockInData.medicineId}
                  onChange={(e) => setStockInData({ ...stockInData, medicineId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-SUN2027"
                    value={stockInData.batchNo}
                    onChange={(e) => setStockInData({ ...stockInData, batchNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={stockInData.expiryDate}
                    onChange={(e) => setStockInData({ ...stockInData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={stockInData.mrp}
                    onChange={(e) => setStockInData({ ...stockInData, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={stockInData.purchasePrice}
                    onChange={(e) =>
                      setStockInData({ ...stockInData, purchasePrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={stockInData.sellingPrice}
                    onChange={(e) =>
                      setStockInData({ ...stockInData, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Stock In Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={stockInData.quantityInStock}
                    onChange={(e) =>
                      setStockInData({ ...stockInData, quantityInStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Supplier</label>
                  <select
                    value={stockInData.supplierId}
                    onChange={(e) => setStockInData({ ...stockInData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#E8E2DC]">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-3 py-1.5 text-xs text-[#7C7067]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#C98A7D] text-white rounded-xl shadow-xs"
                >
                  Save Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {showAdjustModal && selectedBatchForAdjust && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E8E2DC] space-y-4 shadow-2xl">
            <h3 className="font-serif text-base font-bold text-[#2B2420]">
              Manual Stock Adjustment — Batch {selectedBatchForAdjust.batchNo}
            </h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Adjustment Type</label>
                <select
                  value={adjustData.type}
                  onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                >
                  <option value="OUT">Stock OUT (Damage / Expired / Write-off)</option>
                  <option value="IN">Stock IN (Supplier Return / Found Stock)</option>
                  <option value="ADJUSTMENT">General Inventory Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Mandatory Reason / Remarks</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Expired batch write-off / Sample issue..."
                  value={adjustData.remarks}
                  onChange={(e) => setAdjustData({ ...adjustData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#E8E2DC]">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 text-xs text-[#7C7067]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#C98A7D] text-white rounded-xl shadow-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
