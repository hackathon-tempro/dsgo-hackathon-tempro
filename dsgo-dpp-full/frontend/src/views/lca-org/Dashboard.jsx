import React, { useState, useEffect } from 'react';
import { Layout } from '../shared/Layout';
import { Leaf, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { lcaService } from '../../services/api';

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
    <Layout title="LCA Organisation Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileText} label="Active Projects" value={projects.length} />
        <StatCard icon={Leaf} label="Completed LCAs" value="-" />
        <StatCard icon={CheckCircle} label="Credentials Issued" value="-" />
      </div>
      <LCAWorkspace projects={projects} onUpdate={loadProjects} />
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
        carbonFootprint: parseFloat(formData.carbonFootprint),
        waterFootprint: parseFloat(formData.waterFootprint) || 0,
        wasteGenerated: parseFloat(formData.wasteGenerated) || 0,
        renewableEnergyPercentage: parseFloat(formData.renewableEnergyPercentage) || 0,
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
            <p className="text-gray-500 text-center py-8">No pending projects</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{project.methodology}</p>
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

export default Dashboard;
