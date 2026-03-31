import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

const DEMO_USERS = [
  { email: 'supplier@acme-supplier.nl', name: 'Supplier User', role: 'supplier', org: 'Acme Aluminium Supplier' },
  { email: 'manufacturer@buildcorp.de', name: 'Manufacturer User', role: 'manufacturer', org: 'BuildCorp Manufacturers' },
  { email: 'tester@eurotest.fr', name: 'Test Lab User', role: 'test_lab', org: 'EuroTest Lab' },
  { email: 'lca@greenlife.nl', name: 'LCA User', role: 'lca_org', org: 'GreenLife LCA' },
  { email: 'certifier@certifyeu.be', name: 'Certifier User', role: 'certification_body', org: 'CertifyEU' },
  { email: 'constructor@constructa.nl', name: 'Constructor User', role: 'construction_company', org: 'Constructa BV' },
  { email: 'owner@propinvest.de', name: 'Owner User', role: 'building_owner', org: 'PropInvest Real Estate' },
  { email: 'maintenance@maintainpro.at', name: 'Maintenance User', role: 'maintenance_company', org: 'MaintainPro Services' },
  { email: 'auditor@eu-authority.eu', name: 'Auditor User', role: 'regulatory_authority', org: 'EU Regulatory Authority' },
  { email: 'dismantler@dismantletech.nl', name: 'Dismantler User', role: 'dismantling_company', org: 'DismantleTech' },
  { email: 'recycler@recyclecircle.de', name: 'Recycler User', role: 'recycler', org: 'RecycleCircle' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email) => {
    const demoUser = DEMO_USERS.find((u) => u.email === email);
    if (!demoUser) {
      throw new Error('User not found');
    }

    const token = `demo-token-${Date.now()}`;
    const userData = {
      ...demoUser,
      id: `user-${demoUser.role}`,
      organizationId: `org-${demoUser.role}`,
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    demoUsers: DEMO_USERS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
