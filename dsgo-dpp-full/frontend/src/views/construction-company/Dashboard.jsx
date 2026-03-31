import React, { useState } from 'react';
import { Layout } from '../shared/Layout';
import { Truck, CheckCircle, FileText, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { dppService, credentialsService, transactionsService } from '../../services/api';
import { DPPViewer } from '../../components/DPPViewer';
import { VerificationBadge } from '../../components/VerificationBadge';

export default function Dashboard() {
  const [selectedDpp, setSelectedDpp] = useState(null);
  const [credentials, setCredentials] = useState([]);

  return (
    <Layout title="Construction Company Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Truck} label="Incoming Deliveries" value="-" />
        <StatCard icon={CheckCircle} label="Verified DPPs" value="-" />
        <StatCard icon={FileText} label="Active Contracts" value="-" />
      </div>
      <ReceivingView onSelectDpp={setSelectedDpp} />
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-teal-50 rounded-lg">
        <Icon className="w-6 h-6 text-teal-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ReceivingView({ onSelectDpp }) {
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerifyDpp = async (dppId) => {
    try {
      const result = await credentialsService.verify(dppId);
      setVerificationResult(result.data);
      toast.success('DPP verification completed');
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Incoming Deliveries & DPP Verification</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium mb-4">Available DPPs</h3>
          <div className="space-y-3">
            <DppCard
              name="Aluminium Facade Panel"
              id="DPP-001"
              onVerify={() => handleVerifyDpp('DPP-001')}
            />
            <DppCard
              name="Steel Reinforcement Bar"
              id="DPP-002"
              onVerify={() => handleVerifyDpp('DPP-002')}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium mb-4">Verification Result</h3>
          {verificationResult ? (
            <div className="space-y-4">
              <VerificationBadge verified={verificationResult.verified} size="lg" />
              <div className="space-y-2">
                <CheckItem label="Signature Valid" passed={verificationResult.verified} />
                <CheckItem label="Issuer Trusted" passed={verificationResult.verified} />
                <CheckItem label="DPP Complete" passed={verificationResult.verified} />
              </div>
              <button className="btn btn-success w-full">Accept Delivery</button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Select a DPP and click Verify
            </p>
          )}
        </div>
      </div>

      <HandoverSection />
    </div>
  );
}

function DppCard({ name, id, onVerify }) {
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-gray-500 font-mono">{id}</p>
        </div>
        <button onClick={onVerify} className="btn btn-outline text-xs py-1">
          Verify DPP
        </button>
      </div>
    </div>
  );
}

function CheckItem({ label, passed }) {
  return (
    <div className={`flex items-center gap-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
      {passed ? <CheckCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function HandoverSection() {
  const [submitting, setSubmitting] = useState(false);

  const handleHandover = async () => {
    setSubmitting(true);
    try {
      await credentialsService.issueHandover({
        handoverId: `HO-${Date.now()}`,
        assetId: 'ASSET-001',
        handoverData: {
          includedDPPs: ['DPP-001', 'DPP-002'],
        },
        from: 'Construction Co',
        to: 'Building Owner',
        handoverDate: new Date().toISOString(),
      });
      toast.success('Handover credential issued!');
    } catch (error) {
      toast.error('Failed to create handover');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-medium mb-4">Project Handover to Building Owner</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Send building with all associated DPPs to the building owner
        </p>
        <button onClick={handleHandover} disabled={submitting} className="btn btn-primary">
          {submitting ? 'Processing...' : 'Send to Building Owner'}
        </button>
      </div>
    </div>
  );
}

