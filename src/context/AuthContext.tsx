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
  const [currentUser] = useState<User>(initialUsers[0]);

  // All access control restrictions removed - full access across all clinic features
  const switchRole = (_role: UserRole) => {};
  const hasPermission = (_permission: string): boolean => true;

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
