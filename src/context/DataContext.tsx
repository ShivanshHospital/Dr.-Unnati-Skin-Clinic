import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Patient,
  Doctor,
  Procedure,
  Medicine,
  Supplier,
  MedicineBatch,
  Invoice,
  StockTransaction,
  AuditLog,
  ClinicSettings,
  InvoiceType,
  PaymentMode,
  PaymentStatus,
  InvoiceItem,
} from '../types';
import {
  initialPatients,
  initialDoctors,
  initialProcedures,
  initialMedicines,
  initialSuppliers,
  initialBatches,
  initialInvoices,
  initialStockTransactions,
  initialAuditLogs,
  initialClinicSettings,
} from '../lib/seedData';
import { generateInvoiceNo, generateUHID, getDaysUntilExpiry } from '../lib/utils';
import { useAuth } from './AuthContext';
import {
  savePatientToSupabase,
  savePatientsBulkToSupabase,
  fetchPatientsFromSupabase,
  saveInvoiceToSupabase,
  checkSupabaseConnection,
} from '../lib/supabase';
import { getInvoicePDFBlob } from '../lib/invoicePdf';

interface DataContextType {
  patients: Patient[];
  doctors: Doctor[];
  procedures: Procedure[];
  medicines: Medicine[];
  suppliers: Supplier[];
  batches: MedicineBatch[];
  invoices: Invoice[];
  stockTransactions: StockTransaction[];
  auditLogs: AuditLog[];
  settings: ClinicSettings;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'registeredAt'>) => Patient;
  updatePatient: (id: string, updated: Partial<Patient>) => void;
  
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  updateDoctor: (id: string, updated: Partial<Doctor>) => void;
  
  addProcedure: (proc: Omit<Procedure, 'id'>) => void;
  updateProcedure: (id: string, updated: Partial<Procedure>) => void;
  
  addMedicine: (med: Omit<Medicine, 'id'>) => void;
  updateMedicine: (id: string, updated: Partial<Medicine>) => void;
  
  addSupplier: (sup: Omit<Supplier, 'id'>) => void;
  
  addBatch: (batch: Omit<MedicineBatch, 'id'>) => void;
  adjustStockManual: (batchId: string, adjustmentQty: number, type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN', remarks: string) => void;
  
  createInvoice: (invoiceData: {
    invoiceType: InvoiceType;
    patientId?: string;
    patientName: string;
    patientPhone: string;
    patientUHID?: string;
    patientAgeGender?: string;
    doctorId?: string;
    doctorName?: string;
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentMode: PaymentMode;
    paymentStatus: PaymentStatus;
    notes?: string;
  }) => Invoice;
  
  cancelInvoice: (invoiceId: string, reason: string) => boolean;
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;
  
  // Supabase Backend Sync
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncWithSupabase: () => Promise<{ success: boolean; message: string }>;
  uploadInvoicePdf: (invoice: Invoice) => Promise<string | null>;

  // Quick stats & notifications
  lowStockItemsCount: number;
  expiringBatchesCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Versioning for automatic cache migration across deployments (clears demo data)
  const CURRENT_DATA_VERSION = 'v5.0_clean_production';

  // Synchronous cache cleanup before component mounts
  if (typeof window !== 'undefined') {
    const savedVersion = localStorage.getItem('drunnati_app_version');
    if (savedVersion !== CURRENT_DATA_VERSION) {
      localStorage.setItem('drunnati_app_version', CURRENT_DATA_VERSION);
      localStorage.removeItem('drunnati_patients');
      localStorage.removeItem('drunnati_invoices');
      localStorage.removeItem('drunnati_batches');
      localStorage.removeItem('drunnati_stx');
      localStorage.removeItem('drunnati_audit');
      localStorage.removeItem('drunnati_medicines');
      localStorage.removeItem('drunnati_current_user');
    }
  }

  // Helper to load or fallback to seed
  const loadStored = <T,>(key: string, fallback: T): T => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        let cleaned = saved;
        if (/dermatol|derma/i.test(cleaned)) {
          cleaned = cleaned
            .replace(/Dermatology/gi, 'Cosmetology')
            .replace(/Dermatologist/gi, 'Cosmetologist')
            .replace(/Dermatological/gi, 'Cosmetological')
            .replace(/DermaCare/g, 'CosmoCare')
            .replace(/Cipla Derma/g, 'Cipla Cosmo');
          localStorage.setItem(key, cleaned);
        }
        return JSON.parse(cleaned);
      } catch (e) { /* fallback */ }
    }
    return fallback;
  };

  const [patients, setPatients] = useState<Patient[]>(() => loadStored('drunnati_patients', initialPatients));
  const [doctors, setDoctors] = useState<Doctor[]>(() => loadStored('drunnati_doctors', initialDoctors));
  const [procedures, setProcedures] = useState<Procedure[]>(() => loadStored('drunnati_procedures', initialProcedures));
  const [medicines, setMedicines] = useState<Medicine[]>(() => loadStored('drunnati_medicines', initialMedicines));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('drunnati_suppliers', initialSuppliers));
  const [batches, setBatches] = useState<MedicineBatch[]>(() => loadStored('drunnati_batches', initialBatches));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadStored('drunnati_invoices', initialInvoices));
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => loadStored('drunnati_stx', initialStockTransactions));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored('drunnati_audit', initialAuditLogs));
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    const loaded = loadStored('drunnati_settings', initialClinicSettings);
    if (!loaded.logoUrl) {
      loaded.logoUrl = '/logo.png';
    }
    return loaded;
  });

  // Supabase Backend Sync State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const savedVersion = localStorage.getItem('drunnati_app_version');
    if (savedVersion !== CURRENT_DATA_VERSION) {
      localStorage.setItem('drunnati_app_version', CURRENT_DATA_VERSION);
      // Clean out all previous demo data from browser's localStorage
      localStorage.removeItem('drunnati_patients');
      localStorage.removeItem('drunnati_invoices');
      localStorage.removeItem('drunnati_batches');
      localStorage.removeItem('drunnati_stx');
      localStorage.removeItem('drunnati_audit');
      localStorage.removeItem('drunnati_medicines');
      localStorage.removeItem('drunnati_current_user');
      setPatients([]);
      setInvoices([]);
      setBatches([]);
      setStockTransactions([]);
      setAuditLogs([]);
      setMedicines([]);
      setSettings((prev) => ({
        ...prev,
        logoUrl: '/logo.png',
        tagline: (prev.tagline || 'Advanced Cosmetology, Laser & Aesthetic Care').replace(/Dermatology/gi, 'Cosmetology'),
      }));
    }
  }, []);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('drunnati_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('drunnati_doctors', JSON.stringify(doctors)); }, [doctors]);
  useEffect(() => { localStorage.setItem('drunnati_procedures', JSON.stringify(procedures)); }, [procedures]);
  useEffect(() => { localStorage.setItem('drunnati_medicines', JSON.stringify(medicines)); }, [medicines]);
  useEffect(() => { localStorage.setItem('drunnati_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('drunnati_batches', JSON.stringify(batches)); }, [batches]);
  useEffect(() => { localStorage.setItem('drunnati_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('drunnati_stx', JSON.stringify(stockTransactions)); }, [stockTransactions]);
  useEffect(() => { localStorage.setItem('drunnati_audit', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('drunnati_settings', JSON.stringify(settings)); }, [settings]);

  // Audit Logger helper
  const logAuditAction = (action: string, entity: string, entityId: string, afterState?: string, beforeState?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      beforeState,
      afterState,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Patients Actions - Saved to state, localStorage and Supabase backend
  const addPatient = (patientData: Omit<Patient, 'id' | 'registeredAt'>): Patient => {
    const newId = generateUHID(patients.length);
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      registeredAt: new Date().toISOString(),
    };
    setPatients((prev) => [newPatient, ...prev]);
    logAuditAction('REGISTER_PATIENT', 'Patient', newId, `Registered patient ${newPatient.fullName} (${newId})`);

    // Asynchronously save patient registration data in Supabase backend
    savePatientToSupabase(newPatient).catch((err) => {
      console.warn('Notice: Background Supabase patient registration sync:', err);
    });

    return newPatient;
  };

  const updatePatient = (id: string, updated: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const merged = { ...p, ...updated };
          savePatientToSupabase(merged).catch((err) => {
            console.warn('Notice: Background Supabase patient update sync:', err);
          });
          return merged;
        }
        return p;
      })
    );
    logAuditAction('UPDATE_PATIENT', 'Patient', id, `Updated demographics for ${id}`);
  };

  // Doctor CRUD
  const addDoctor = (doctorData: Omit<Doctor, 'id'>) => {
    const newId = `doc-${Date.now()}`;
    const newDoctor: Doctor = { ...doctorData, id: newId };
    setDoctors((prev) => [...prev, newDoctor]);
    logAuditAction('ADD_DOCTOR', 'Doctor', newId, `Added doctor ${newDoctor.name}`);
  };

  const updateDoctor = (id: string, updated: Partial<Doctor>) => {
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
  };

  // Procedure CRUD
  const addProcedure = (procData: Omit<Procedure, 'id'>) => {
    const newId = `prc-${Date.now()}`;
    const newProc: Procedure = { ...procData, id: newId };
    setProcedures((prev) => [...prev, newProc]);
    logAuditAction('ADD_PROCEDURE', 'Procedure', newId, `Added procedure ${newProc.name}`);
  };

  const updateProcedure = (id: string, updated: Partial<Procedure>) => {
    setProcedures((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  // Medicine CRUD
  const addMedicine = (medData: Omit<Medicine, 'id'>) => {
    const newId = `med-${Date.now()}`;
    const newMed: Medicine = { ...medData, id: newId };
    setMedicines((prev) => [...prev, newMed]);
    logAuditAction('ADD_MEDICINE', 'Medicine', newId, `Added medicine ${newMed.name}`);
  };

  const updateMedicine = (id: string, updated: Partial<Medicine>) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  // Supplier CRUD
  const addSupplier = (supData: Omit<Supplier, 'id'>) => {
    const newId = `sup-${Date.now()}`;
    const newSup: Supplier = { ...supData, id: newId };
    setSuppliers((prev) => [...prev, newSup]);
  };

  // Batch & Stock In
  const addBatch = (batchData: Omit<MedicineBatch, 'id'>) => {
    const newBatchId = `btc-${Date.now()}`;
    const newBatch: MedicineBatch = { ...batchData, id: newBatchId };
    setBatches((prev) => [...prev, newBatch]);

    const med = medicines.find((m) => m.id === batchData.medicineId);
    const medName = med ? med.name : 'Medicine';

    // Log Stock IN Transaction
    const newStx: StockTransaction = {
      id: `stx-${Date.now()}`,
      medicineId: batchData.medicineId,
      medicineName: medName,
      batchId: newBatchId,
      batchNo: batchData.batchNo,
      type: 'IN',
      quantity: batchData.quantityInStock,
      date: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      remarks: `Purchase stock entry from ${batchData.supplierName}`,
    };
    setStockTransactions((prev) => [newStx, ...prev]);
    logAuditAction('ADD_BATCH_STOCK', 'MedicineBatch', newBatchId, `Added batch ${batchData.batchNo} with qty ${batchData.quantityInStock}`);
  };

  // Manual Stock Adjustment
  const adjustStockManual = (
    batchId: string,
    adjustmentQty: number,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN',
    remarks: string
  ) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const newQty = type === 'IN' ? b.quantityInStock + adjustmentQty : Math.max(0, b.quantityInStock - adjustmentQty);
          return { ...b, quantityInStock: newQty };
        }
        return b;
      })
    );

    const targetBatch = batches.find((b) => b.id === batchId);
    if (targetBatch) {
      const med = medicines.find((m) => m.id === targetBatch.medicineId);
      const stx: StockTransaction = {
        id: `stx-${Date.now()}`,
        medicineId: targetBatch.medicineId,
        medicineName: med ? med.name : 'Medicine',
        batchId: targetBatch.id,
        batchNo: targetBatch.batchNo,
        type,
        quantity: adjustmentQty,
        date: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        remarks: remarks || `Manual stock adjustment (${type})`,
      };
      setStockTransactions((prev) => [stx, ...prev]);
      logAuditAction('STOCK_ADJUSTMENT', 'MedicineBatch', batchId, `Adjusted stock by ${adjustmentQty} (${type}). Reason: ${remarks}`);
    }
  };

  // Create Invoice (Handles Stock Decrement for Medicine Invoices automatically!)
  const createInvoice = (invoiceData: {
    invoiceType: InvoiceType;
    patientId?: string;
    patientName: string;
    patientPhone: string;
    patientUHID?: string;
    patientAgeGender?: string;
    doctorId?: string;
    doctorName?: string;
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentMode: PaymentMode;
    paymentStatus: PaymentStatus;
    notes?: string;
  }): Invoice => {
    const typeCount = invoices.filter((i) => i.invoiceType === invoiceData.invoiceType).length;
    let customPrefix = settings.opdPrefix;
    if (invoiceData.invoiceType === 'PROCEDURE') customPrefix = settings.prcPrefix;
    if (invoiceData.invoiceType === 'MEDICINE') customPrefix = settings.medPrefix;

    const invoiceNo = generateInvoiceNo(invoiceData.invoiceType, typeCount, customPrefix, settings.financialYear);
    const invoiceId = `inv-${Date.now()}`;

    const formattedItems: InvoiceItem[] = invoiceData.items.map((item, idx) => ({
      ...item,
      id: `itm-${Date.now()}-${idx}`,
      invoiceId: invoiceId,
    }));

    const newInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      invoiceNo,
      date: new Date().toISOString(),
      items: formattedItems,
      status: 'ACTIVE',
      createdBy: currentUser.id,
      creatorName: currentUser.name,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Asynchronously generate PDF and upload to Supabase backend
    (async () => {
      try {
        const pdfBlob = getInvoicePDFBlob(newInvoice, settings);
        const res = await saveInvoiceToSupabase(newInvoice, pdfBlob);
        if (res.success && res.pdfUrl) {
          setInvoices((prev) =>
            prev.map((inv) => (inv.id === invoiceId ? { ...inv, pdfUrl: res.pdfUrl, pdfPath: res.pdfPath } : inv))
          );
        }
      } catch (err) {
        console.warn('Notice: Background Supabase invoice/PDF sync:', err);
      }
    })();

    // Handle Medicine Stock Decrement & Transaction Audit
    if (invoiceData.invoiceType === 'MEDICINE') {
      formattedItems.forEach((item) => {
        if (item.medicineBatchId) {
          // Decrement batch stock
          setBatches((prevBatches) =>
            prevBatches.map((b) => {
              if (b.id === item.medicineBatchId) {
                return { ...b, quantityInStock: Math.max(0, b.quantityInStock - item.quantity) };
              }
              return b;
            })
          );

          // Write StockTransaction (OUT)
          const med = medicines.find((m) => m.id === item.medicineId);
          const batch = batches.find((b) => b.id === item.medicineBatchId);

          const stx: StockTransaction = {
            id: `stx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            medicineId: item.medicineId || '',
            medicineName: med ? med.name : item.description,
            batchId: item.medicineBatchId,
            batchNo: batch ? batch.batchNo : 'Unknown',
            type: 'OUT',
            quantity: item.quantity,
            referenceInvoiceId: invoiceId,
            date: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            remarks: `Billed in Pharmacy Invoice ${invoiceNo}`,
          };
          setStockTransactions((prevStx) => [stx, ...prevStx]);
        }
      });
    }

    logAuditAction('CREATE_INVOICE', 'Invoice', invoiceId, `Generated ${newInvoice.invoiceNo} for ₹${newInvoice.grandTotal}`);
    return newInvoice;
  };

  // Cancel/Void Invoice
  const cancelInvoice = (invoiceId: string, reason: string): boolean => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return false;

    const updatedTarget: Invoice = { ...target, status: 'CANCELLED', cancelReason: reason };

    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? updatedTarget : i))
    );

    // Update cancelled status and regenerate voided PDF in Supabase
    (async () => {
      try {
        const pdfBlob = getInvoicePDFBlob(updatedTarget, settings);
        await saveInvoiceToSupabase(updatedTarget, pdfBlob);
      } catch (err) {
        console.warn('Notice: Background Supabase void invoice sync:', err);
      }
    })();

    // Reverse medicine stock if it was a Medicine invoice
    if (target.invoiceType === 'MEDICINE') {
      target.items.forEach((item) => {
        if (item.medicineBatchId) {
          setBatches((prev) =>
            prev.map((b) =>
              b.id === item.medicineBatchId
                ? { ...b, quantityInStock: b.quantityInStock + item.quantity }
                : b
            )
          );

          // Log STX Return
          const batch = batches.find((b) => b.id === item.medicineBatchId);
          const stx: StockTransaction = {
            id: `stx-rev-${Date.now()}`,
            medicineId: item.medicineId || '',
            medicineName: item.description,
            batchId: item.medicineBatchId,
            batchNo: batch ? batch.batchNo : 'Unknown',
            type: 'RETURN',
            quantity: item.quantity,
            referenceInvoiceId: invoiceId,
            date: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            remarks: `Stock restored due to Voided Invoice ${target.invoiceNo}: ${reason}`,
          };
          setStockTransactions((prev) => [stx, ...prev]);
        }
      });
    }

    logAuditAction('CANCEL_INVOICE', 'Invoice', invoiceId, `Voided ${target.invoiceNo}. Reason: ${reason}`);
    return true;
  };

  const updateSettings = (newSettings: Partial<ClinicSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAuditAction('UPDATE_SETTINGS', 'ClinicSettings', 'settings-main', 'Updated clinic settings');
  };

  // Helper to upload single invoice PDF to Supabase on demand
  const uploadInvoicePdf = async (invoice: Invoice): Promise<string | null> => {
    try {
      const pdfBlob = getInvoicePDFBlob(invoice, settings);
      const res = await saveInvoiceToSupabase(invoice, pdfBlob);
      if (res.success && res.pdfUrl) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === invoice.id ? { ...i, pdfUrl: res.pdfUrl, pdfPath: res.pdfPath } : i))
        );
        return res.pdfUrl;
      }
      return null;
    } catch (err) {
      console.error('Error generating and uploading invoice PDF to Supabase:', err);
      return null;
    }
  };

  // Sync all patients and invoice PDFs with Supabase backend
  const syncWithSupabase = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    try {
      const isConnected = await checkSupabaseConnection();
      setIsSupabaseConnected(isConnected);
      if (!isConnected) {
        setIsSyncing(false);
        return { success: false, message: 'Could not connect to Supabase backend.' };
      }

      // 1. Sync Patients: Send local patients to Supabase
      if (patients.length > 0) {
        await savePatientsBulkToSupabase(patients);
      }

      // Pull any existing Supabase patients and merge
      const remotePatients = await fetchPatientsFromSupabase();
      if (remotePatients && remotePatients.length > 0) {
        setPatients((prev) => {
          const map = new Map<string, Patient>();
          prev.forEach((p) => map.set(p.id, p));
          remotePatients.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }

      // 2. Sync Invoices: Save and upload PDF for each invoice to Supabase Storage
      let updatedInvoices = [...invoices];
      for (let i = 0; i < updatedInvoices.length; i++) {
        const inv = updatedInvoices[i];
        try {
          const pdfBlob = getInvoicePDFBlob(inv, settings);
          const res = await saveInvoiceToSupabase(inv, pdfBlob);
          if (res.success && res.pdfUrl) {
            updatedInvoices[i] = { ...inv, pdfUrl: res.pdfUrl, pdfPath: res.pdfPath };
          }
        } catch (e) {
          console.warn(`Failed to upload PDF for invoice ${inv.invoiceNo}:`, e);
        }
      }
      setInvoices(updatedInvoices);

      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(now);
      setIsSyncing(false);
      return {
        success: true,
        message: `All patient registrations & invoice PDFs successfully saved in Supabase backend at ${now}.`,
      };
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, message: err.message || 'Sync failed.' };
    }
  };

  // Initial auto-sync on application mount
  useEffect(() => {
    const timer = setTimeout(() => {
      syncWithSupabase().catch((err) => {
        console.warn('Initial Supabase auto-sync notice:', err);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Computations for Badges & Alerts
  const lowStockItemsCount = medicines.filter((m) => {
    const medBatches = batches.filter((b) => b.medicineId === m.id);
    const totalQty = medBatches.reduce((sum, b) => sum + b.quantityInStock, 0);
    return totalQty <= m.reorderLevel;
  }).length;

  const expiringBatchesCount = batches.filter((b) => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return days <= 60 && b.quantityInStock > 0;
  }).length;

  return (
    <DataContext.Provider
      value={{
        patients,
        doctors,
        procedures,
        medicines,
        suppliers,
        batches,
        invoices,
        stockTransactions,
        auditLogs,
        settings,
        addPatient,
        updatePatient,
        addDoctor,
        updateDoctor,
        addProcedure,
        updateProcedure,
        addMedicine,
        updateMedicine,
        addSupplier,
        addBatch,
        adjustStockManual,
        createInvoice,
        cancelInvoice,
        updateSettings,
        isSupabaseConnected,
        isSyncing,
        lastSyncTime,
        syncWithSupabase,
        uploadInvoicePdf,
        lowStockItemsCount,
        expiringBatchesCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
