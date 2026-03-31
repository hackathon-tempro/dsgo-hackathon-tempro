import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../shared/Layout';
import { Shield, FileSearch, CheckCircle, XCircle, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditService, presentationsService } from '../../services/api';

const navItems = [
  { label: "Audit Requests", path: "/regulatory-authority" },
  { label: "Access Grants", path: "/regulatory-authority/grants" },
  { label: "Submissions", path: "/regulatory-authority/submissions" },
];

export default function Dashboard() {
  return (
    <Layout title="Regulatory Authority Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileSearch} label="Active Audits" value="-" />
        <StatCard icon={CheckCircle} label="Completed" value="-" />
        <StatCard icon={XCircle} label="Non-Compliant" value="-" />
        <StatCard icon={Shield} label="Framework" value="EU DPP" />
      </div>

      <Routes>
        <Route path="" element={<AuditWorkflow />} />
        <Route path="grants" element={<AccessGrantsView />} />
        <Route path="submissions" element={<SubmissionsView />} />
      </Routes>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-red-50 rounded-lg">
        <Icon className="w-6 h-6 text-red-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function AuditWorkflow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    targetOrganization: '',
    scope: '',
    requiredClaims: ['composition', 'countryOfOrigin', 'recycledContentPercent'],
    legalBasis: 'EU DPP Regulation Article 10',
  });
  const [submitting, setSubmitting] = useState(false);
  const [auditRequest, setAuditRequest] = useState(null);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await auditService.createRequest({
        organizationId: formData.targetOrganization,
        auditorId: 'regulatory_authority',
        scope: formData.scope,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        resources: formData.requiredClaims,
      });
      setAuditRequest(result.data);
      toast.success('Audit request created');
      setStep(2);
    } catch (error) {
      toast.error('Failed to create audit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="card max-w-2xl">
          <h3 className="font-medium mb-4">Create Audit Request</h3>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className="label">Target Organisation</label>
              <select
                className="input"
                value={formData.targetOrganization}
                onChange={(e) => setFormData({ ...formData, targetOrganization: e.target.value })}
                required
              >
                <option value="">Select organisation...</option>
                <option value="org-manufacturer">Alkondor</option>
                <option value="org-supplier">Arconic</option>
              </select>
            </div>
            <div>
              <label className="label">Audit Scope</label>
              <textarea
                className="input"
                rows={2}
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Describe the scope of this audit..."
                required
              />
            </div>
            <div>
              <label className="label">Legal Basis</label>
              <input
                type="text"
                className="input"
                value={formData.legalBasis}
                onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Creating...' : 'Send Audit Request'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && auditRequest && (
        <div className="card max-w-2xl">
          <h3 className="font-medium mb-4">Audit Request Submitted</h3>
          <div className="p-4 bg-green-50 rounded-lg mb-4">
            <p className="text-green-800 font-medium">Request ID: {auditRequest.requestId}</p>
            <p className="text-sm text-green-600">Awaiting organisation approval...</p>
          </div>
          <div className="space-y-2">
            <DetailRow label="Target" value={formData.targetOrganization} />
            <DetailRow label="Legal Basis" value={formData.legalBasis} />
            <DetailRow label="Status" value="Pending Approval" />
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Required Claims:</h4>
            <div className="flex flex-wrap gap-2">
              {formData.requiredClaims.map((claim) => (
                <span key={claim} className="badge badge-info">{claim}</span>
              ))}
            </div>
          </div>
          <button onClick={() => setStep(3)} className="btn btn-primary w-full mt-6">
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card max-w-2xl text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Audit Process Initiated</h3>
          <p className="text-gray-600 mb-4">
            The organisation will receive your audit request and can grant time-bounded access.
          </p>
          <button onClick={() => setStep(1)} className="btn btn-outline">
            New Audit Request
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AccessGrantsView() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const data = await auditService.getLogs?.().catch(() => ({ data: [] })) || {};
        setGrants(data.data || []);
      } catch (error) {
        console.error('Failed to load grants:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrants();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Access Grants</h2>
      <div className="card text-center py-12 text-gray-500">
        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Access grants from organizations will appear here</p>
        <p className="text-sm text-gray-400 mt-2">Organizations grant time-bounded access for audits</p>
      </div>
    </div>
  );
}

function SubmissionsView() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await auditService.getRequests?.().catch(() => ({ data: [] })) || {};
        setSubmissions(data.data || []);
      } catch (error) {
        console.error('Failed to load submissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Audit Submissions</h2>
      <div className="card text-center py-12 text-gray-500">
        <FileSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Organization submissions will appear here</p>
        <p className="text-sm text-gray-400 mt-2">Organizations submit credentials for audit review</p>
      </div>
    </div>
  );
}

