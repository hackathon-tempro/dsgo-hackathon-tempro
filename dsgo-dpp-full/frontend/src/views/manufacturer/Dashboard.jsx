import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "../shared/Layout";
import {
  Package,
  CheckCircle,
  FileText,
  Truck,
  CheckCircle as CheckCircleIcon,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { dppService, credentialsService } from "../../services/api";
import { VerificationBadge } from "../../components/VerificationBadge";

const navItems = [
  { label: "Receiving", path: "/manufacturer" },
  { label: "DPP Overview", path: "/manufacturer/dpp" },
  { label: "Assembly", path: "/manufacturer/assembly" },
  { label: "Transfer", path: "/manufacturer/transfer" },
];

export default function Dashboard() {
  const [credentials, setCredentials] = useState([]);
  const [dpps, setDpps] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [credsData] = await Promise.all([
        credentialsService.list().catch(() => ({ data: [] })),
      ]);
      setCredentials(credsData.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Manufacturer Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Truck}
          label="Incoming Shipments"
          value={shipments.length}
        />
        <StatCard icon={CheckCircle} label="Verified Credentials" value="-" />
        <StatCard
          icon={FileText}
          label="Active DPPs"
          value={dpps.length || 1}
        />
        <StatCard icon={Package} label="Products" value="-" />
      </div>

      <Routes>
        <Route
          path=""
          element={
            <ReceivingView credentials={credentials} onVerify={loadData} />
          }
        />
        <Route path="dpp" element={<DPPOverviewView />} />
        <Route path="assembly" element={<AssemblyView />} />
        <Route path="transfer" element={<TransferView />} />
      </Routes>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-primary-50 rounded-lg">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ReceivingView({ credentials, onVerify }) {
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async (cred) => {
    try {
      const result = await credentialsService.verify(
        cred.id || cred.credential_id,
      );
      setVerificationResult(result.data);
      toast.success("Verification completed");
    } catch (error) {
      toast.error("Verification failed");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        Incoming Deliveries & Credentials
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium mb-4">Received Credentials</h3>
          {credentials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No credentials received yet. Shipments with
              MaterialPassportCredential will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCredential(cred)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{cred.type}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {cred.credential_id}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerify(cred);
                      }}
                      className="btn btn-outline text-xs py-1"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-medium mb-4">Verification Result</h3>
          {verificationResult ? (
            <div className="space-y-3">
              <VerificationBadge
                verified={verificationResult.verified}
                size="lg"
              />
              <div className="mt-4 space-y-2">
                <CheckItem
                  label="Signature Valid"
                  passed={verificationResult.verified}
                />
                <CheckItem
                  label="Issuer Trusted"
                  passed={verificationResult.verified}
                />
                <CheckItem
                  label="Status Valid"
                  passed={verificationResult.verified}
                />
                <CheckItem
                  label="Schema Valid"
                  passed={verificationResult.verified}
                />
              </div>
              {verificationResult.verified ? (
                <button className="btn btn-success w-full mt-4">
                  Accept Delivery
                </button>
              ) : (
                <button className="btn btn-error w-full mt-4">
                  Reject Delivery
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Select a credential and click Verify to check its validity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DPPOverviewView() {
  const [dpps, setDpps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDpps = async () => {
      try {
        const data = await dppService.list().catch(() => ({ data: [] }));
        setDpps(data.data || []);
      } catch (error) {
        console.error('Failed to load DPPs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDpps();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">DPP Overview</h2>
        <button className="btn btn-primary">Create New DPP</button>
      </div>
      {dpps.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No DPPs created yet</p>
          <p className="text-sm text-gray-400 mt-2">Create a DPP to track your products</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dpps.map((dpp) => (
            <div key={dpp.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{dpp.product_name || 'Product'}</h3>
                <span className="badge badge-success">{dpp.status || 'active'}</span>
              </div>
              <p className="text-xs text-gray-500 font-mono">{dpp.dpp_id}</p>
              <p className="text-xs text-gray-400 mt-2">Version: {dpp.version || 1}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssemblyView() {
  const [components, setComponents] = useState([
    { id: '1', name: 'Aluminium Panel', type: 'MaterialPassportCredential' },
    { id: '2', name: 'Steel Bar', type: 'MaterialPassportCredential' },
  ]);
  const [assembly, setAssembly] = useState({ name: '', components: [] });
  const [submitting, setSubmitting] = useState(false);

  const handleAddComponent = (comp) => {
    if (!assembly.components.find(c => c.id === comp.id)) {
      setAssembly({ ...assembly, components: [...assembly.components, comp] });
    }
  };

  const handleCreateDPP = async () => {
    if (!assembly.name || assembly.components.length === 0) {
      toast.error('Please add a name and at least one component');
      return;
    }
    setSubmitting(true);
    try {
      await dppService.create({
        productName: assembly.name,
        components: assembly.components.map(c => c.id),
      });
      toast.success('DPP created successfully!');
      setAssembly({ name: '', components: [] });
    } catch (error) {
      toast.error('Failed to create DPP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Assembly Management</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium mb-4">Available Components</h3>
          <div className="space-y-3">
            {components.map((comp) => (
              <div key={comp.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{comp.name}</p>
                  <p className="text-xs text-gray-500">{comp.type}</p>
                </div>
                <button onClick={() => handleAddComponent(comp)} className="btn btn-outline text-xs">
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-medium mb-4">Create Assembly</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Product Name</label>
              <input
                type="text"
                className="input"
                value={assembly.name}
                onChange={(e) => setAssembly({ ...assembly, name: e.target.value })}
                placeholder="Final Product Name"
              />
            </div>
            <div>
              <label className="label">Selected Components ({assembly.components.length})</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {assembly.components.length === 0 ? (
                  <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">No components selected</p>
                ) : (
                  assembly.components.map((comp) => (
                    <div key={comp.id} className="p-2 bg-primary-50 rounded-lg flex justify-between">
                      <span className="text-sm">{comp.name}</span>
                      <button onClick={() => setAssembly({ ...assembly, components: assembly.components.filter(c => c.id !== comp.id) })} className="text-red-500 text-xs">Remove</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <button onClick={handleCreateDPP} disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Creating...' : 'Create DPP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferView() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ recipient: '', type: 'sale', dppId: '' });

  const handleTransfer = async () => {
    if (!formData.recipient || !formData.dppId) {
      toast.error('Please select recipient and DPP');
      return;
    }
    setSubmitting(true);
    try {
      await dppService.transfer({
        dppId: formData.dppId,
        toOrganization: formData.recipient,
        transferType: formData.type,
      });
      toast.success('Transfer completed!');
      setFormData({ recipient: '', type: 'sale', dppId: '' });
    } catch (error) {
      toast.error('Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Product Transfer</h2>
      <div className="card max-w-xl">
        <h3 className="font-medium mb-4">Transfer DPP to Another Organization</h3>
        <div className="space-y-4">
          <div>
            <label className="label">DPP ID</label>
            <input
              type="text"
              className="input"
              value={formData.dppId}
              onChange={(e) => setFormData({ ...formData, dppId: e.target.value })}
              placeholder="DPP-001"
            />
          </div>
          <div>
            <label className="label">Recipient Organization</label>
            <select
              className="input"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            >
              <option value="">Select recipient...</option>
              <option value="construction_company">Construction Company</option>
              <option value="building_owner">Building Owner</option>
              <option value="maintenance_company">Maintenance Company</option>
            </select>
          </div>
          <div>
            <label className="label">Transfer Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="sale">Sale</option>
              <option value="transfer">Transfer</option>
              <option value="lease">Lease</option>
            </select>
          </div>
          <button onClick={handleTransfer} disabled={submitting} className="btn btn-primary w-full">
            {submitting ? 'Processing...' : 'Transfer DPP'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ label, passed }) {
  return (
    <div
      className={`flex items-center gap-2 ${passed ? "text-green-600" : "text-red-600"}`}
    >
      {passed ? (
        <CheckCircleIcon className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
}
