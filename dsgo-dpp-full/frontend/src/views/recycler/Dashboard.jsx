import React, { useState } from 'react';
import { Layout } from '../shared/Layout';
import { RefreshCw, Package, CheckCircle, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { recyclingService } from '../../services/api';

export default function Dashboard() {
  return (
    <Layout title="Recycler Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Pending Intake" value="-" />
        <StatCard icon={RefreshCw} label="In Process" value="-" />
        <StatCard icon={CheckCircle} label="Completed" value="-" />
        <StatCard icon={Leaf} label="Recycling Rate" value="85%" />
      </div>
      <IntakeWorkflow />
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-yellow-50 rounded-lg">
        <Icon className="w-6 h-6 text-yellow-600" />
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
    lotId: '',
    processType: 'remelting',
    weight: '',
    recyclingPercentage: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleIntake = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recyclingService.intake({
        lotId: formData.lotId,
        facilityId: 'org-recycler',
        processType: formData.processType,
        weight: parseFloat(formData.weight),
        recyclingPercentage: parseFloat(formData.recyclingPercentage),
      });
      toast.success('Material lot received');
      setStep(2);
    } catch (error) {
      toast.error('Failed to record intake');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvent = async (eventType) => {
    try {
      await recyclingService.addEvent({
        lotId: formData.lotId,
        eventType,
        location: 'Processing Facility',
        timestamp: new Date().toISOString(),
        processingDetails: {},
      });
      toast.success('Event recorded');
    } catch (error) {
      toast.error('Failed to record event');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Material Recycling</h2>

      {step === 1 && (
        <div className="card max-w-2xl">
          <h3 className="font-medium mb-4">Receive Material Lot</h3>
          <form onSubmit={handleIntake} className="space-y-4">
            <div>
              <label className="label">Lot ID (from MaterialPassportCredential)</label>
              <input
                type="text"
                className="input"
                value={formData.lotId}
                onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
                placeholder="urn:lot:LOT-XXXXX"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Expected Recycling %</label>
                <input
                  type="number"
                  className="input"
                  value={formData.recyclingPercentage}
                  onChange={(e) => setFormData({ ...formData, recyclingPercentage: e.target.value })}
                  placeholder="92"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Process Type</label>
              <select
                className="input"
                value={formData.processType}
                onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
              >
                <option value="remelting">Closed-loop Remelting</option>
                <option value="downcycling">Downcycling</option>
                <option value="chemical">Chemical Processing</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Processing...' : 'Receive Material'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-medium mb-4">Process Events</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => handleAddEvent('RECEIVED')} className="btn btn-outline">
                Received
              </button>
              <button onClick={() => handleAddEvent('SORTING')} className="btn btn-outline">
                Sorting
              </button>
              <button onClick={() => handleAddEvent('PROCESSING')} className="btn btn-outline">
                Processing
              </button>
              <button onClick={() => handleAddEvent('COMPLETED')} className="btn btn-success">
                Complete
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium mb-4">Recycling Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Material:</span>
                <span className="font-medium">Aluminium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recycled Content:</span>
                <span className="font-medium">22%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recovery Yield:</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recycling Stream:</span>
                <span className="font-medium">aluminium recycling</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
