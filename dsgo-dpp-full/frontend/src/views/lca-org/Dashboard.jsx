import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { CheckCircle, FileText, Leaf } from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../shared/Layout";
import { useAuth } from "../../context/AuthContext";
import { getAsset, issueFlowCredential, useFlowSnapshot } from "../../demo/sequentialFlow";

const navItems = [
  { label: "Assessment", path: "/lca-org" },
  { label: "Issued Credential", path: "/lca-org/credentials" },
];

function AssessmentWorkspace() {
  const { user } = useAuth();
  useFlowSnapshot();
  const asset = getAsset();
  const [issuedCredential, setIssuedCredential] = useState(null);
  const [formData, setFormData] = useState({
    methodology: "EN 15804+A2",
    carbonFootprint: "2840",
    waterFootprint: "50",
    wasteGenerated: "10",
    renewableEnergyPercentage: "30",
  });

  const handleIssue = async (event) => {
    event.preventDefault();

    const credential = issueFlowCredential({
      type: "EnvironmentalFootprintTestPassport",
      issuerRole: "lca_org",
      issuerOrg: user?.org || "LCA Organisation",
      recipientRole: "manufacturer",
      recipientOrg: "BuildCorp Manufacturers",
      payload: {
        productId: asset.productId,
        productName: asset.productName,
        methodology: formData.methodology,
        carbonFootprint: parseFloat(formData.carbonFootprint),
        waterFootprint: parseFloat(formData.waterFootprint),
        wasteGenerated: parseFloat(formData.wasteGenerated),
        renewableEnergyPercentage: parseFloat(formData.renewableEnergyPercentage),
      },
    });

    setIssuedCredential(credential);
    toast.success("EnvironmentalFootprintTestPassport issued to Manufacturer");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card border border-green-200 bg-green-50">
        <h2 className="text-lg font-semibold text-green-900">Current Asset</h2>
        <div className="mt-3 text-sm text-green-800 space-y-1">
          <div>Product: <span className="font-medium">{asset.productName}</span></div>
          <div>Product ID: <span className="font-mono">{asset.productId}</span></div>
          <div>Asset ID: <span className="font-mono">{asset.id}</span></div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Issue EnvironmentalFootprintTestPassport</h2>
        <form onSubmit={handleIssue} className="mt-4 space-y-4">
          <div>
            <label className="label">Methodology</label>
            <input
              className="input"
              value={formData.methodology}
              onChange={(event) => setFormData({ ...formData, methodology: event.target.value })}
            />
          </div>
          <div>
            <label className="label">Carbon Footprint (kg CO2e)</label>
            <input
              className="input"
              type="number"
              value={formData.carbonFootprint}
              onChange={(event) => setFormData({ ...formData, carbonFootprint: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Water Footprint</label>
              <input
                className="input"
                type="number"
                value={formData.waterFootprint}
                onChange={(event) => setFormData({ ...formData, waterFootprint: event.target.value })}
              />
            </div>
            <div>
              <label className="label">Waste Generated</label>
              <input
                className="input"
                type="number"
                value={formData.wasteGenerated}
                onChange={(event) => setFormData({ ...formData, wasteGenerated: event.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Issue Credential
          </button>
        </form>
      </div>

      {issuedCredential && (
        <div className="card lg:col-span-2 border border-green-200 bg-green-50">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Credential issued</span>
          </div>
          <p className="text-xs text-green-700 mt-3 font-mono break-all">{issuedCredential.id}</p>
        </div>
      )}
    </div>
  );
}

function IssuedCredentialView() {
  const { credentials } = useFlowSnapshot();
  const credential = credentials.find(
    (item) =>
      item.type === "EnvironmentalFootprintTestPassport" &&
      item.issuerRole === "lca_org" &&
      item.recipientRole === "manufacturer",
  );

  if (!credential) {
    return (
      <div className="card text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No EnvironmentalFootprintTestPassport issued yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Issued EnvironmentalFootprintTestPassport</h2>
      <div className="mt-4 text-sm text-gray-700 space-y-2">
        <div>Product: <span className="font-medium">{credential.payload.productName}</span></div>
        <div>Methodology: <span className="font-medium">{credential.payload.methodology}</span></div>
        <div>Carbon footprint: <span className="font-medium">{credential.payload.carbonFootprint} kg CO2e</span></div>
      </div>
      <p className="text-xs text-gray-400 mt-4 font-mono break-all">{credential.id}</p>
    </div>
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

export default function Dashboard() {
  const { credentials } = useFlowSnapshot();
  const issuedCount = credentials.filter(
    (item) =>
      item.type === "EnvironmentalFootprintTestPassport" &&
      item.issuerRole === "lca_org" &&
      item.recipientRole === "manufacturer",
  ).length;

  return (
    <Layout title="LCA Organisation Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Leaf} label="Current Asset Flow" value="1" />
        <StatCard icon={FileText} label="Environmental Credentials" value={issuedCount} />
        <StatCard icon={CheckCircle} label="Ready for Manufacturer" value={issuedCount ? "Yes" : "No"} />
      </div>

      <Routes>
        <Route path="" element={<AssessmentWorkspace />} />
        <Route path="credentials" element={<IssuedCredentialView />} />
      </Routes>
    </Layout>
  );
}
