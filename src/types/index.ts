export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'pharmacist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  phone?: string;
}

export interface Patient {
  id: string; // UHID e.g. UNT-000101
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  dob?: string;
  phone: string;
  email?: string;
  address?: string;
  referredBy?: string;
  allergiesNotes?: string;
  registeredAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  registrationNo: string;
  defaultFee: number;
  phone: string;
  email: string;
}

export interface Procedure {
  id: string;
  name: string;
  category: string; // e.g., Laser, Chemical Peel, Botox/Fillers, Micro-needling, Minor Surgery
  basePrice: number;
  description: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string; // e.g. Topical Creams, Oral Antibiotics, Serums & Sunscreen, Cleansers
  manufacturer: string;
  unit: string; // Strip, Tube, Bottle, Vial, Pack
  hsnCode: string;
  gstRate: number; // e.g., 5, 12, 18
  reorderLevel: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  gstin: string;
  address: string;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNo: string;
  expiryDate: string; // YYYY-MM-DD
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  quantityInStock: number;
  supplierId: string;
  supplierName: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';

export interface StockTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNo: string;
  type: TransactionType;
  quantity: number;
  referenceInvoiceId?: string;
  date: string;
  userId: string;
  userName: string;
  remarks: string;
}

export type InvoiceType = 'OPD' | 'PROCEDURE' | 'MEDICINE';
export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Insurance' | 'Pending';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';
export type InvoiceStatus = 'ACTIVE' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Amount or percentage value applied
  discountType?: 'flat' | 'percent';
  taxRate: number; // GST %
  lineTotal: number;
  sourceType: 'consultation' | 'procedure' | 'medicine';
  medicineId?: string;
  medicineBatchId?: string;
  hsnCode?: string;
  sessionNote?: string; // e.g. "Session 2 of 6"
}

export interface Invoice {
  id: string;
  invoiceNo: string; // e.g., OPD-2526-0001, PRC-2526-0002, MED-2526-0003
  invoiceType: InvoiceType;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientUHID?: string;
  patientAgeGender?: string;
  doctorId?: string;
  doctorName?: string;
  date: string; // ISO String
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  status: InvoiceStatus;
  createdBy: string;
  creatorName: string;
  cancelReason?: string;
  notes?: string;
  pdfUrl?: string;
  pdfPath?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  beforeState?: string;
  afterState?: string;
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  registrationNo: string;
  opdPrefix: string;
  prcPrefix: string;
  medPrefix: string;
  defaultOpdTax: number;
  defaultProcTax: number;
  financialYear: string;
  termsAndConditions: string;
}
