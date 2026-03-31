import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Building2, User, Shield, ChevronLeft, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  supplier: 'blue',
  manufacturer: 'green',
  test_lab: 'purple',
  lca_org: 'emerald',
  certification_body: 'orange',
  construction_company: 'yellow',
  building_owner: 'indigo',
  maintenance_company: 'teal',
  regulatory_authority: 'red',
  dismantling_company: 'gray',
  recycler: 'lime',
};

const COLOR_CLASSES = {
  blue:    { border: 'border-blue-400',    bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
  green:   { border: 'border-green-400',   bg: 'bg-green-50',   icon: 'bg-green-100 text-green-600',   badge: 'bg-green-100 text-green-700' },
  purple:  { border: 'border-purple-400',  bg: 'bg-purple-50',  icon: 'bg-purple-100 text-purple-600',  badge: 'bg-purple-100 text-purple-700' },
  emerald: { border: 'border-emerald-400', bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  orange:  { border: 'border-orange-400',  bg: 'bg-orange-50',  icon: 'bg-orange-100 text-orange-600',  badge: 'bg-orange-100 text-orange-700' },
  yellow:  { border: 'border-yellow-400',  bg: 'bg-yellow-50',  icon: 'bg-yellow-100 text-yellow-600',  badge: 'bg-yellow-100 text-yellow-700' },
  indigo:  { border: 'border-indigo-400',  bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700' },
  teal:    { border: 'border-teal-400',    bg: 'bg-teal-50',    icon: 'bg-teal-100 text-teal-600',    badge: 'bg-teal-100 text-teal-700' },
  red:     { border: 'border-red-400',     bg: 'bg-red-50',     icon: 'bg-red-100 text-red-600',     badge: 'bg-red-100 text-red-700' },
  gray:    { border: 'border-gray-400',    bg: 'bg-gray-50',    icon: 'bg-gray-100 text-gray-600',    badge: 'bg-gray-100 text-gray-700' },
  lime:    { border: 'border-lime-400',    bg: 'bg-lime-50',    icon: 'bg-lime-100 text-lime-600',    badge: 'bg-lime-100 text-lime-700' },
};

const ROLE_LABELS = {
  supplier: 'Supplier',
  manufacturer: 'Manufacturer',
  test_lab: 'Test Lab',
  lca_org: 'LCA Organisation',
  certification_body: 'Certification Body',
  construction_company: 'Construction Company',
  building_owner: 'Building Owner',
  maintenance_company: 'Maintenance Company',
  regulatory_authority: 'Regulatory Authority',
  dismantling_company: 'Dismantling Company',
  recycler: 'Recycler',
};

export function Login() {
  const { login, companies } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectEmployee = async (employee) => {
    setLoading(true);
    try {
      await login(employee.email);
      toast.success(`Welcome, ${employee.firstName}!`);
    } catch {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DSGO Digital Product Passport</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Powered by iSHARE · W3C Verifiable Credentials · DSGO Afsprakenstelsel
          </p>
        </div>

        {!selectedCompany ? (
          /* Step 1: Company selection */
          <>
            <p className="text-sm font-medium text-gray-700 mb-3">Step 1 — Select your organisation</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {companies.map((company) => {
                const color = ROLE_COLORS[company.role] || 'gray';
                const cls = COLOR_CLASSES[color];
                return (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:${cls.border} hover:${cls.bg} border-gray-200`}
                  >
                    <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${cls.icon}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-sm text-gray-900 leading-tight">{company.name}</div>
                    <div className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls.badge}`}>
                      {ROLE_LABELS[company.role]}
                    </div>
                    <div className="mt-1 text-xs text-gray-400 font-mono truncate">{company.ishareId}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">Demo mode · No password required</p>
          </>
        ) : (
          /* Step 2: Employee selection */
          <>
            <button
              onClick={() => setSelectedCompany(null)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
            >
              <ChevronLeft className="w-4 h-4" /> Back to organisations
            </button>

            {/* Company header */}
            {(() => {
              const color = ROLE_COLORS[selectedCompany.role] || 'gray';
              const cls = COLOR_CLASSES[color];
              return (
                <div className={`rounded-xl border-2 ${cls.border} ${cls.bg} p-4 mb-6`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls.icon}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{selectedCompany.name}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls.badge}`}>
                          {ROLE_LABELS[selectedCompany.role]}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">{selectedCompany.ishareId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <p className="text-sm font-medium text-gray-700 mb-3">Step 2 — Select your employee</p>
            <div className="space-y-3">
              {selectedCompany.employees.map((emp) => (
                <button
                  key={emp.email}
                  disabled={loading}
                  onClick={() => handleSelectEmployee(emp)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary-200">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{emp.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Briefcase className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{emp.jobTitle}</span>
                    </div>
                  </div>
                  <LogIn className="w-5 h-5 text-gray-300 group-hover:text-primary-500 shrink-0" />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">Demo mode · No password required</p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
