import React, { useState } from 'react';
import {
  Settings,
  Building,
  FileText,
  Stethoscope,
  Sparkles,
  Save,
  Plus,
  Edit2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Doctor, Procedure } from '../../types';

export const ClinicSettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    doctors,
    addDoctor,
    updateDoctor,
    procedures,
    addProcedure,
    updateProcedure,
  } = useData();

  const [activeTab, setActiveTab] = useState<'general' | 'doctors' | 'procedures'>('general');

  // General Settings Form State
  const [generalForm, setGeneralForm] = useState(settings);

  // Doctor Form Modal State
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    specialization: 'Cosmetologist',
    registrationNo: 'GMC-12345',
    defaultFee: 800,
    phone: '',
    email: '',
  });

  // Procedure Form Modal State
  const [showProcModal, setShowProcModal] = useState(false);
  const [editingProc, setEditingProc] = useState<Procedure | null>(null);
  const [procFormData, setProcFormData] = useState({
    name: '',
    category: 'Laser Therapy',
    basePrice: 3000,
    description: '',
  });

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(generalForm);
    alert('Clinic settings updated successfully.');
  };

  // Doctor Submit
  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorFormData.name) return;

    if (editingDoctor) {
      updateDoctor(editingDoctor.id, doctorFormData);
    } else {
      addDoctor(doctorFormData);
    }
    setShowDoctorModal(false);
  };

  // Procedure Submit
  const handleProcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procFormData.name) return;

    if (editingProc) {
      updateProcedure(editingProc.id, procFormData);
    } else {
      addProcedure(procFormData);
    }
    setShowProcModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#C98A7D]" /> Clinic Configuration & Catalogs
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Configure clinic branding, invoice prefixes, tax defaults, doctors list, and procedure catalog.
          </p>
        </div>

        {/* SubTabs */}
        <div className="flex space-x-3 border-t border-[#E8E2DC] pt-3">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067]'
            }`}
          >
            Clinic Details & Tax Prefixes
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'doctors'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067]'
            }`}
          >
            Doctors Catalog ({doctors.length})
          </button>
          <button
            onClick={() => setActiveTab('procedures')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'procedures'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067]'
            }`}
          >
            Procedure Catalog ({procedures.length})
          </button>
        </div>
      </div>

      {/* 1. GENERAL CLINIC & TAX SETTINGS */}
      {activeTab === 'general' && (
        <form onSubmit={handleGeneralSubmit} className="space-y-6">
          {/* GST Guidance Note Alert (§9) */}
          <div className="p-4 bg-[#FFF5EE] border border-[#FDE3D3] rounded-2xl text-xs flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#D97736] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-[#2B2420]">GST Tax Rate Compliance Note:</h4>
              <p className="text-[#7C7067] leading-relaxed">
                Default tax rates ship pre-configured (0% on OPD consultation, 18% on aesthetic procedures, variable GST on medicines). Please confirm applicable GST and HSN rates with your CA / Accountant before go-live.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
            <h3 className="font-serif text-base font-bold text-[#2B2420] border-b border-[#E8E2DC] pb-2">
              Clinic Identification & Contact Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={generalForm.clinicName}
                  onChange={(e) => setGeneralForm({ ...generalForm, clinicName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div className="md:col-span-2 flex items-center space-x-4 p-3 bg-[#FAF7F5] rounded-xl border border-[#E8E2DC]">
                <img
                  src={generalForm.logoUrl || '/logo.png'}
                  alt="Clinic Logo Preview"
                  className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-[#E8E2DC] shadow-xs"
                />
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Clinic Logo Path / URL</label>
                  <input
                    type="text"
                    value={generalForm.logoUrl || '/logo.png'}
                    onChange={(e) => setGeneralForm({ ...generalForm, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-1.5 text-xs bg-white border border-[#E8E2DC] rounded-xl text-[#2B2420] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Tagline</label>
                <input
                  type="text"
                  value={generalForm.tagline}
                  onChange={(e) => setGeneralForm({ ...generalForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Full Clinic Address</label>
                <input
                  type="text"
                  value={generalForm.address}
                  onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Phone Numbers</label>
                <input
                  type="text"
                  value={generalForm.phone}
                  onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={generalForm.gstin}
                  onChange={(e) => setGeneralForm({ ...generalForm, gstin: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
            <h3 className="font-serif text-base font-bold text-[#2B2420] border-b border-[#E8E2DC] pb-2">
              Invoice Prefix & Tax Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">OPD Invoice Prefix</label>
                <input
                  type="text"
                  value={generalForm.opdPrefix}
                  onChange={(e) => setGeneralForm({ ...generalForm, opdPrefix: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Procedure Prefix</label>
                <input
                  type="text"
                  value={generalForm.prcPrefix}
                  onChange={(e) => setGeneralForm({ ...generalForm, prcPrefix: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Pharmacy Prefix</label>
                <input
                  type="text"
                  value={generalForm.medPrefix}
                  onChange={(e) => setGeneralForm({ ...generalForm, medPrefix: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Financial Year Prefix</label>
                <input
                  type="text"
                  value={generalForm.financialYear}
                  onChange={(e) => setGeneralForm({ ...generalForm, financialYear: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Clinic Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. DOCTOR CATALOG */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingDoctor(null);
                setDoctorFormData({
                  name: '',
                  specialization: 'Cosmetologist',
                  registrationNo: 'GMC-12345',
                  defaultFee: 800,
                  phone: '',
                  email: '',
                });
                setShowDoctorModal(true);
              }}
              className="flex items-center space-x-2 bg-[#C98A7D] text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Doctor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="bg-white p-5 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#2B2420]">{doc.name}</h4>
                    <p className="text-xs text-[#7C7067]">{doc.specialization}</p>
                    <p className="text-[11px] text-[#7C7067] font-mono mt-1">Reg No: {doc.registrationNo}</p>
                  </div>
                  <span className="font-mono font-bold text-sm text-[#C98A7D]">
                    Default Fee: ₹{doc.defaultFee}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PROCEDURE CATALOG */}
      {activeTab === 'procedures' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingProc(null);
                setProcFormData({
                  name: '',
                  category: 'Laser Therapy',
                  basePrice: 3000,
                  description: '',
                });
                setShowProcModal(true);
              }}
              className="flex items-center space-x-2 bg-[#C98A7D] text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Procedure</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                  <th className="py-3.5 px-4">Procedure Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Base Price (₹)</th>
                  <th className="py-3.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2DC]">
                {procedures.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 px-4 font-bold text-[#2B2420]">{p.name}</td>
                    <td className="py-3.5 px-4 text-[#7C7067]">{p.category}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#C98A7D]">
                      ₹{p.basePrice}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067] italic">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
