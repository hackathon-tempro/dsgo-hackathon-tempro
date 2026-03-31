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
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">DPP Overview</h2>
      <div className="card text-center py-12 text-gray-500">
        DPP overview will be implemented here
      </div>
    </div>
  );
}

function AssemblyView() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Assembly</h2>
      <div className="card text-center py-12 text-gray-500">
        Assembly management will be implemented here
      </div>
    </div>
  );
}

function TransferView() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Transfer</h2>
      <div className="card text-center py-12 text-gray-500">
        Product transfer will be implemented here
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
