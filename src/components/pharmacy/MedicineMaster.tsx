import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  PackageCheck,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Medicine } from '../../types';

export const MedicineMaster: React.FC = () => {
  const { medicines, batches, addMedicine, updateMedicine } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Topical Creams & Ointments',
    manufacturer: 'Sun Pharma',
    unit: 'Tube',
    hsnCode: '300490',
    gstRate: 12,
    reorderLevel: 15,
  });

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hsnCode.includes(searchQuery)
  );

  const handleOpenCreate = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      genericName: '',
      category: 'Topical Creams & Ointments',
      manufacturer: 'Sun Pharma',
      unit: 'Tube',
      hsnCode: '300490',
      gstRate: 12,
      reorderLevel: 15,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      genericName: med.genericName,
      category: med.category,
      manufacturer: med.manufacturer,
      unit: med.unit,
      hsnCode: med.hsnCode,
      gstRate: med.gstRate,
      reorderLevel: med.reorderLevel,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingMedicine) {
      updateMedicine(editingMedicine.id, formData);
    } else {
      addMedicine(formData);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#C98A7D]" /> Pharmacy Master Catalog
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Maintain medicine master list, HSN codes, GST tax rates, and reorder levels.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2DC] clinic-shadow flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C7067]" />
          <input
            type="text"
            placeholder="Search medicine name, generic composition, category, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
          />
        </div>
        <div className="text-xs text-[#7C7067] font-semibold">
          Total: <span className="text-[#2B2420]">{filteredMedicines.length}</span> item(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                <th className="py-3.5 px-4">Medicine & Generic Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Unit / Packaging</th>
                <th className="py-3.5 px-4">HSN Code</th>
                <th className="py-3.5 px-4 text-right">GST %</th>
                <th className="py-3.5 px-4 text-center">Total Stock</th>
                <th className="py-3.5 px-4 text-center">Reorder Level</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {filteredMedicines.map((med) => {
                const medBatches = batches.filter((b) => b.medicineId === med.id);
                const totalStock = medBatches.reduce((sum, b) => sum + b.quantityInStock, 0);
                const isLowStock = totalStock <= med.reorderLevel;

                return (
                  <tr key={med.id} className="hover:bg-[#FAF7F5] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#2B2420]">{med.name}</div>
                      <div className="text-[10px] text-[#7C7067]">{med.genericName} • {med.manufacturer}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">{med.category}</td>
                    <td className="py-3.5 px-4 font-mono text-[#2B2420]">{med.unit}</td>
                    <td className="py-3.5 px-4 font-mono text-[#7C7067]">{med.hsnCode}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#2B2420]">
                      {med.gstRate}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <span
                        className={`px-2.5 py-0.5 rounded-full ${
                          isLowStock
                            ? 'bg-[#FFF5EE] text-[#D97736] border border-[#FDE3D3]'
                            : 'bg-[#EFF6F2] text-[#5B8A72]'
                        }`}
                      >
                        {totalStock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[#7C7067]">
                      {med.reorderLevel}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#7C7067] hover:bg-[#2B2420] hover:text-white transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E8E2DC] space-y-4 shadow-2xl">
            <h3 className="font-serif text-base font-bold text-[#2B2420]">
              {editingMedicine ? 'Edit Medicine Master' : 'Add New Medicine to Master'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Brand Trade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tretinoin 0.05% Cream (20g)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Generic Salt Composition</label>
                <input
                  type="text"
                  placeholder="e.g. Tretinoin USP"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  >
                    <option value="Topical Creams & Ointments">Topical Creams & Ointments</option>
                    <option value="Oral Antibiotics">Oral Antibiotics</option>
                    <option value="Oral Antifungals">Oral Antifungals</option>
                    <option value="Sunscreen & Serums">Sunscreen & Serums</option>
                    <option value="Cleansers & Washes">Cleansers & Washes</option>
                    <option value="Hair Care">Hair Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Packaging Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Tube / Bottle / Strip"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#E8E2DC]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-[#7C7067]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#C98A7D] text-white rounded-xl shadow-xs"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
