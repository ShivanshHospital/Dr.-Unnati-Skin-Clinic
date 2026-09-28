import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Eye,
  Edit2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Patient } from '../../types';
import { formatDate } from '../../lib/utils';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
  onOpenNewInvoiceForPatient?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  onSelectPatient,
  onOpenNewInvoiceForPatient,
}) => {
  const { patients, addPatient, updatePatient, isSyncing, syncWithSupabase } = useData();

  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form State for Registration/Edit
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    age: 25,
    dob: '',
    phone: '',
    email: '',
    address: '',
    referredBy: '',
    allergiesNotes: '',
  });

  // Soft warning state for duplicate phone
  const [duplicateWarning, setDuplicateWarning] = useState<Patient | null>(null);

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setFormData({
      fullName: '',
      gender: 'Female',
      age: 25,
      dob: '',
      phone: '',
      email: '',
      address: '',
      referredBy: '',
      allergiesNotes: '',
    });
    setDuplicateWarning(null);
    setShowRegisterModal(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      fullName: patient.fullName,
      gender: patient.gender,
      age: patient.age,
      dob: patient.dob || '',
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      referredBy: patient.referredBy || '',
      allergiesNotes: patient.allergiesNotes || '',
    });
    setDuplicateWarning(null);
    setShowRegisterModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('Patient full name and phone number are required.');
      return;
    }

    // Check duplicate phone if creating new
    if (!editingPatient) {
      const existing = patients.find((p) => p.phone.trim() === formData.phone.trim());
      if (existing && !duplicateWarning) {
        setDuplicateWarning(existing);
        return; // Pause and show soft warning banner!
      }
    }

    if (editingPatient) {
      updatePatient(editingPatient.id, formData);
    } else {
      const newP = addPatient(formData);
      onSelectPatient(newP.id);
    }

    setShowRegisterModal(false);
    setEditingPatient(null);
    setDuplicateWarning(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C98A7D]" /> Patient Directory & UHID Records
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Search patient records, view complete visit history, or register a new patient.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              setSyncNotice(null);
              const res = await syncWithSupabase();
              setSyncNotice(res.message);
              setTimeout(() => setSyncNotice(null), 5000);
            }}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Sync all patient data with Supabase backend"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync with Supabase'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Control */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2DC] clinic-shadow flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C7067]" />
          <input
            type="text"
            placeholder="Filter by Name, Mobile Number, or UHID (UNT-)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
          />
        </div>
        <div className="text-xs text-[#7C7067] font-semibold">
          Showing <span className="text-[#2B2420]">{filteredPatients.length}</span> patient(s)
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">UHID</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Referred By</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-[#FAF7F5] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C98A7D]">
                      {patient.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#2B2420]">
                      {patient.fullName}
                      {patient.allergiesNotes && (
                        <div className="text-[10px] font-normal text-[#D97736] truncate max-w-xs flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{patient.allergiesNotes}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">
                      {patient.age} Yrs / {patient.gender}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#2B2420]">
                      {patient.phone}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">
                      {patient.referredBy || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C7067]">
                      {formatDate(patient.registeredAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onSelectPatient(patient.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#2B2420] hover:bg-[#C98A7D] hover:text-white transition-all cursor-pointer font-semibold flex items-center gap-1 text-[11px]"
                          title="View Profile & Billing History"
                        >
                          <Eye className="w-3.5 h-3.5" /> Profile
                        </button>
                        <button
                          onClick={() => handleOpenEdit(patient)}
                          className="p-1.5 rounded-lg bg-[#FAF7F5] border border-[#E8E2DC] text-[#7C7067] hover:bg-[#2B2420] hover:text-white transition-all cursor-pointer"
                          title="Edit Demographics"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7C7067]">
                    No patient records found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register / Edit Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#E8E2DC] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-[#FAF7F5] border-b border-[#E8E2DC] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#2B2420] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C98A7D]" />
                {editingPatient ? `Edit Patient — ${editingPatient.id}` : 'Register New Patient'}
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-[#7C7067] hover:text-[#2B2420] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Soft Duplicate Phone Warning Banner */}
            {duplicateWarning && (
              <div className="p-4 bg-[#FFF5EE] border-b border-[#FDE3D3] flex items-start space-x-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-[#D97736] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#2B2420]">
                    Duplicate Phone Warning!
                  </h4>
                  <p className="text-[#7C7067] mt-0.5">
                    A patient named <span className="font-bold text-[#2B2420]">{duplicateWarning.fullName}</span> ({duplicateWarning.id}) is already registered with mobile number <span className="font-mono font-bold text-[#2B2420]">{formData.phone}</span>.
                  </p>
                  <div className="mt-2.5 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegisterModal(false);
                        onSelectPatient(duplicateWarning.id);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#C98A7D] text-white font-semibold text-[11px]"
                    >
                      Open Existing Profile ({duplicateWarning.id})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Bypass soft block and save
                        const newP = addPatient(formData);
                        setShowRegisterModal(false);
                        onSelectPatient(newP.id);
                      }}
                      className="text-[#7C7067] hover:underline font-semibold text-[11px]"
                    >
                      Register Anyway (Family Member)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">
                    Full Name <span className="text-[#D9534F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ananya Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">
                    Phone Number (10 digits) <span className="text-[#D9534F]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9825198251"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g., patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  />
                </div>

                {/* Referred By */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Referred By</label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. R. K. Joshi / Google / Instagram"
                    value={formData.referredBy}
                    onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g., Wadhwan Road, Surendranagar"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  />
                </div>

                {/* Medical History & Allergies */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">
                    Medical History / Allergies / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Allergic to Sulfa drugs, sensitive facial skin..."
                    value={formData.allergiesNotes}
                    onChange={(e) => setFormData({ ...formData, allergiesNotes: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E8E2DC] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#7C7067] hover:bg-[#FAF7F5] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#C98A7D] hover:bg-[#B5776A] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {editingPatient ? 'Save Changes' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
