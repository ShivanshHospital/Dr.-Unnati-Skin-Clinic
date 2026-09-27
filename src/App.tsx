import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { PatientList } from './components/patients/PatientList';
import { PatientProfileModal } from './components/patients/PatientProfileModal';
import { NewInvoiceFlow } from './components/invoices/NewInvoiceFlow';
import { InvoiceList } from './components/invoices/InvoiceList';
import { PrintableInvoice } from './components/invoices/PrintableInvoice';
import { MedicineMaster } from './components/pharmacy/MedicineMaster';
import { StockManagement } from './components/pharmacy/StockManagement';
import { StockLedger } from './components/pharmacy/StockLedger';
import { ReportsView } from './components/reports/ReportsView';
import { UsersAndRoles } from './components/users/UsersAndRoles';
import { ClinicSettingsView } from './components/settings/ClinicSettingsView';
import { Invoice, InvoiceType, Patient } from './types';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Overlay Modals
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Quick Billing Trigger State
  const [newInvoiceType, setNewInvoiceType] = useState<InvoiceType>('OPD');
  const [newInvoicePatientId, setNewInvoicePatientId] = useState<string | undefined>(undefined);

  const handleOpenNewInvoice = (type: InvoiceType = 'OPD', patientId?: string) => {
    setNewInvoiceType(type);
    setNewInvoicePatientId(patientId);
    setActiveTab('new_invoice');
  };

  const handleOpenPatientInvoice = (patient: Patient) => {
    handleOpenNewInvoice('OPD', patient.id);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex text-[#2B2420]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main App Layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="no-print">
          <div className="lg:hidden p-3 bg-white border-b border-[#E8E2DC] flex items-center justify-between">
            <button
              onClick={() => setIsOpenMobile(true)}
              className="p-2 rounded-xl text-[#7C7067] hover:bg-[#FAF7F5]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-serif font-bold text-sm text-[#2B2420]">
              Dr. Unnati Skin Clinic
            </span>
          </div>

          <Header
            onOpenNewInvoice={() => handleOpenNewInvoice('OPD')}
            onSelectPatient={(pId) => setSelectedPatientId(pId)}
          />
        </div>

        {/* View Content Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenNewInvoice={(type) => handleOpenNewInvoice(type || 'OPD')}
              onViewInvoice={(inv) => setViewingInvoice(inv)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'patients' && (
            <PatientList
              onSelectPatient={(pId) => setSelectedPatientId(pId)}
              onOpenNewInvoiceForPatient={handleOpenPatientInvoice}
            />
          )}

          {activeTab === 'new_invoice' && (
            <NewInvoiceFlow
              initialType={newInvoiceType}
              initialPatientId={newInvoicePatientId}
              onInvoiceCreated={(created) => {
                setViewingInvoice(created);
                setActiveTab('invoices');
              }}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceList
              onViewInvoice={(inv) => setViewingInvoice(inv)}
              onOpenNewInvoice={() => handleOpenNewInvoice('OPD')}
            />
          )}

          {activeTab === 'pharmacy_inventory' && <MedicineMaster />}

          {activeTab === 'pharmacy_stock' && (
            <div className="space-y-8">
              <StockManagement />
              <StockLedger />
            </div>
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'users' && <UsersAndRoles />}

          {activeTab === 'settings' && <ClinicSettingsView />}
        </main>
      </div>

      {/* Patient Profile Modal */}
      {selectedPatientId && (
        <PatientProfileModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          onViewInvoice={(inv) => setViewingInvoice(inv)}
          onOpenNewInvoiceForPatient={handleOpenPatientInvoice}
        />
      )}

      {/* Invoice Detail / Printable PDF View Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-4xl my-8">
            <PrintableInvoice
              invoice={viewingInvoice}
              onClose={() => setViewingInvoice(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
