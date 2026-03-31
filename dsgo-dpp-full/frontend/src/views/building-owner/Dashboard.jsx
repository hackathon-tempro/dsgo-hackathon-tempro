import { Routes, Route } from "react-router-dom";
import { Building2, CheckCircle, Clock3, FileCheck, FileText, Package, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../shared/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  getBuildingOwnerPackage,
  getFlowEvents,
  hasRoleVerified,
  useFlowSnapshot,
  verifyCredential,
} from "../../demo/sequentialFlow";

const navItems = [
  { label: "Received Assets", path: "/building-owner" },
  { label: "Credential Verification", path: "/building-owner/verification" },
];

function renderCredentialSummary(credential) {
  const payload = credential.payload || {};

  if (credential.type === "TestReport") {
    return payload.fireRating
      ? `TestReport · ${payload.standard} · ${payload.fireRating}`
      : `TestReport · ${payload.standard}`;
  }

  if (credential.type === "CEMArkingTestREport") {
    return `CE Marking · ${payload.standard} · ${payload.certId}`;
  }

  if (credential.type === "EnvironmentalFootprintTestPassport") {
    return `LCA · ${payload.methodology} · ${payload.carbonFootprint} kg CO2e`;
  }

  if (credential.type === "MaterialPassport") {
    return `MaterialPassport · ${payload.productName} · Lot ${payload.lotId}`;
  }

  return credential.type;
}

function ReceivedAssetsView() {
  const { user } = useAuth();
  useFlowSnapshot();
  const pkg = getBuildingOwnerPackage();

  const handleVerify = (credential) => {
    const result = verifyCredential(credential.id, "building_owner", user?.org || "Building Owner");
    if (!result.ok) {
      toast.error(result.reason || "Verification failed");
      return;
    }
    toast.success(`${credential.type} verified by Building Owner`);
  };

  if (!pkg) {
    return (
      <div className="card text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Waiting for AssetHandoverCredential from Construction Company.</p>
        <p className="text-xs text-gray-400 mt-2">
          Complete Construction Company verification and send handover to owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card border border-indigo-200 bg-indigo-50">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="font-semibold text-indigo-900">{pkg.asset.productName}</p>
            <p className="text-xs text-indigo-700">
              Asset ID: {pkg.asset.id} · Product ID: {pkg.asset.productId}
            </p>
          </div>
        </div>
        <p className="text-xs text-indigo-700 mt-3">
          Construction handover: <span className="font-mono break-all">{pkg.handover.id}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pkg.linkedCredentials.map((credential) => {
          const verified = hasRoleVerified(credential, "building_owner");

          return (
            <div key={credential.id} className="card border border-gray-200">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-sm">{credential.type}</p>
                  <p className="text-xs text-gray-500 mt-1">Issuer: {credential.issuerOrg}</p>
                </div>
                <span className={`badge ${verified ? "badge-success" : "badge-warning"}`}>
                  {verified ? "Verified" : "Pending"}
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                {renderCredentialSummary(credential)}
              </div>
              <p className="mt-3 text-xs text-gray-400 font-mono break-all">{credential.id}</p>

              <button
                disabled={verified}
                onClick={() => handleVerify(credential)}
                className="btn btn-outline text-xs mt-4 w-full disabled:opacity-50"
              >
                {verified ? "Already Verified" : "Verify"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerificationSummary() {
  useFlowSnapshot();
  const pkg = getBuildingOwnerPackage();
  const events = getFlowEvents();

  if (!pkg) {
    return (
      <div className="card text-center py-12 text-gray-500">
        <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No received asset package yet.</p>
      </div>
    );
  }

  const verified = pkg.linkedCredentials.filter((credential) =>
    hasRoleVerified(credential, "building_owner"),
  ).length;

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold">Owner Verification Summary</h3>
        <p className="text-sm text-gray-600 mt-2">
          Verified {verified} of {pkg.linkedCredentials.length} linked credentials.
        </p>
        <div className="mt-4">
          <span className={`badge ${verified === pkg.linkedCredentials.length ? "badge-success" : "badge-warning"}`}>
            {verified === pkg.linkedCredentials.length ? "All linked credentials verified" : "Verification still pending"}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold">Flow History</h3>
        </div>
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-gray-200 p-3 text-xs text-gray-600">
              <div className="font-medium text-gray-900">{event.credentialType}</div>
              <div className="mt-1">
                {event.kind === "issued"
                  ? `Issued by ${event.issuerOrg} to ${event.recipientOrg}`
                  : `Verified by ${event.verifierOrg}`}
              </div>
              <div className="text-gray-400 mt-1">{new Date(event.at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-indigo-50 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  useFlowSnapshot();
  const pkg = getBuildingOwnerPackage();
  const verifiedCount = pkg
    ? pkg.linkedCredentials.filter((credential) =>
        hasRoleVerified(credential, "building_owner"),
      ).length
    : 0;

  return (
    <Layout title="Building Owner Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Assets Received" value={pkg ? 1 : 0} />
        <StatCard icon={Package} label="Linked Credentials" value={pkg ? pkg.linkedCredentials.length : 0} />
        <StatCard icon={ShieldCheck} label="Owner Verified" value={verifiedCount} />
        <StatCard icon={CheckCircle} label="All Verified" value={pkg && verifiedCount === pkg.linkedCredentials.length ? "Yes" : "No"} />
      </div>

      <Routes>
        <Route path="" element={<ReceivedAssetsView />} />
        <Route path="verification" element={<VerificationSummary />} />
      </Routes>
    </Layout>
  );
}
