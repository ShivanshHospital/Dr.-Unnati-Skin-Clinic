import React, { useState } from 'react';
import {
  Search,
  Bell,
  PlusCircle,
  Calendar,
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../lib/utils';

interface HeaderProps {
  onOpenNewInvoice: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewInvoice, onSelectPatient }) => {
  const { currentUser } = useAuth();
  const { patients, lowStockItemsCount, expiringBatchesCount, settings } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalAlerts = lowStockItemsCount + expiringBatchesCount;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E8E2DC] px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C7067]" />
          <input
            type="text"
            placeholder="Quick search patients by Name, Phone, or UHID (UNT-)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF7F5] border border-[#E8E2DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C98A7D]/40 focus:border-[#C98A7D] transition-all text-[#2B2420] placeholder-[#7C7067]/70"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery.trim() !== '' && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#E8E2DC] max-h-72 overflow-y-auto z-50 p-2">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.id);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-[#FAF7F5] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#2B2420] group-hover:text-[#C98A7D] flex items-center gap-2">
                      {p.fullName}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF7F5] border border-[#E8E2DC] font-mono text-[#7C7067]">
                        {p.id}
                      </span>
                    </div>
                    <div className="text-xs text-[#7C7067] font-mono mt-0.5">
                      Phone: {p.phone} • {p.gender}, {p.age} yrs
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#C98A7D] opacity-0 group-hover:opacity-100 transition-opacity">
                    View Profile →
                  </span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[#7C7067]">
                No patients found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Tools & Role Controls */}
      <div className="flex items-center space-x-3 lg:space-x-5">
        {/* Date Display */}
        <div className="hidden xl:flex items-center space-x-2 text-xs font-medium text-[#7C7067] bg-[#FAF7F5] px-3 py-1.5 rounded-lg border border-[#E8E2DC]">
          <Calendar className="w-3.5 h-3.5 text-[#C98A7D]" />
          <span>{formatDate(new Date().toISOString())}</span>
        </div>

        {/* Create Invoice Action */}
        <button
          onClick={onOpenNewInvoice}
          className="flex items-center space-x-2 bg-[#C98A7D] hover:bg-[#B5776A] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Invoice</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 rounded-xl text-[#7C7067] hover:bg-[#FAF7F5] transition-colors border border-transparent hover:border-[#E8E2DC]"
            title="Alerts & Inventory Notifications"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D97736] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Notification Menu */}
          {showNotificationMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E8E2DC] z-50 p-4">
              <div className="flex items-center justify-between border-b border-[#E8E2DC] pb-2 mb-3">
                <h4 className="text-sm font-bold text-[#2B2420] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97736]" /> Inventory Alerts
                </h4>
                <span className="text-xs bg-[#FFF5EE] text-[#D97736] font-semibold px-2 py-0.5 rounded-full">
                  {totalAlerts} Active
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {lowStockItemsCount > 0 && (
                  <div className="p-2.5 bg-[#FFF5EE] border border-[#FDE3D3] rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#D97736] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#2B2420]">Low Stock Warning</p>
                      <p className="text-[#7C7067]">
                        {lowStockItemsCount} medicine(s) are below reorder stock level.
                      </p>
                    </div>
                  </div>
                )}
                {expiringBatchesCount > 0 && (
                  <div className="p-2.5 bg-[#FDF2F2] border border-[#FAD8D8] rounded-xl flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#D9534F] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#2B2420]">Expiring Medicines</p>
                      <p className="text-[#7C7067]">
                        {expiringBatchesCount} batch(es) expiring within 60 days.
                      </p>
                    </div>
                  </div>
                )}
                {totalAlerts === 0 && (
                  <p className="text-center text-[#7C7067] py-3">All stock levels and expiries are healthy!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clinic Administrator Badge */}
        <div className="flex items-center space-x-2 border-l border-[#E8E2DC] pl-3 lg:pl-5">
          <div className="text-right">
            <div className="text-xs font-bold text-[#2B2420] flex items-center justify-end gap-1">
              {currentUser.name}
              <ShieldCheck className="w-3.5 h-3.5 text-[#C98A7D]" />
            </div>
            <div className="text-[11px] text-[#7C7067] font-medium">
              Clinic Administrator
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
