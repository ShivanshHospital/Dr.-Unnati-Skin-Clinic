import React, { useState } from 'react';
import {
  Stethoscope,
  Sparkles,
  Pill,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  UserPlus,
  CheckCircle,
  IndianRupee,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Invoice, InvoiceType, MedicineBatch, PaymentMode, PaymentStatus } from '../../types';

interface NewInvoiceFlowProps {
  initialType?: InvoiceType;
  initialPatientId?: string;
  onInvoiceCreated: (createdInvoice: Invoice) => void;
  onCancel: () => void;
}

export const NewInvoiceFlow: React.FC<NewInvoiceFlowProps> = ({
  initialType = 'OPD',
  initialPatientId,
  onInvoiceCreated,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const {
    patients,
    doctors,
    procedures,
    medicines,
    batches,
    createInvoice,
    addPatient,
    settings,
  } = useData();

  // Active Billing Tab
  const [activeTab, setActiveTab] = useState<InvoiceType>(initialType);

  // Common Header State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [notes, setNotes] = useState('');

  // Quick Inline Patient Registration state
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    fullName: '',
    phone: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    age: 28,
  });

  // OPD Invoice State
  const [opdVisitType, setOpdVisitType] = useState<'New' | 'Follow-up'>('New');
  const [opdFee, setOpdFee] = useState<number>(doctors[0]?.defaultFee || 800);
  const [opdExtraItems, setOpdExtraItems] = useState<{ description: string; price: number }[]>([]);
  const [opdDiscount, setOpdDiscount] = useState<number>(0);

  // Procedure Invoice State
  const [procItems, setProcItems] = useState<
    { procedureId: string; name: string; qty: number; unitPrice: number; discount: number; sessionNote: string }[]
  >([]);
  const [procTaxRate, setProcTaxRate] = useState<number>(settings.defaultProcTax || 18);
  const [procGlobalDiscount, setProcGlobalDiscount] = useState<number>(0);

  // Medicine Invoice State
  const [medItems, setMedItems] = useState<
    {
      medicineId: string;
      medicineName: string;
      batchId: string;
      batchNo: string;
      expiryDate: string;
      qty: number;
      availableStock: number;
      unitPrice: number; // Selling price
      mrp: number;
      hsnCode: string;
      gstRate: number;
      discount: number;
    }[]
  >([]);
  const [medGlobalDiscount, setMedGlobalDiscount] = useState<number>(0);

  // Search Helpers
  const filteredPatients = patientSearch.trim()
    ? patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.phone.includes(patientSearch) ||
          p.id.toLowerCase().includes(patientSearch.toLowerCase())
      )
    : [];

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Handle Quick Patient Inline Register
  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.fullName || !newPatientData.phone) return;
    const created = addPatient({
      fullName: newPatientData.fullName,
      phone: newPatientData.phone,
      gender: newPatientData.gender,
      age: newPatientData.age,
    });
    setSelectedPatientId(created.id);
    setShowQuickRegister(false);
  };

  // Doctor Selector Change -> Auto-fill default fee
  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = doctors.find((d) => d.id === docId);
    if (doc) {
      setOpdFee(doc.defaultFee);
    }
  };

  // Add Procedure line item
  const handleAddProcedureItem = (procId: string) => {
    const proc = procedures.find((p) => p.id === procId);
    if (!proc) return;
    setProcItems((prev) => [
      ...prev,
      {
        procedureId: proc.id,
        name: proc.name,
        qty: 1,
        unitPrice: proc.basePrice,
        discount: 0,
        sessionNote: 'Session 1 of 1',
      },
    ]);
  };

  // Add Medicine line item with FEFO (First-Expiry-First-Out) Auto Batch Selection
  const handleAddMedicineItem = (medId: string) => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    // FEFO: Get all active batches with stock > 0, sorted by nearest expiry date
    const medBatches = batches
      .filter((b) => b.medicineId === med.id && b.quantityInStock > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    if (medBatches.length === 0) {
      alert(`Out of stock! No active batches available with stock for "${med.name}".`);
      return;
    }

    const fefoBatch = medBatches[0]; // Nearest expiring batch!

    // Check if already in table
    const existingIndex = medItems.findIndex((item) => item.batchId === fefoBatch.id);
    if (existingIndex >= 0) {
      // Increase qty if stock permits
      const currentItem = medItems[existingIndex];
      if (currentItem.qty + 1 > fefoBatch.quantityInStock) {
        alert(`Cannot add more. Available batch stock is ${fefoBatch.quantityInStock} units.`);
        return;
      }
      setMedItems((prev) =>
        prev.map((item, idx) => (idx === existingIndex ? { ...item, qty: item.qty + 1 } : item))
      );
    } else {
      setMedItems((prev) => [
        ...prev,
        {
          medicineId: med.id,
          medicineName: med.name,
          batchId: fefoBatch.id,
          batchNo: fefoBatch.batchNo,
          expiryDate: fefoBatch.expiryDate,
          qty: 1,
          availableStock: fefoBatch.quantityInStock,
          unitPrice: fefoBatch.sellingPrice,
          mrp: fefoBatch.mrp,
          hsnCode: med.hsnCode,
          gstRate: med.gstRate,
          discount: 0,
        },
      ]);
    }
  };

  // Batch Selection Override for Medicine line item
  const handleBatchChange = (itemIdx: number, newBatchId: string) => {
    const targetBatch = batches.find((b) => b.id === newBatchId);
    if (!targetBatch) return;

    setMedItems((prev) =>
      prev.map((item, idx) => {
        if (idx === itemIdx) {
          return {
            ...item,
            batchId: targetBatch.id,
            batchNo: targetBatch.batchNo,
            expiryDate: targetBatch.expiryDate,
            availableStock: targetBatch.quantityInStock,
            unitPrice: targetBatch.sellingPrice,
            mrp: targetBatch.mrp,
            qty: Math.min(item.qty, targetBatch.quantityInStock),
          };
        }
        return item;
      })
    );
  };

  // ----------------------------------------------------
  // COMPUTATIONS & MATHEMATICS PER INVOICE TYPE
  // ----------------------------------------------------

  // 1. OPD Computations
  const opdExtraSubtotal = opdExtraItems.reduce((sum, i) => sum + i.price, 0);
  const opdSubtotal = opdFee + opdExtraSubtotal;
  const opdGrandTotal = Math.max(0, opdSubtotal - opdDiscount);

  // 2. Procedure Computations
  const procLineSubtotal = procItems.reduce(
    (sum, i) => sum + Math.max(0, i.unitPrice * i.qty - i.discount),
    0
  );
  const procSubtotal = Math.max(0, procLineSubtotal - procGlobalDiscount);
  const procTaxTotal = Math.round((procSubtotal * (procTaxRate / 100)) * 100) / 100;
  const procGrandTotal = procSubtotal + procTaxTotal;

  // 3. Medicine Computations
  const medLineSubtotal = medItems.reduce(
    (sum, i) => sum + Math.max(0, i.unitPrice * i.qty - i.discount),
    0
  );
  const medSubtotal = Math.max(0, medLineSubtotal - medGlobalDiscount);

  // Compute GST per item rate
  const medTaxTotal = medItems.reduce((sum, item) => {
    const lineVal = Math.max(0, item.unitPrice * item.qty - item.discount);
    const lineGst = (lineVal * item.gstRate) / 100;
    return sum + lineGst;
  }, 0);
  const medGrandTotal = medSubtotal + medTaxTotal;

  // Final Save Handler
  const handleFinalSubmit = () => {
    if (activeTab !== 'MEDICINE' && !selectedPatientId) {
      alert('Please select or register a patient for OPD / Procedure invoices.');
      return;
    }

    let itemsForInvoice: any[] = [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    if (activeTab === 'OPD') {
      subtotal = opdSubtotal;
      discountTotal = opdDiscount;
      taxTotal = 0;
      grandTotal = opdGrandTotal;

      itemsForInvoice = [
        {
          description: `OPD Consultation (${opdVisitType}) — ${selectedDoctor?.name}`,
          quantity: 1,
          unitPrice: opdFee,
          discount: opdDiscount,
          taxRate: 0,
          lineTotal: Math.max(0, opdFee - opdDiscount),
          sourceType: 'consultation',
        },
        ...opdExtraItems.map((e) => ({
          description: e.description,
          quantity: 1,
          unitPrice: e.price,
          discount: 0,
          taxRate: 0,
          lineTotal: e.price,
          sourceType: 'consultation',
        })),
      ];
    } else if (activeTab === 'PROCEDURE') {
      if (procItems.length === 0) {
        alert('Please add at least one procedure to the invoice.');
        return;
      }
      subtotal = procLineSubtotal;
      discountTotal = procGlobalDiscount;
      taxTotal = procTaxTotal;
      grandTotal = procGrandTotal;

      itemsForInvoice = procItems.map((p) => ({
        description: p.name,
        quantity: p.qty,
        unitPrice: p.unitPrice,
        discount: p.discount,
        taxRate: procTaxRate,
        lineTotal: (p.unitPrice * p.qty - p.discount) * (1 + procTaxRate / 100),
        sourceType: 'procedure',
        sessionNote: p.sessionNote,
      }));
    } else if (activeTab === 'MEDICINE') {
      if (medItems.length === 0) {
        alert('Please select at least one medicine item from inventory.');
        return;
      }

      // Validate stock availability
      for (const item of medItems) {
        if (item.qty > item.availableStock) {
          alert(
            `Stock conflict! Batch ${item.batchNo} of "${item.medicineName}" only has ${item.availableStock} units available.`
          );
          return;
        }
      }

      subtotal = medLineSubtotal;
      discountTotal = medGlobalDiscount;
      taxTotal = medTaxTotal;
      grandTotal = medGrandTotal;

      itemsForInvoice = medItems.map((m) => ({
        description: `${m.medicineName} [Batch: ${m.batchNo}]`,
        quantity: m.qty,
        unitPrice: m.unitPrice,
        discount: m.discount,
        taxRate: m.gstRate,
        lineTotal: (m.unitPrice * m.qty - m.discount) * (1 + m.gstRate / 100),
        sourceType: 'medicine',
        medicineId: m.medicineId,
        medicineBatchId: m.batchId,
        hsnCode: m.hsnCode,
      }));
    }

    const created = createInvoice({
      invoiceType: activeTab,
      patientId: selectedPatient?.id,
      patientName: selectedPatient ? selectedPatient.fullName : 'Walk-in OTC Pharmacy Customer',
      patientPhone: selectedPatient ? selectedPatient.phone : 'N/A',
      patientUHID: selectedPatient?.id,
      patientAgeGender: selectedPatient ? `${selectedPatient.age} Yrs / ${selectedPatient.gender}` : undefined,
      doctorId: selectedDoctor?.id,
      doctorName: selectedDoctor?.name,
      items: itemsForInvoice,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentMode,
      paymentStatus,
      notes,
    });

    onInvoiceCreated(created);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E2DC] pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#2B2420]">Generate New Invoice</h2>
            <p className="text-xs text-[#7C7067] mt-0.5">
              Select invoice category (OPD, Procedure, or Pharmacy) to launch dedicated billing engine.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="text-xs font-semibold text-[#7C7067] hover:text-[#2B2420] px-3 py-1.5 rounded-lg border border-[#E8E2DC]"
          >
            Cancel & Exit
          </button>
        </div>

        {/* 3 Tab Selector Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('OPD')}
            className={`p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'OPD'
                ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                : 'bg-[#FAF7F5] border-[#E8E2DC] text-[#7C7067] hover:bg-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>1. OPD Consultation</span>
          </button>

          <button
            onClick={() => setActiveTab('PROCEDURE')}
            className={`p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'PROCEDURE'
                ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs'
                : 'bg-[#FAF7F5] border-[#E8E2DC] text-[#7C7067] hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. Procedure / Laser</span>
          </button>

          <button
            onClick={() => setActiveTab('MEDICINE')}
            className={`p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'MEDICINE'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                : 'bg-[#FAF7F5] border-[#E8E2DC] text-[#7C7067] hover:bg-white'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>3. Pharmacy Billing</span>
          </button>
        </div>
      </div>

      {/* Patient & Doctor Selection Box */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#2B2420]">
              Patient Selection {activeTab !== 'MEDICINE' && <span className="text-[#D9534F]">*</span>}
            </label>
            <button
              onClick={() => setShowQuickRegister(true)}
              className="text-[11px] font-bold text-[#C98A7D] hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Quick Register
            </button>
          </div>

          {selectedPatient ? (
            <div className="p-3 bg-[#FAF7F5] border border-[#C98A7D]/50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#2B2420] flex items-center gap-2">
                  {selectedPatient.fullName}
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E8E2DC]">
                    {selectedPatient.id}
                  </span>
                </div>
                <div className="text-[11px] text-[#7C7067] font-mono mt-0.5">
                  Phone: {selectedPatient.phone} • {selectedPatient.gender}, {selectedPatient.age} yrs
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientId('')}
                className="text-xs font-bold text-[#D9534F] hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C7067]" />
              <input
                type="text"
                placeholder={
                  activeTab === 'MEDICINE'
                    ? 'Search patient or leave empty for OTC Walk-in...'
                    : 'Search patient by Name, Phone or UHID...'
                }
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
              />

              {patientSearch.trim() !== '' && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-[#E8E2DC] max-h-48 overflow-y-auto z-50 p-2">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearch('');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-[#FAF7F5] flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-[#2B2420]">{p.fullName}</span>
                        <span className="font-mono text-[#7C7067]">{p.phone}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-[#7C7067]">
                      No matching patient found. Click "Quick Register" above.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#2B2420]">Consulting / Attending Doctor</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.specialization} (Default Fee: ₹{d.defaultFee})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DYNAMIC BILLING CONTENT BASED ON ACTIVE TAB */}

      {/* 1. OPD CONSULTATION BILLING FORM */}
      {activeTab === 'OPD' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-6">
          <h3 className="font-serif text-base font-bold text-[#2B2420] border-b border-[#E8E2DC] pb-2 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" /> OPD Consultation Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Visit Type */}
            <div>
              <label className="block text-xs font-bold text-[#2B2420] mb-1">Visit Type</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setOpdVisitType('New')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    opdVisitType === 'New'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-[#FAF7F5] border-[#E8E2DC] text-[#7C7067]'
                  }`}
                >
                  New Visit
                </button>
                <button
                  type="button"
                  onClick={() => setOpdVisitType('Follow-up')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    opdVisitType === 'Follow-up'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-[#FAF7F5] border-[#E8E2DC] text-[#7C7067]'
                  }`}
                >
                  Follow-up Visit
                </button>
              </div>
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="block text-xs font-bold text-[#2B2420] mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={opdFee}
                onChange={(e) => setOpdFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-bold text-[#2B2420] mb-1">Fee Discount (₹)</label>
              <input
                type="number"
                value={opdDiscount}
                onChange={(e) => setOpdDiscount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 text-[#2B2420]"
              />
            </div>
          </div>

          {/* Additional Charges / Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2B2420]">Additional Consultation Line Items (Optional)</label>
              <button
                type="button"
                onClick={() =>
                  setOpdExtraItems((prev) => [...prev, { description: 'Minor Dressing / Procedure', price: 200 }])
                }
                className="text-xs font-semibold text-[#C98A7D] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Charge
              </button>
            </div>

            {opdExtraItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Item description..."
                  value={item.description}
                  onChange={(e) => {
                    const newArr = [...opdExtraItems];
                    newArr[idx].description = e.target.value;
                    setOpdExtraItems(newArr);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
                <input
                  type="number"
                  placeholder="Price ₹"
                  value={item.price}
                  onChange={(e) => {
                    const newArr = [...opdExtraItems];
                    newArr[idx].price = Number(e.target.value);
                    setOpdExtraItems(newArr);
                  }}
                  className="w-28 px-3 py-1.5 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
                <button
                  type="button"
                  onClick={() => setOpdExtraItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1.5 text-[#D9534F] hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PROCEDURE / LASER BILLING FORM */}
      {activeTab === 'PROCEDURE' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-2">
            <h3 className="font-serif text-base font-bold text-[#2B2420] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" /> Procedure Catalog Selection
            </h3>

            {/* Procedure Dropdown Add */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddProcedureItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-3 py-1.5 text-xs font-bold bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
            >
              <option value="">+ Add Procedure from Catalog...</option>
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — ₹{p.basePrice}
                </option>
              ))}
            </select>
          </div>

          {/* Procedure Line Items Table */}
          {procItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                    <th className="py-2.5 px-3">Procedure Name</th>
                    <th className="py-2.5 px-3">Session Note</th>
                    <th className="py-2.5 px-3 text-center">Qty / Sessions</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 text-right">Discount (₹)</th>
                    <th className="py-2.5 px-3 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2DC]">
                  {procItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 font-bold text-[#2B2420]">{item.name}</td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.sessionNote}
                          onChange={(e) => {
                            const newArr = [...procItems];
                            newArr[idx].sessionNote = e.target.value;
                            setProcItems(newArr);
                          }}
                          className="px-2 py-1 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-lg text-[#2B2420]"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => {
                            const newArr = [...procItems];
                            newArr[idx].qty = Math.max(1, Number(e.target.value));
                            setProcItems(newArr);
                          }}
                          className="w-16 px-2 py-1 text-xs font-mono text-center bg-[#FAF7F5] border border-[#E8E2DC] rounded-lg text-[#2B2420]"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newArr = [...procItems];
                            newArr[idx].unitPrice = Number(e.target.value);
                            setProcItems(newArr);
                          }}
                          className="w-24 px-2 py-1 text-xs font-mono text-right bg-[#FAF7F5] border border-[#E8E2DC] rounded-lg text-[#2B2420]"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => {
                            const newArr = [...procItems];
                            newArr[idx].discount = Number(e.target.value);
                            setProcItems(newArr);
                          }}
                          className="w-20 px-2 py-1 text-xs font-mono text-right bg-[#FAF7F5] border border-[#E8E2DC] rounded-lg text-[#2B2420]"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-right text-[#2B2420]">
                        {formatCurrency(Math.max(0, item.unitPrice * item.qty - item.discount))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setProcItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-[#D9534F] hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#7C7067] border-2 border-dashed border-[#E8E2DC] rounded-xl">
              No procedures added yet. Select a procedure from the dropdown above.
            </div>
          )}

          {/* Procedure Global Tax & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#2B2420] mb-1">GST Rate (%)</label>
              <input
                type="number"
                value={procTaxRate}
                onChange={(e) => setProcTaxRate(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B2420] mb-1">Additional Package Discount (₹)</label>
              <input
                type="number"
                value={procGlobalDiscount}
                onChange={(e) => setProcGlobalDiscount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. MEDICINE PHARMACY BILLING FORM */}
      {activeTab === 'MEDICINE' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-2">
            <div>
              <h3 className="font-serif text-base font-bold text-[#2B2420] flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" /> Pharmacy Inventory Billing
              </h3>
              <p className="text-xs text-[#7C7067] mt-0.5">
                FEFO algorithm automatically pre-selects the nearest expiring batch for stock safety.
              </p>
            </div>

            {/* Medicine Inventory Selector */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddMedicineItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-3.5 py-2 text-xs font-bold bg-[#EFF6F2] border border-[#5B8A72]/40 text-[#5B8A72] rounded-xl"
            >
              <option value="">+ Search & Select Medicine from Stock...</option>
              {medicines.map((m) => {
                const medBatches = batches.filter((b) => b.medicineId === m.id && b.quantityInStock > 0);
                const totalStock = medBatches.reduce((sum, b) => sum + b.quantityInStock, 0);
                return (
                  <option key={m.id} value={m.id} disabled={totalStock === 0}>
                    {m.name} ({m.category}) — {totalStock > 0 ? `${totalStock} in stock` : 'OUT OF STOCK'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Medicine Line Items Table */}
          {medItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                    <th className="py-2.5 px-3">Medicine Name</th>
                    <th className="py-2.5 px-3">Batch & FEFO Selection</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3 text-center">Billing Qty</th>
                    <th className="py-2.5 px-3 text-right">Selling Price (₹)</th>
                    <th className="py-2.5 px-3 text-right">GST %</th>
                    <th className="py-2.5 px-3 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2DC]">
                  {medItems.map((item, idx) => {
                    const availableBatches = batches.filter(
                      (b) => b.medicineId === item.medicineId && b.quantityInStock > 0
                    );

                    return (
                      <tr key={idx}>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#2B2420]">{item.medicineName}</div>
                          <div className="text-[10px] text-[#7C7067] font-mono">
                            HSN: {item.hsnCode} • MRP: ₹{item.mrp}
                          </div>
                        </td>

                        {/* Batch Selector */}
                        <td className="py-3 px-3">
                          <select
                            value={item.batchId}
                            onChange={(e) => handleBatchChange(idx, e.target.value)}
                            className="px-2 py-1 text-xs font-mono font-bold bg-[#FAF7F5] border border-[#E8E2DC] rounded-lg text-[#2B2420]"
                          >
                            {availableBatches.map((b) => (
                              <option key={b.id} value={b.id}>
                                Batch {b.batchNo} ({b.quantityInStock} left)
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Expiry */}
                        <td className="py-3 px-3 font-mono text-[#7C7067]">
                          {formatDate(item.expiryDate)}
                        </td>

                        {/* Qty */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            max={item.availableStock}
                            value={item.qty}
                            onChange={(e) => {
                              const newArr = [...medItems];
                              const newQty = Math.max(1, Number(e.target.value));
                              if (newQty > item.availableStock) {
                                alert(`Cannot exceed available batch stock of ${item.availableStock} units.`);
                                return;
                              }
                              newArr[idx].qty = newQty;
                              setMedItems(newArr);
                            }}
                            className="w-16 px-2 py-1 text-xs font-mono text-center bg-[#FAF7F5] border border-[#E8E2DC] rounded-lg text-[#2B2420]"
                          />
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newArr = [...medItems];
                              newArr[idx].unitPrice = Number(e.target.value);
                              setMedItems(newArr);
                            }}
                            className="w-24 px-2 py-1 text-xs font-mono text-right bg-[#FAF7F5] border border-[#E8E2DC] rounded-lg text-[#2B2420]"
                          />
                        </td>

                        {/* GST % */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#7C7067]">
                          {item.gstRate}%
                        </td>

                        {/* Line Total */}
                        <td className="py-3 px-3 font-mono font-bold text-right text-[#2B2420]">
                          {formatCurrency(
                            (item.unitPrice * item.qty - item.discount) * (1 + item.gstRate / 100)
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setMedItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-[#D9534F] hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#7C7067] border-2 border-dashed border-[#E8E2DC] rounded-xl">
              No medicines selected yet. Search & select medicines from the dropdown above.
            </div>
          )}

          {/* Global Pharmacy Discount */}
          <div className="pt-2 max-w-xs">
            <label className="block text-xs font-bold text-[#2B2420] mb-1">Additional Prescription Discount (₹)</label>
            <input
              type="number"
              value={medGlobalDiscount}
              onChange={(e) => setMedGlobalDiscount(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
            />
          </div>
        </div>
      )}

      {/* SUMMARY & PAYMENT FOOTER BAR */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Payment Method & Status */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm font-bold text-[#2B2420] border-b border-[#E8E2DC] pb-2">
            Payment Mode & Status
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2B2420] mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
              >
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card (POS Credit/Debit)</option>
                <option value="Insurance">Insurance / TPA</option>
                <option value="Pending">Pending / Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2420] mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2B2420] mb-1">Invoice Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Follow-up after 10 days / Session 2 package..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
            />
          </div>
        </div>

        {/* Right: Math Summary & Final Save */}
        <div className="bg-[#FAF7F5] p-5 rounded-xl border border-[#E8E2DC] space-y-3 flex flex-col justify-between">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#7C7067]">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-[#2B2420]">
                {formatCurrency(
                  activeTab === 'OPD' ? opdSubtotal : activeTab === 'PROCEDURE' ? procSubtotal : medSubtotal
                )}
              </span>
            </div>

            <div className="flex justify-between text-[#7C7067]">
              <span>Discount Total:</span>
              <span className="font-mono font-bold text-[#D9534F]">
                - {formatCurrency(
                  activeTab === 'OPD' ? opdDiscount : activeTab === 'PROCEDURE' ? procGlobalDiscount : medGlobalDiscount
                )}
              </span>
            </div>

            <div className="flex justify-between text-[#7C7067]">
              <span>GST Tax Total:</span>
              <span className="font-mono font-bold text-[#2B2420]">
                + {formatCurrency(activeTab === 'OPD' ? 0 : activeTab === 'PROCEDURE' ? procTaxTotal : medTaxTotal)}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E8E2DC] flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#2B2420]">Grand Total Amount:</span>
              <span className="text-xl font-bold font-mono text-[#C98A7D]">
                {formatCurrency(
                  activeTab === 'OPD' ? opdGrandTotal : activeTab === 'PROCEDURE' ? procGrandTotal : medGrandTotal
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinalSubmit}
            className="w-full py-3.5 bg-[#C98A7D] hover:bg-[#B5776A] text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Generate & Save {activeTab} Invoice</span>
          </button>
        </div>
      </div>

      {/* Quick Patient Inline Register Modal */}
      {showQuickRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E8E2DC] space-y-4 shadow-2xl">
            <h3 className="font-serif text-base font-bold text-[#2B2420]">Quick Inline Patient Register</h3>
            <form onSubmit={handleQuickRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Patel"
                  value={newPatientData.fullName}
                  onChange={(e) => setNewPatientData({ ...newPatientData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2420] mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={newPatientData.phone}
                  onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Gender</label>
                  <select
                    value={newPatientData.gender}
                    onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatientData.age}
                    onChange={(e) => setNewPatientData({ ...newPatientData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl text-[#2B2420]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQuickRegister(false)}
                  className="px-3 py-1.5 text-xs text-[#7C7067]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#C98A7D] text-white rounded-xl shadow-xs"
                >
                  Register & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
