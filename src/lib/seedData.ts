import {
  ClinicSettings,
  User,
  Doctor,
  Procedure,
  Medicine,
  Supplier,
  MedicineBatch,
  Patient,
  Invoice,
  StockTransaction,
  AuditLog,
} from '../types';

export const initialClinicSettings: ClinicSettings = {
  clinicName: 'Dr. Unnati Skin Clinic',
  tagline: 'Advanced Cosmetology, Laser & Aesthetic Care',
  logoUrl: '/logo.png',
  address: '204-205, Sahara Complex, Near Mahadev Temple, Wadhwan Road, Surendranagar, Gujarat - 363002',
  phone: '+91 98795 12345 / +91 02752 245678',
  email: 'contact@drunnatiskinclinic.com',
  gstin: '24AAACD1234F1Z8',
  registrationNo: 'GMC-64821',
  opdPrefix: 'OPD',
  prcPrefix: 'PRC',
  medPrefix: 'MED',
  defaultOpdTax: 0,
  defaultProcTax: 18,
  financialYear: '2526',
  termsAndConditions: '1. Fees once paid are non-refundable.\n2. Please carry this invoice for follow-up visits.\n3. Prescribed medicines must be taken strictly as per doctor instruction.',
};

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Dr. Unnati Suthar',
    email: 'unnati@drunnatiskinclinic.com',
    role: 'admin',
    isActive: true,
    phone: '+91 98795 12345',
  },
  {
    id: 'usr-2',
    name: 'Dr. Saurabh Suthar',
    email: 'saurabh@drunnatiskinclinic.com',
    role: 'doctor',
    isActive: true,
    phone: '+91 98795 54321',
  },
  {
    id: 'usr-3',
    name: 'Priya Patel',
    email: 'reception@drunnatiskinclinic.com',
    role: 'receptionist',
    isActive: true,
    phone: '+91 94280 11223',
  },
  {
    id: 'usr-4',
    name: 'Rajesh Shah',
    email: 'pharmacy@drunnatiskinclinic.com',
    role: 'pharmacist',
    isActive: true,
    phone: '+91 98980 99887',
  },
];

export const initialDoctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Unnati Suthar',
    specialization: 'Cosmetologist & Aesthetic Specialist',
    registrationNo: 'GMC-64821',
    defaultFee: 800,
    phone: '+91 98795 12345',
    email: 'unnati@drunnatiskinclinic.com',
  },
  {
    id: 'doc-2',
    name: 'Dr. Saurabh Suthar',
    specialization: 'MS (Gen. Surgery) & Aesthetic Laser Specialist',
    registrationNo: 'GMC-71045',
    defaultFee: 700,
    phone: '+91 98795 54321',
    email: 'saurabh@drunnatiskinclinic.com',
  },
];

export const initialProcedures: Procedure[] = [
  {
    id: 'prc-1',
    name: 'Carbon Laser Hollywood Peel',
    category: 'Laser Therapy',
    basePrice: 3500,
    description: 'Q-switched Nd:YAG laser peel for instant skin glow, pore tightening, and deep exfoliation.',
  },
  {
    id: 'prc-2',
    name: 'Fractional CO2 Laser Resurfacing',
    category: 'Laser Therapy',
    basePrice: 6500,
    description: 'Advanced resurfacing for deep acne scars, skin texture refinement, and collagen building.',
  },
  {
    id: 'prc-3',
    name: 'Hydrafacial & Glow Infusion',
    category: 'Facial Cosmetology',
    basePrice: 2800,
    description: '3-step medical grade facial with vortex extraction and hyaluronic acid hydration.',
  },
  {
    id: 'prc-4',
    name: 'Salicylic & Glycolic Acne Peel',
    category: 'Chemical Peel',
    basePrice: 2200,
    description: 'Targeted chemical exfoliation for active acne, comedones, and post-acne hyperpigmentation.',
  },
  {
    id: 'prc-5',
    name: 'Microneedling RF (MNRF) Acne Scar Session',
    category: 'Micro-needling',
    basePrice: 5000,
    description: 'Radiofrequency microneedling for collagen remodeling and acne scar smoothing.',
  },
  {
    id: 'prc-6',
    name: 'PRP Therapy for Hair Loss (Scalp)',
    category: 'Trichology',
    basePrice: 4500,
    description: 'Platelet-Rich Plasma scalp micro-injections for hair follicle regeneration.',
  },
  {
    id: 'prc-7',
    name: 'Botox Line Smoothing (Per Unit)',
    category: 'Botox & Fillers',
    basePrice: 450,
    description: 'FDA-approved botulinum toxin injection for forehead lines and crow feet.',
  },
  {
    id: 'prc-8',
    name: 'RF Skin Tag & Mole Removal',
    category: 'Minor Surgery',
    basePrice: 1800,
    description: 'Radiofrequency electrosurgical excision of benign skin tags and DPNs.',
  },
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Sun Pharma Laboratories Ltd.',
    contactPerson: 'Karan Mehta',
    phone: '+91 98250 88990',
    gstin: '27AABCS1423E1ZE',
    address: 'Sun House, Goregaon East, Mumbai, Maharashtra - 400063',
  },
  {
    id: 'sup-2',
    name: 'Cipla Cosmetology Division',
    contactPerson: 'Amit Trivedi',
    phone: '+91 98790 33445',
    gstin: '24AAACC1209B1ZA',
    address: 'Ellisbridge, Ashram Road, Ahmedabad, Gujarat - 380006',
  },
  {
    id: 'sup-3',
    name: 'Glenmark Pharmaceuticals',
    contactPerson: 'Nikhil Shah',
    phone: '+91 99090 77665',
    gstin: '24AAACG3401F1Z1',
    address: 'Alkapuri, Vadodara, Gujarat - 390007',
  },
  {
    id: 'sup-4',
    name: 'CosmoCare Pharma Distributors',
    contactPerson: 'Sanjay Patel',
    phone: '+91 98240 12121',
    gstin: '24AABFD8832K1ZP',
    address: 'Main Market, Surendranagar, Gujarat - 363001',
  },
];

export const initialMedicines: Medicine[] = [];

export const initialBatches: MedicineBatch[] = [];
export const initialPatients: Patient[] = [];
export const initialInvoices: Invoice[] = [];
export const initialStockTransactions: StockTransaction[] = [];
export const initialAuditLogs: AuditLog[] = [];

