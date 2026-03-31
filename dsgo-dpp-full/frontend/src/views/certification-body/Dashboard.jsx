import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { CheckCircle, FileText, Flame } from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../shared/Layout";
import { useAuth } from "../../context/AuthContext";
import { getAsset, issueFlowCredential, useFlowSnapshot } from "../../demo/sequentialFlow";

const navItems = [
  { label: "Assessment", path: "/certification-body" },
  { label: "Issued Credential", path: "/certification-body/credentials" },
];

function AssessmentWorkspace() {
  const { user } = useAuth();
  useFlowSnapshot();
  const asset = getAsset();
  const [issuedCredential, setIssuedCredential] = useState(null);
  const [formData, setFormData] = useState({
    standard: "EN 13501-1",
    fireResistanceClass: "EI60",
    testScope: "A1–A3 product lifecycle",
    validityYears: "5",
  });

  const handleIssue = async (event) => {
    event.preventDefault();

    const credential = issueFlowCredential({
      type: "FireSafetyCredential",
      issuerRole: "certification_body",
      issuerOrg: user?.org || "SKG-IKOB",
      recipientRole: "manufacturer",
      recipientOrg: "Alkondor",
      payload: {
        productId: asset.productId,
        productName: asset.productName,
        standard: formData.standard,
        fireResistanceClass: formData.fireResistanceClass,
        testScope: formData.testScope,
        validityYears: parseInt(formData.validityYears),
      },
    });

    setIssuedCredential(credential);
    toast.success("FireSafetyCredential issued to Manufacturer");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card border border-orange-200 bg-orange-50">
        <h2 className="text-lg font-semibold text-orange-900">Current Asset</h2>
        <div className="mt-3 text-sm text-orange-800 space-y-1">
          <div>Product: <span className="font-medium">{asset.productName}</span></div>
          <div>Product ID: <span className="font-mono">{asset.productId}</span></div>
          <div>Asset ID: <span className="font-mono">{asset.id}</span></div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Issue FireSafetyCredential</h2>
        <form onSubmit={handleIssue} className="mt-4 space-y-4">
          <div>
            <label className="label">Standard</label>
            <input
              className="input"
              value={formData.standard}
              onChange={(event) => setFormData({ ...formData, standard: event.target.value })}
            />
          </div>
          <div>
            <label className="label">Fire Resistance Class</label>
            <input
              className="input"
              value={formData.fireResistanceClass}
              onChange={(event) => setFormData({ ...formData, fireResistanceClass: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Test Scope</label>
              <input
                className="input"
                value={formData.testScope}
                onChange={(event) => setFormData({ ...formData, testScope: event.target.value })}
              />
            </div>
            <div>
              <label className="label">Validity (years)</label>
              <input
                className="input"
                type="number"
                value={formData.validityYears}
                onChange={(event) => setFormData({ ...formData, validityYears: event.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Issue Credential
          </button>
        </form>
      </div>

      {issuedCredential && (
        <div className="card lg:col-span-2 border border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Credential issued</span>
          </div>
          <p className="text-xs text-orange-700 mt-3 font-mono break-all">{issuedCredential.id}</p>
        </div>
      )}
    </div>
  );
}

function IssuedCredentialView() {
  const { credentials } = useFlowSnapshot();
  const credential = credentials.find(
    (item) =>
      item.type === "FireSafetyCredential" &&
      item.issuerRole === "certification_body" &&
      item.recipientRole === "manufacturer",
  );

  if (!credential) {
    return (
      <div className="card text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No FireSafetyCredential issued yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Issued FireSafetyCredential</h2>
      <div className="mt-4 text-sm text-gray-700 space-y-2">
        <div>Product: <span className="font-medium">{credential.payload.productName}</span></div>
        <div>Standard: <span className="font-medium">{credential.payload.standard}</span></div>
        <div>Fire Resistance Class: <span className="font-medium">{credential.payload.fireResistanceClass}</span></div>
      </div>
      <p className="text-xs text-gray-400 mt-4 font-mono break-all">{credential.id}</p>
    </div>
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

export default function Dashboard() {
  const { credentials } = useFlowSnapshot();
  const issuedCount = credentials.filter(
    (item) =>
      item.type === "FireSafetyCredential" &&
      item.issuerRole === "certification_body" &&
      item.recipientRole === "manufacturer",
  ).length;

  return (
    <Layout title="SKG-IKOB Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Flame} label="Current Asset Flow" value="1" />
        <StatCard icon={FileText} label="Fire Safety Credentials" value={issuedCount} />
        <StatCard icon={CheckCircle} label="Ready for Manufacturer" value={issuedCount ? "Yes" : "No"} />
      </div>

      <Routes>
        <Route path="" element={<AssessmentWorkspace />} />
        <Route path="credentials" element={<IssuedCredentialView />} />
      </Routes>
    </Layout>
  );
}
