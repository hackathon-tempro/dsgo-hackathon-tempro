import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../shared/Layout';
import { Leaf, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { lcaService } from '../../services/api';

const navItems = [
  { label: "Projects", path: "/lca-org" },
  { label: "Completed", path: "/lca-org/completed" },
  { label: "Credentials", path: "/lca-org/credentials" },
];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await lcaService.getPending().catch(() => ({ data: [] }));
      setProjects(data.data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="LCA Organisation Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileText} label="Active Projects" value={projects.length} />
        <StatCard icon={Leaf} label="Completed LCAs" value="-" />
        <StatCard icon={CheckCircle} label="Credentials Issued" value="-" />
      </div>

      <Routes>
        <Route path="" element={<LCAWorkspace projects={projects} onUpdate={loadProjects} />} />
        <Route path="completed" element={<CompletedView />} />
        <Route path="credentials" element={<CredentialsView />} />
      </Routes>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-green-50 rounded-lg">
        <Icon className="w-6 h-6 text-green-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function LCAWorkspace({ projects, onUpdate }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    dppId: '',
    methodology: 'ISO-14044',
    carbonFootprint: '',
    waterFootprint: '',
    wasteGenerated: '',
    renewableEnergyPercentage: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await lcaService.createProject(formData);
      toast.success('LCA project created');
      setSelectedProject(null);
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResults = async (projectId) => {
    try {
      await lcaService.submitResults({
        projectId,
        carbonFootprint: parseFloat(formData.carbonFootprint) || 100,
        waterFootprint: parseFloat(formData.waterFootprint) || 50,
        wasteGenerated: parseFloat(formData.wasteGenerated) || 10,
        renewableEnergyPercentage: parseFloat(formData.renewableEnergyPercentage) || 30,
        assessmentDate: new Date().toISOString(),
      });
      toast.success('LCA results submitted');
    } catch (error) {
      toast.error('Failed to submit results');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">LCA Workspace</h2>
        <button onClick={() => setSelectedProject('new')} className="btn btn-primary">
          New LCA Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium mb-4">Pending LCA Projects</h3>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No pending projects</p>
              <button onClick={() => setSelectedProject('new')} className="btn btn-outline">
                Create First Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{project.methodology || 'ISO-14044'}</p>
                      <p className="text-xs text-gray-500">DPP: {project.dpp_id}</p>
                    </div>
                    <button
                      onClick={() => handleSubmitResults(project.id)}
                      className="btn btn-success text-xs py-1"
                    >
                      Submit Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(selectedProject === 'new' || selectedProject) && (
          <div className="card">
            <h3 className="font-medium mb-4">Create LCA Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="label">DPP ID</label>
                <input
                  type="text"
                  className="input"
                  value={formData.dppId}
                  onChange={(e) => setFormData({ ...formData, dppId: e.target.value })}
                  placeholder="DPP-001"
                  required
                />
              </div>
              <div>
                <label className="label">Methodology</label>
                <select
                  className="input"
                  value={formData.methodology}
                  onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                >
                  <option value="ISO-14040">ISO 14040</option>
                  <option value="ISO-14044">ISO 14044</option>
                  <option value="PEF">Product Environmental Footprint</option>
                  <option value="EPD">Environmental Product Declaration</option>
                </select>
              </div>
              <div>
                <label className="label">Carbon Footprint (kg CO2e)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.carbonFootprint}
                  onChange={(e) => setFormData({ ...formData, carbonFootprint: e.target.value })}
                  placeholder="100"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function CompletedView() {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        const data = await lcaService.getCompleted().catch(() => ({ data: [] }));
        setCompleted(data.data || []);
      } catch (error) {
        console.error('Failed to load completed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Completed LCA Studies</h2>
      {completed.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No completed LCA studies yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.map((item) => (
            <div key={item.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">LCA Study</h3>
                <span className="badge badge-success">Completed</span>
              </div>
              <p className="text-sm text-gray-500">DPP: {item.dpp_id}</p>
              <p className="text-xs text-gray-400 mt-2">{item.completed_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CredentialsView() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const data = await lcaService.getCredentials?.().catch(() => ({ data: [] })) || {};
        const allCreds = await fetch('/api/v1/credentials').then(r => r.json()).catch(() => ({ data: [] }));
        setCredentials(allCreds.data?.filter(c => c.type?.includes('LCA') || c.type?.includes('Environmental')) || []);
      } catch (error) {
        console.error('Failed to load credentials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCredentials();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Issued LCA Credentials</h2>
      {credentials.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No credentials issued yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => (
            <div key={cred.id} className="card">
              <h3 className="font-medium mb-2">{cred.type}</h3>
              <p className="text-xs text-gray-500 font-mono">{cred.credential_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

