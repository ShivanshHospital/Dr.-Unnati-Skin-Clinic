import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { initialUsers } from '../lib/seedData';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  users: User[];
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('drunnati_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return initialUsers[0]; // Default to Dr. Unnati (Admin)
  });

  useEffect(() => {
    localStorage.setItem('drunnati_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchRole = (role: UserRole) => {
    const found = users.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
    }
  };

  const hasPermission = (permission: string): boolean => {
    const role: string = currentUser.role;
    if (role === 'admin') return true;

    switch (permission) {
      case 'manage_settings':
      case 'manage_users':
      case 'cancel_invoice':
      case 'view_cost_prices':
        return false;

      case 'opd_billing':
      case 'procedure_billing':
        return role === 'doctor' || role === 'receptionist';

      case 'medicine_billing':
      case 'manage_inventory':
      case 'stock_adjustment':
        return role === 'pharmacist' || role === 'receptionist';

      case 'view_reports':
        return role === 'doctor';

      case 'patient_management':
        return true;

      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchRole, users, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
