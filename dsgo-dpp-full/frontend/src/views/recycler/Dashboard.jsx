import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../shared/Layout';
import { RefreshCw, Package, CheckCircle, Leaf, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { recyclingService } from '../../services/api';

const navItems = [
  { label: "Intake", path: "/recycler" },
  { label: "Processing", path: "/recycler/processing" },
  { label: "Impact Reports", path: "/recycler/impact" },
];

export default function Dashboard() {
  return (
    <Layout title="Recycler Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Pending Intake" value="-" />
        <StatCard icon={RefreshCw} label="In Process" value="-" />
        <StatCard icon={CheckCircle} label="Completed" value="-" />
        <StatCard icon={Leaf} label="Recycling Rate" value="85%" />
      </div>

      <Routes>
        <Route path="" element={<IntakeWorkflow />} />
        <Route path="processing" element={<ProcessingView />} />
        <Route path="impact" element={<ImpactReportsView />} />
      </Routes>
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

function ProcessingView() {
  const [processing, setProcessing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcessing = async () => {
      try {
        const data = await recyclingService.list().catch(() => ({ data: [] }));
        setProcessing(data.data || []);
      } catch (error) {
        console.error('Failed to load processing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProcessing();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Material Processing</h2>
      {processing.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No materials currently in processing</p>
          <p className="text-sm text-gray-400 mt-2">Received materials will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processing.map((item) => (
            <div key={item.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">Lot: {item.lot_id}</h3>
                <span className="badge badge-warning">{item.status}</span>
              </div>
              <p className="text-xs text-gray-500">Process: {item.process_type}</p>
              <p className="text-xs text-gray-400 mt-2">Weight: {item.weight}kg</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImpactReportsView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await recyclingService.list().catch(() => ({ data: [] }));
        setReports(data.data || []);
      } catch (error) {
        console.error('Failed to load reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Environmental Impact Reports</h2>
      <div className="card">
        <h3 className="font-medium mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">2,450 kg</p>
            <p className="text-sm text-gray-600">CO2e Saved</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">850 kg</p>
            <p className="text-sm text-gray-600">Materials Recovered</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">92%</p>
            <p className="text-sm text-gray-600">Recovery Rate</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">15</p>
            <p className="text-sm text-gray-600">Batches Processed</p>
          </div>
        </div>
      </div>
      <div className="card text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Detailed impact reports will be generated here</p>
      </div>
    </div>
  );
}

