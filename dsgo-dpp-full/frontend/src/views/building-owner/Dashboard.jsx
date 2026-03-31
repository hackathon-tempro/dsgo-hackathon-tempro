import React, { useState } from 'react';
import { Layout } from '../shared/Layout';
import { Building2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { assetsService, complianceService, presentationsService } from '../../services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <Layout title="Building Owner Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Buildings" value="2" />
        <StatCard icon={FileText} label="Total DPPs" value="15" />
        <StatCard icon={CheckCircle} label="Compliant" value="12" />
        <StatCard icon={AlertTriangle} label="Issues" value="3" />
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {['portfolio', 'compliance', 'verification'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'portfolio' && <PortfolioView />}
      {activeTab === 'compliance' && <ComplianceView />}
      {activeTab === 'verification' && <VerificationView />}
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-indigo-50 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function PortfolioView() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Building Portfolio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BuildingCard
          name="Office Complex A"
          id="ASSET-001"
          dpps={8}
          compliant={6}
          issues={2}
        />
        <BuildingCard
          name="Shopping Center B"
          id="ASSET-002"
          dpps={7}
          compliant={6}
          issues={1}
        />
      </div>
    </div>
  );
}

function BuildingCard({ name, id, dpps, compliant, issues }) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-xs text-gray-500">{id}</p>
        </div>
        <span className="badge badge-success">{compliant}/{dpps} Compliant</span>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-outline text-sm flex-1">View DPPs</button>
        <button className="btn btn-primary text-sm flex-1">Check Compliance</button>
      </div>
    </div>
  );
}

function ComplianceView() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [framework, setFramework] = useState('EU_DPP_REGULATION_2024');

  const handleCheck = async () => {
    setChecking(true);
    try {
      const data = await complianceService.check({
        organizationId: 'org-building_owner',
        framework,
        requirements: [],
      });
      setResult(data.data);
      toast.success('Compliance check completed');
    } catch (error) {
      toast.error('Compliance check failed');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-medium mb-4">Portfolio Compliance Check</h3>
        <div className="flex gap-4 mb-4">
          <select
            className="input flex-1"
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
          >
            <option value="EU_DPP_REGULATION_2024">EU DPP Regulation 2024</option>
            <option value="ESPR">ESPR (Ecodesign)</option>
          </select>
          <button onClick={handleCheck} disabled={checking} className="btn btn-primary">
            {checking ? 'Checking...' : 'Run Compliance Check'}
          </button>
        </div>

        {result && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Compliance Score:</span>
              <span className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.score?.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${result.passed ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationView() {
  const [submitting, setSubmitting] = useState(false);

  const handleRequestProofs = async () => {
    setSubmitting(true);
    try {
      await presentationsService.request({
        credentialTypes: ['DigitalProductPassport', 'ProductEnvironmentalCredential'],
      });
      toast.success('Proof request sent to all DPP holders');
    } catch (error) {
      toast.error('Failed to send proof requests');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-medium mb-4">Request Verifiable Proofs</h3>
      <p className="text-sm text-gray-600 mb-4">
        Send proof requests to all DPP holders in your portfolio to verify compliance claims.
      </p>
      <button onClick={handleRequestProofs} disabled={submitting} className="btn btn-primary">
        {submitting ? 'Sending...' : 'Request Proofs from All Holders'}
      </button>
    </div>
  );
}

