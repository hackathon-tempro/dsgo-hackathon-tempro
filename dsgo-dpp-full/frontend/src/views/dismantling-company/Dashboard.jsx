import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../shared/Layout';
import { Scissors, Package, CheckCircle, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { dismantlingService, credentialsService } from '../../services/api';

const navItems = [
  { label: "Intake", path: "/dismantling-company" },
  { label: "Inventory", path: "/dismantling-company/inventory" },
  { label: "Handover", path: "/dismantling-company/handover" },
];

export default function Dashboard() {
  return (
    <Layout title="Dismantling Company Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Package} label="In Progress" value="-" />
        <StatCard icon={CheckCircle} label="Completed" value="-" />
        <StatCard icon={Scissors} label="Components Recovered" value="-" />
      </div>

      <Routes>
        <Route path="" element={<IntakeWorkflow />} />
        <Route path="inventory" element={<InventoryView />} />
        <Route path="handover" element={<HandoverView />} />
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

function IntakeWorkflow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dppId: '',
    dismantlingDate: new Date().toISOString().split('T')[0],
    outcome: 'RECYCLED',
    components: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleIntake = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dismantlingService.intake({
        dppId: formData.dppId,
        facilityId: 'org-dismantling_company',
        dismantlingDate: formData.dismantlingDate,
        outcome: formData.outcome,
        components: [
          { name: 'Aluminium Frame', material: 'Aluminium', weight: '15kg' },
          { name: 'Steel Bolts', material: 'Steel', weight: '2kg' },
        ],
      });
      toast.success('Dismantling intake recorded');
      setStep(2);
    } catch (error) {
      toast.error('Failed to record intake');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Product Dismantling Intake</h2>

      {step === 1 && (
        <div className="card max-w-2xl">
          <h3 className="font-medium mb-4">Verify & Record Dismantling</h3>
          <form onSubmit={handleIntake} className="space-y-4">
            <div>
              <label className="label">DPP ID (from received product)</label>
              <input
                type="text"
                className="input"
                value={formData.dppId}
                onChange={(e) => setFormData({ ...formData, dppId: e.target.value })}
                placeholder="Enter DPP ID"
                required
              />
            </div>
            <div>
              <label className="label">Dismantling Date</label>
              <input
                type="date"
                className="input"
                value={formData.dismantlingDate}
                onChange={(e) => setFormData({ ...formData, dismantlingDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Outcome</label>
              <select
                className="input"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              >
                <option value="RECYCLED">Recycled</option>
                <option value="REUSED">Reused</option>
                <option value="DISPOSED">Disposed</option>
                <option value="STORAGE">Storage</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Recording...' : 'Record Dismantling'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="card max-w-2xl text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Dismantling Recorded</h3>
          <p className="text-gray-600 mb-4">
            Dismantling outcome has been appended to the DPP.
          </p>
          <button onClick={() => setStep(1)} className="btn btn-primary">
            New Intake
          </button>
        </div>
      )}
    </div>
  );
}

function InventoryView() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await dismantlingService.list().catch(() => ({ data: [] }));
        setInventory(data.data || []);
      } catch (error) {
        console.error('Failed to load inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Component Inventory</h2>
      {inventory.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No components in inventory</p>
          <p className="text-sm text-gray-400 mt-2">Dismantled components will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => (
            <div key={item.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">Component</h3>
                <span className="badge badge-info">{item.status}</span>
              </div>
              <p className="text-xs text-gray-500">DPP: {item.dpp_id}</p>
              <p className="text-xs text-gray-400 mt-2">{item.outcome}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HandoverView() {
  const [handovers, setHandovers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleHandover = async () => {
    setSubmitting(true);
    try {
      await credentialsService.issueDPP({
        dppId: `DPP-RECYCLED-${Date.now()}`,
        productData: {
          name: 'Recovered Materials',
          components: [],
          recycled: true,
        },
      });
      toast.success('Materials handed over to recycler');
    } catch (error) {
      toast.error('Failed to handover materials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Handover to Recycler</h2>
      <div className="card">
        <h3 className="font-medium mb-4">Send Recovered Materials</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Select Recycler</label>
            <select className="input">
              <option value="">Select recycler...</option>
              <option value="recycler">RecycleCircle</option>
            </select>
          </div>
          <div>
            <label className="label">Material Types</label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p>Aluminium: 15kg</p>
              <p>Steel: 2kg</p>
            </div>
          </div>
          <button onClick={handleHandover} disabled={submitting} className="btn btn-primary w-full">
            {submitting ? 'Processing...' : 'Hand Over Materials'}
          </button>
        </div>
      </div>
    </div>
  );
}

