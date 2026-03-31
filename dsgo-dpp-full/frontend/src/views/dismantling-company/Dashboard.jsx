import React, { useState } from 'react';
import { Layout } from '../shared/Layout';
import { Scissors, Package, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { dismantlingService, credentialsService } from '../../services/api';

export default function Dashboard() {
  return (
    <Layout title="Dismantling Company Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Package} label="In Progress" value="-" />
        <StatCard icon={CheckCircle} label="Completed" value="-" />
        <StatCard icon={Scissors} label="Components Recovered" value="-" />
      </div>
      <IntakeWorkflow />
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

export default Dashboard;
