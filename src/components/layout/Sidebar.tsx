import React from 'react';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Receipt,
  Pill,
  Boxes,
  BarChart3,
  Settings,
  Sparkles,
  Stethoscope,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export type ActiveTab =
  | 'dashboard'
  | 'patients'
  | 'new_invoice'
  | 'invoices'
  | 'pharmacy_inventory'
  | 'pharmacy_stock'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { hasPermission } = useAuth();
  const { settings, lowStockItemsCount, expiringBatchesCount } = useData();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard',
    },
    {
      id: 'patients' as ActiveTab,
      label: 'Patient Directory',
      icon: Users,
      permission: 'patient_management',
    },
    {
      id: 'new_invoice' as ActiveTab,
      label: 'New Invoice',
      icon: PlusCircle,
      badge: 'Billing',
      highlight: true,
      permission: 'opd_billing',
    },
    {
      id: 'invoices' as ActiveTab,
      label: 'Invoice History',
      icon: Receipt,
      permission: 'opd_billing',
    },
    {
      id: 'pharmacy_inventory' as ActiveTab,
      label: 'Pharmacy Master',
      icon: Pill,
      badge: lowStockItemsCount > 0 ? `${lowStockItemsCount} Low` : undefined,
      badgeColor: 'bg-[#FFF5EE] text-[#D97736] border-[#FDE3D3]',
      permission: 'medicine_billing',
    },
    {
      id: 'pharmacy_stock' as ActiveTab,
      label: 'Stock In / Batches',
      icon: Boxes,
      badge: expiringBatchesCount > 0 ? `${expiringBatchesCount} Exp` : undefined,
      badgeColor: 'bg-[#FDF2F2] text-[#D9534F] border-[#FAD8D8]',
      permission: 'medicine_billing',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Revenue',
      icon: BarChart3,
      permission: 'view_reports',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Clinic Settings',
      icon: Settings,
      permission: 'manage_settings',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FAF7F5] border-r border-[#E8E2DC] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Clinic Brand Header */}
          <div className="p-5 border-b border-[#E8E2DC] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={settings.logoUrl || '/logo.png'}
                alt="Dr. Unnati Skin Clinic"
                className="w-11 h-11 object-contain rounded-xl bg-white p-0.5 shadow-sm border border-[#E8E2DC]"
              />
              <div>
                <h1 className="font-serif text-base font-bold text-[#2B2420] leading-tight tracking-tight">
                  Dr. Unnati
                </h1>
                <p className="text-[11px] font-semibold text-[#C98A7D] uppercase tracking-wider">
                  Skin Clinic & Pharmacy
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#7C7067] hover:bg-[#F5F0EB]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems
              .filter((item) => hasPermission(item.permission))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpenMobile(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      item.highlight
                        ? isActive
                          ? 'bg-[#C98A7D] text-white shadow-md'
                          : 'bg-[#F9EFEF] text-[#C98A7D] hover:bg-[#C98A7D] hover:text-white border border-[#C98A7D]/30'
                        : isActive
                        ? 'bg-white text-[#2B2420] shadow-sm border border-[#E8E2DC] font-bold'
                        : 'text-[#7C7067] hover:bg-white/60 hover:text-[#2B2420]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? item.highlight
                              ? 'text-white'
                              : 'text-[#C98A7D]'
                            : item.highlight
                            ? 'text-[#C98A7D]'
                            : 'text-[#7C7067]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          item.badgeColor || 'bg-white text-[#C98A7D] border-[#C98A7D]/40'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#E8E2DC] bg-white/40">
          <div className="p-3 bg-white rounded-xl border border-[#E8E2DC] shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#2B2420]">
              <span>FY: {settings.financialYear}</span>
              <span className="text-[#5B8A72] bg-[#EFF6F2] px-1.5 py-0.5 rounded-md text-[10px]">
                Active
              </span>
            </div>
            <p className="text-[10px] text-[#7C7067] mt-1 truncate">
              {settings.address.split(',')[0]}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
