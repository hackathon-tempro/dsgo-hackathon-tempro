import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Building2, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_ICONS = {
  supplier: Building2,
  manufacturer: Building2,
  test_lab: Shield,
  lca_org: Shield,
  certification_body: Shield,
  construction_company: Building2,
  building_owner: Building2,
  maintenance_company: User,
  regulatory_authority: Shield,
  dismantling_company: Building2,
  recycler: Building2,
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
  const { login, demoUsers } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    try {
      await login(selectedUser.email);
      toast.success(`Welcome, ${selectedUser.name}!`);
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const groupedUsers = demoUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = {
        role: user.role,
        name: ROLE_LABELS[user.role] || user.role,
        org: user.org,
        user: user,
      };
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DSGO Digital Product Passport</h1>
          <p className="text-gray-600 mt-2">Select your role to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {Object.values(groupedUsers).map((item) => {
              const Icon = ROLE_ICONS[item.role] || User;
              const isSelected = selectedUser?.email === item.user.email;

              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setSelectedUser(item.user)}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.org}</div>
                </button>
              );
            })}
          </div>

          {selectedUser && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-gray-500">{selectedUser.org}</div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedUser || loading}
            className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Demo mode: No password required
        </p>
      </div>
    </div>
  );
}

export default Login;
