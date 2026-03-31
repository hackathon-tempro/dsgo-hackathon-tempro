import React, { useState, useEffect } from 'react';
import { Layout } from '../shared/Layout';
import { Shield, FileCheck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { certificationsService, credentialsService } from '../../services/api';

export default function Dashboard() {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const data = await certificationsService.getPending().catch(() => ({ data: [] }));
      setPendingCerts(data.data || []);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Certification Body Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileCheck} label="Pending Review" value={pendingCerts.length} />
        <StatCard icon={CheckCircle} label="Issued" value="-" />
        <StatCard icon={Shield} label="Active Certificates" value="-" />
      </div>
      <ReviewQueue pendingCerts={pendingCerts} onUpdate={loadPending} />
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-orange-50 rounded-lg">
        <Icon className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ReviewQueue({ pendingCerts, onUpdate }) {
  const [selectedCert, setSelectedCert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async (cert) => {
    setSubmitting(true);
    try {
      await certificationsService.approve(cert.id, {
        dppId: cert.dpp_id,
        certificateType: 'ProductCertificate',
        issuer: cert.issuer,
        issueDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await credentialsService.issueCertificate({
        certificateId: `CERT-${Date.now()}`,
        dppId: cert.dpp_id,
        certificationData: {
          lcaApproved: true,
          carbonFootprintKgCO2e: 84.6,
        },
      });
      toast.success('Certificate issued successfully!');
      setSelectedCert(null);
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to issue certificate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">LCA Review Queue</h2>
      
      {pendingCerts.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No pending certifications to review
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {pendingCerts.map((cert) => (
              <div
                key={cert.id}
                className="card cursor-pointer hover:border-primary-300"
                onClick={() => setSelectedCert(cert)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{cert.certificate_type || 'ProductCertificate'}</p>
                    <p className="text-xs text-gray-500">DPP: {cert.dpp_id}</p>
                  </div>
                  <span className="badge badge-warning">Pending</span>
                </div>
              </div>
            ))}
          </div>

          {selectedCert && (
            <div className="card">
              <h3 className="font-medium mb-4">Certificate Preview</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Certificate Type:</span>
                  <p className="font-medium">{selectedCert.certificate_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">DPP ID:</span>
                  <p className="font-mono">{selectedCert.dpp_id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Applicant:</span>
                  <p>{selectedCert.issuer}</p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => handleApprove(selectedCert)}
                  disabled={submitting}
                  className="btn btn-success w-full"
                >
                  {submitting ? 'Issuing...' : 'Approve & Issue Certificate'}
                </button>
                <button className="btn btn-outline w-full">Reject</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

