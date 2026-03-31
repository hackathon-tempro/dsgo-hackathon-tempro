import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEMO_COMPANIES = [
  {
    id: 'acme-supplier',
    name: 'Arconic',
    ishareId: 'EU.EORI.NL000000001012',
    role: 'supplier',
    country: 'NL',
    employees: [
      { email: 'jan.vanderberg@acme-supplier.nl', name: 'Jan van der Berg', firstName: 'Jan', lastName: 'van der Berg', jobTitle: 'Procurement Manager' },
      { email: 'sophia.dewit@acme-supplier.nl', name: 'Sophia de Wit', firstName: 'Sophia', lastName: 'de Wit', jobTitle: 'Environmental Officer' },
    ],
  },
  {
    id: 'buildcorp',
    name: 'Alkondor',
    ishareId: 'EU.EORI.DE000000002034',
    role: 'manufacturer',
    country: 'DE',
    employees: [
      { email: 'marco.schmidt@buildcorp.de', name: 'Marco Schmidt', firstName: 'Marco', lastName: 'Schmidt', jobTitle: 'Production Manager' },
      { email: 'lisa.bauer@buildcorp.de', name: 'Lisa Bauer', firstName: 'Lisa', lastName: 'Bauer', jobTitle: 'Quality Engineer' },
    ],
  },
  {
    id: 'eurotest',
    name: 'EuroTest Lab',
    ishareId: 'EU.EORI.FR000000003045',
    role: 'test_lab',
    country: 'FR',
    employees: [
      { email: 'pierre.dubois@eurotest.fr', name: 'Pierre Dubois', firstName: 'Pierre', lastName: 'Dubois', jobTitle: 'Test Engineer' },
      { email: 'claire.martin@eurotest.fr', name: 'Claire Martin', firstName: 'Claire', lastName: 'Martin', jobTitle: 'Lab Supervisor' },
    ],
  },
  {
    id: 'greenlife',
    name: 'Alba Concepts',
    ishareId: 'EU.EORI.NL000000004056',
    role: 'lca_org',
    country: 'NL',
    employees: [
      { email: 'anna.jansen@greenlife.nl', name: 'Anna Jansen', firstName: 'Anna', lastName: 'Jansen', jobTitle: 'LCA Analyst' },
    ],
  },
  {
    id: 'certifyeu',
    name: 'CertifyEU',
    ishareId: 'EU.EORI.BE000000005067',
    role: 'certification_body',
    country: 'BE',
    employees: [
      { email: 'klaus.weber@certifyeu.be', name: 'Klaus Weber', firstName: 'Klaus', lastName: 'Weber', jobTitle: 'Senior Certifier' },
      { email: 'elena.dupont@certifyeu.be', name: 'Elena Dupont', firstName: 'Elena', lastName: 'Dupont', jobTitle: 'Certification Analyst' },
    ],
  },
  {
    id: 'constructa',
    name: 'Heijmans',
    ishareId: 'EU.EORI.NL000000006078',
    role: 'construction_company',
    country: 'NL',
    employees: [
      { email: 'henk.bakker@constructa.nl', name: 'Henk Bakker', firstName: 'Henk', lastName: 'Bakker', jobTitle: 'Project Manager' },
    ],
  },
  {
    id: 'propinvest',
    name: 'VvE',
    ishareId: 'EU.EORI.DE000000007089',
    role: 'building_owner',
    country: 'DE',
    employees: [
      { email: 'thomas.muller@propinvest.de', name: 'Thomas Müller', firstName: 'Thomas', lastName: 'Müller', jobTitle: 'Portfolio Manager' },
    ],
  },
  {
    id: 'maintainpro',
    name: 'MaintainPro Services',
    ishareId: 'EU.EORI.AT000000008090',
    role: 'maintenance_company',
    country: 'AT',
    employees: [
      { email: 'stefan.gruber@maintainpro.at', name: 'Stefan Gruber', firstName: 'Stefan', lastName: 'Gruber', jobTitle: 'Field Engineer' },
    ],
  },
  {
    id: 'eu-authority',
    name: 'EU Regulatory Authority',
    ishareId: 'EU.EORI.EU000000009012',
    role: 'regulatory_authority',
    country: 'EU',
    employees: [
      { email: 'maria.santos@eu-authority.eu', name: 'Maria Santos', firstName: 'Maria', lastName: 'Santos', jobTitle: 'Compliance Officer' },
    ],
  },
  {
    id: 'dismantletech',
    name: 'DismantleTech',
    ishareId: 'EU.EORI.NL000000010023',
    role: 'dismantling_company',
    country: 'NL',
    employees: [
      { email: 'erik.deboer@dismantletech.nl', name: 'Erik de Boer', firstName: 'Erik', lastName: 'de Boer', jobTitle: 'Operations Manager' },
    ],
  },
  {
    id: 'recyclecircle',
    name: 'RecycleCircle',
    ishareId: 'EU.EORI.DE000000011034',
    role: 'recycler',
    country: 'DE',
    employees: [
      { email: 'franz.klein@recyclecircle.de', name: 'Franz Klein', firstName: 'Franz', lastName: 'Klein', jobTitle: 'Material Specialist' },
    ],
  },
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

  const buildUserData = (foundCompany, foundEmployee) => ({
    email: foundEmployee.email,
    name: foundEmployee.name,
    firstName: foundEmployee.firstName,
    lastName: foundEmployee.lastName,
    jobTitle: foundEmployee.jobTitle,
    role: foundCompany.role,
    org: foundCompany.name,
    ishareId: foundCompany.ishareId,
    organizationId: foundCompany.id,
    id: `user-${foundEmployee.email}`,
  });

  const login = async (email) => {
    let foundEmployee = null;
    let foundCompany = null;

    for (const company of DEMO_COMPANIES) {
      const emp = company.employees.find((e) => e.email === email);
      if (emp) {
        foundEmployee = emp;
        foundCompany = company;
        break;
      }
    }

    if (!foundEmployee || !foundCompany) {
      throw new Error('User not found');
    }

    const token = `demo-token-${Date.now()}`;
    const userData = buildUserData(foundCompany, foundEmployee);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const switchToCompany = (companyId, employeeEmail = null) => {
    const company = DEMO_COMPANIES.find((c) => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const employee = employeeEmail
      ? company.employees.find((e) => e.email === employeeEmail)
      : company.employees[0];

    if (!employee) {
      throw new Error('Employee not found');
    }

    const existingToken = localStorage.getItem('token') || `demo-token-${Date.now()}`;
    const userData = buildUserData(company, employee);

    localStorage.setItem('token', existingToken);
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
    companies: DEMO_COMPANIES,
    switchToCompany,
    // legacy compat
    demoUsers: DEMO_COMPANIES.flatMap((c) =>
      c.employees.map((e) => ({ ...e, role: c.role, org: c.name }))
    ),
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
