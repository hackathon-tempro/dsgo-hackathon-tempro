import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../shared/Layout';
import { Wrench, ClipboardList, CheckCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { repairsService, credentialsService, dppService } from '../../services/api';

const navItems = [
  { label: "Active Repairs", path: "/maintenance-company" },
  { label: "Completed", path: "/maintenance-company/completed" },
  { label: "Schedule", path: "/maintenance-company/schedule" },
];

export default function Dashboard() {
  return (
    <Layout title="Maintenance Company Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Wrench} label="Active Repairs" value="-" />
        <StatCard icon={ClipboardList} label="Completed" value="-" />
        <StatCard icon={CheckCircle} label="Credentials Issued" value="-" />
      </div>

      <Routes>
        <Route path="" element={<RepairWorkflow />} />
        <Route path="completed" element={<CompletedView />} />
        <Route path="schedule" element={<ScheduleView />} />
      </Routes>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-pink-50 rounded-lg">
        <Icon className="w-6 h-6 text-pink-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function RepairWorkflow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dppId: '',
    repairType: 'welding',
    description: '',
    repairDate: new Date().toISOString().split('T')[0],
    repairedBy: '',
    parts: [],
    cost: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const repair = await repairsService.create({
        dppId: formData.dppId,
        repairType: formData.repairType,
        description: formData.description,
        repairDate: formData.repairDate,
        repairedBy: formData.repairedBy,
        parts: formData.parts,
        cost: parseFloat(formData.cost) || 0,
      });

      await credentialsService.issueRepair({
        repairId: repair.data.repair_id,
        dppId: formData.dppId,
        repairData: {
          repairType: formData.repairType,
          description: formData.description,
          structuralIntegrity: 'restored',
          lifecycleStatus: 'repaired',
        },
      });

      toast.success('Repair recorded and credential issued!');
      setStep(3);
    } catch (error) {
      toast.error('Failed to record repair');
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
          <h3 className="font-medium mb-4">Step 1: Enter Repair Details</h3>
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
            <div>
              <label className="label">DPP/Product ID</label>
              <input
                type="text"
                className="input"
                value={formData.dppId}
                onChange={(e) => setFormData({ ...formData, dppId: e.target.value })}
                placeholder="Enter product ID to scan"
                required
              />
            </div>
            <div>
              <label className="label">Repair Type</label>
              <select
                className="input"
                value={formData.repairType}
                onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
              >
                <option value="welding">Welding</option>
                <option value="replacement">Component Replacement</option>
                <option value="refurbishment">Refurbishment</option>
                <option value="structural">Structural Repair</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Continue to Preview
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="card max-w-2xl">
          <h3 className="font-medium mb-4">Step 2: Review & Confirm</h3>
          <div className="space-y-3 mb-6">
            <DetailRow label="Product ID" value={formData.dppId} />
            <DetailRow label="Repair Type" value={formData.repairType} />
            <DetailRow label="Description" value={formData.description} />
            <DetailRow label="Date" value={formData.repairDate} />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            A RepairCredential will be issued and appended to the DPP (append-only, original data preserved).
          </p>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn btn-outline flex-1">
              Back
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? 'Issuing...' : 'Issue RepairCredential'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card max-w-2xl text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Repair Recorded Successfully!</h3>
          <p className="text-gray-600 mb-4">
            RepairCredential has been issued and appended to the DPP.
          </p>
          <button onClick={() => setStep(1)} className="btn btn-primary">
            New Repair
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

function CompletedView() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const data = await repairsService.list().catch(() => ({ data: [] }));
        setRepairs(data.data || []);
      } catch (error) {
        console.error('Failed to load repairs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Completed Repairs</h2>
      {repairs.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No completed repairs yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repairs.map((repair) => (
            <div key={repair.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{repair.repair_type}</h3>
                <span className="badge badge-success">Completed</span>
              </div>
              <p className="text-xs text-gray-500">DPP: {repair.dpp_id}</p>
              <p className="text-xs text-gray-400 mt-2">{repair.repair_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleView() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await repairsService.list().catch(() => ({ data: [] }));
        setSchedule(data.data || []);
      } catch (error) {
        console.error('Failed to load schedule:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Maintenance Schedule</h2>
      {schedule.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No scheduled maintenance</p>
          <p className="text-sm text-gray-400 mt-2">Repairs will appear here when scheduled</p>
        </div>
      ) : (
        <div className="card">
          <div className="space-y-3">
            {schedule.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.repair_type}</p>
                  <p className="text-xs text-gray-500">DPP: {item.dpp_id}</p>
                </div>
                <span className="badge badge-warning">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

