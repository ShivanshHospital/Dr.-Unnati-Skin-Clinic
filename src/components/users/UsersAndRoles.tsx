import React, { useState } from 'react';
import { UserCheck, Shield, FileText, Lock, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../lib/utils';

export const UsersAndRoles: React.FC = () => {
  const { users, currentUser } = useAuth();
  const { auditLogs } = useData();

  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2DC] clinic-shadow space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B2420] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#C98A7D]" /> Staff Users & Access Control
          </h2>
          <p className="text-xs text-[#7C7067] mt-1">
            Role-based permissions (Admin, Doctor, Receptionist, Pharmacist) & tamper-evident audit log.
          </p>
        </div>

        <div className="flex space-x-3 border-t border-[#E8E2DC] pt-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067]'
            }`}
          >
            Staff Accounts & Roles
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#C98A7D] text-white shadow-xs'
                : 'bg-[#FAF7F5] text-[#7C7067]'
            }`}
          >
            Security Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                <th className="py-3.5 px-4">Staff Name</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#FAF7F5]">
                  <td className="py-3.5 px-4 font-bold text-[#2B2420] flex items-center gap-2">
                    {u.name}
                    {u.id === currentUser.id && (
                      <span className="text-[10px] bg-[#C98A7D] text-white font-bold px-2 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#7C7067]">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="capitalize font-bold text-[#C98A7D] bg-[#F9EFEF] px-2.5 py-0.5 rounded-full border border-[#C98A7D]/30">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#7C7067]">{u.phone || '-'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E2DC] clinic-shadow overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#E8E2DC] text-[#7C7067] uppercase font-bold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Details / Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DC]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF7F5]">
                  <td className="py-3.5 px-4 font-mono text-[#7C7067]">
                    {formatDate(log.timestamp, true)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#2B2420]">{log.userName}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#C98A7D]">{log.action}</td>
                  <td className="py-3.5 px-4 text-[#7C7067]">{log.entity}</td>
                  <td className="py-3.5 px-4 text-[#2B2420] font-medium">{log.afterState || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
