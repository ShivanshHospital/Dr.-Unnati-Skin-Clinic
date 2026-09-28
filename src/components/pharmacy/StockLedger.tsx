import React from 'react';
import { FileText, ArrowDownRight, ArrowUpRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../lib/utils';

export const StockLedger: React.FC = () => {
  const { stockTransactions } = useData();

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow">
        <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#C98A7D]" /> Stock Audit Ledger
        </h2>
        <p className="text-xs text-[#7C7067] mt-1">
          Complete chronological audit history of all medicine stock transactions (IN, OUT, ADJUSTMENT, RETURN).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Transaction Type</th>
                <th className="py-3.5 px-4">Medicine Name</th>
                <th className="py-3.5 px-4">Batch No</th>
                <th className="py-3.5 px-4 text-center">Quantity</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Remarks / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {stockTransactions.length > 0 ? (
                stockTransactions.map((stx) => (
                  <tr key={stx.id} className="hover:bg-[#FAF7F5] transition-colors">
                    <td className="py-3.5 px-4 text-[#7C7067] font-mono">
                      {formatDate(stx.date, true)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 uppercase ${
                          stx.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stx.type === 'OUT'
                            ? 'bg-blue-100 text-blue-800'
                            : stx.type === 'RETURN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {stx.type === 'IN' && <ArrowUpRight className="w-3 h-3" />}
                        {stx.type === 'OUT' && <ArrowDownRight className="w-3 h-3" />}
                        {stx.type === 'RETURN' && <RotateCcw className="w-3 h-3" />}
                        {stx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#2B2420]">{stx.medicineName}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C98A7D]">
                      {stx.batchNo}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#2B2420]">
                      {stx.type === 'OUT' ? `-${stx.quantity}` : `+${stx.quantity}`}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">{stx.userName}</td>
                    <td className="py-3.5 px-4 text-[#7C7067] italic">{stx.remarks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7C7067]">
                    No stock audit transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
