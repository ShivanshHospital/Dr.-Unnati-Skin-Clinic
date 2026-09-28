import { createClient } from '@supabase/supabase-js';
import { Patient, Invoice } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ckyompzffljljkuawijb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreW9tcHpmZmxqbGprdWF3aWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NTk1NjAsImV4cCI6MjEwNjAzNTU2MH0._rIL_DabbO88B1tW4vQp93qnVwBFZwgZkUdQ_1qn8lI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const INVOICE_BUCKET = 'invoices';

/**
 * Check connectivity to Supabase
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('patients').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Save / Update a patient record in Supabase
 */
export async function savePatientToSupabase(patient: Patient): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      id: patient.id,
      full_name: patient.fullName,
      gender: patient.gender,
      age: patient.age,
      dob: patient.dob || null,
      phone: patient.phone,
      email: patient.email || null,
      address: patient.address || null,
      referred_by: patient.referredBy || null,
      allergies_notes: patient.allergiesNotes || null,
      registered_at: patient.registeredAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('patients').upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error saving patient to Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exception saving patient to Supabase:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Save multiple patients to Supabase in bulk
 */
export async function savePatientsBulkToSupabase(patients: Patient[]): Promise<{ count: number; error?: string }> {
  if (!patients || patients.length === 0) return { count: 0 };
  try {
    const rows = patients.map((patient) => ({
      id: patient.id,
      full_name: patient.fullName,
      gender: patient.gender,
      age: patient.age,
      dob: patient.dob || null,
      phone: patient.phone,
      email: patient.email || null,
      address: patient.address || null,
      referred_by: patient.referredBy || null,
      allergies_notes: patient.allergiesNotes || null,
      registered_at: patient.registeredAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('patients').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('Error bulk saving patients to Supabase:', error);
      return { count: 0, error: error.message };
    }
    return { count: rows.length };
  } catch (err: any) {
    console.error('Exception bulk saving patients:', err);
    return { count: 0, error: err.message };
  }
}

/**
 * Fetch all patients from Supabase
 */
export async function fetchPatientsFromSupabase(): Promise<Patient[] | null> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching patients from Supabase:', error);
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      gender: row.gender,
      age: Number(row.age) || 0,
      dob: row.dob || undefined,
      phone: row.phone,
      email: row.email || undefined,
      address: row.address || undefined,
      referredBy: row.referred_by || undefined,
      allergiesNotes: row.allergies_notes || undefined,
      registeredAt: row.registered_at,
    }));
  } catch (err) {
    console.error('Exception fetching patients:', err);
    return null;
  }
}

/**
 * Upload an invoice PDF Blob to Supabase Storage
 */
export async function uploadInvoicePdfToStorage(
  invoiceNo: string,
  pdfBlob: Blob
): Promise<{ publicUrl: string; path: string } | null> {
  try {
    const filename = `${invoiceNo.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    const filePath = `invoices/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(INVOICE_BUCKET)
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading invoice PDF to Supabase Storage:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from(INVOICE_BUCKET).getPublicUrl(filePath);
    return {
      publicUrl: data.publicUrl,
      path: filePath,
    };
  } catch (err) {
    console.error('Exception uploading invoice PDF:', err);
    return null;
  }
}

/**
 * Save an invoice to Supabase DB and optionally upload its PDF
 */
export async function saveInvoiceToSupabase(
  invoice: Invoice,
  pdfBlob?: Blob
): Promise<{ success: boolean; pdfUrl?: string; pdfPath?: string; error?: string }> {
  try {
    let pdfUrl = invoice.pdfUrl;
    let pdfPath = invoice.pdfPath;

    // Upload PDF to Supabase Storage if provided
    if (pdfBlob) {
      const uploadResult = await uploadInvoicePdfToStorage(invoice.invoiceNo, pdfBlob);
      if (uploadResult) {
        pdfUrl = uploadResult.publicUrl;
        pdfPath = uploadResult.path;
      }
    }

    const row = {
      id: invoice.id,
      invoice_no: invoice.invoiceNo,
      invoice_type: invoice.invoiceType,
      patient_id: invoice.patientId || null,
      patient_name: invoice.patientName,
      patient_phone: invoice.patientPhone || null,
      patient_uhid: invoice.patientUHID || null,
      patient_age_gender: invoice.patientAgeGender || null,
      doctor_id: invoice.doctorId || null,
      doctor_name: invoice.doctorName || null,
      date: invoice.date || new Date().toISOString(),
      items: invoice.items || [],
      subtotal: invoice.subtotal || 0,
      discount_total: invoice.discountTotal || 0,
      tax_total: invoice.taxTotal || 0,
      grand_total: invoice.grandTotal || 0,
      payment_mode: invoice.paymentMode,
      payment_status: invoice.paymentStatus,
      status: invoice.status,
      created_by: invoice.createdBy || null,
      creator_name: invoice.creatorName || null,
      cancel_reason: invoice.cancelReason || null,
      notes: invoice.notes || null,
      pdf_url: pdfUrl || null,
      pdf_path: pdfPath || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('invoices').upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error saving invoice to Supabase DB:', error);
      return { success: false, error: error.message };
    }

    return { success: true, pdfUrl, pdfPath };
  } catch (err: any) {
    console.error('Exception saving invoice to Supabase:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Fetch all invoices from Supabase
 */
export async function fetchInvoicesFromSupabase(): Promise<Invoice[] | null> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });

    if (error || !data) {
      console.error('Error fetching invoices from Supabase:', error);
      return null;
    }

    return data.map((row: any) => {
      let parsedItems = [];
      if (Array.isArray(row.items)) {
        parsedItems = row.items;
      } else if (typeof row.items === 'string') {
        try {
          parsedItems = JSON.parse(row.items);
        } catch {
          parsedItems = [];
        }
      }

      return {
        id: row.id,
        invoiceNo: row.invoice_no,
        invoiceType: row.invoice_type,
        patientId: row.patient_id || undefined,
        patientName: row.patient_name,
        patientPhone: row.patient_phone || '',
        patientUHID: row.patient_uhid || undefined,
        patientAgeGender: row.patient_age_gender || undefined,
        doctorId: row.doctor_id || undefined,
        doctorName: row.doctor_name || undefined,
        date: row.date,
        items: parsedItems,
        subtotal: Number(row.subtotal) || 0,
        discountTotal: Number(row.discount_total) || 0,
        taxTotal: Number(row.tax_total) || 0,
        grandTotal: Number(row.grand_total) || 0,
        paymentMode: row.payment_mode,
        paymentStatus: row.payment_status,
        status: row.status,
        createdBy: row.created_by || '',
        creatorName: row.creator_name || '',
        cancelReason: row.cancel_reason || undefined,
        notes: row.notes || undefined,
        pdfUrl: row.pdf_url || undefined,
        pdfPath: row.pdf_path || undefined,
      };
    });
  } catch (err) {
    console.error('Exception fetching invoices:', err);
    return null;
  }
}
