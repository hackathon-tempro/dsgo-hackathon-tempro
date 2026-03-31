import { useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Building2, CheckCircle, Clock3, FileCheck, FileText, Package, ShieldCheck } from "lucide-react";
import { Layout } from "../shared/Layout";
import {
  getBuildingOwnerPackage,
  getFlowEvents,
  useFlowSnapshot,
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
    const fireSafety = payload.fireSafetyClass || payload.fireResistanceClass;
    return fireSafety
      ? `CE Marking · Fire safety ${fireSafety} · ${payload.standard}`
      : `CE Marking · ${payload.standard} · ${payload.certId}`;
  }

  if (credential.type === "EnvironmentalFootprintTestPassport") {
    return `LCA · Carbon emissions ${(payload.carbonEmissions ?? payload.carbonFootprint)} kg CO2e · ${payload.methodology}`;
  }

  if (credential.type === "MaterialPassport") {
    return `MaterialPassport · ${payload.productName} · Lot ${payload.lotId}`;
  }

  return credential.type;
}

function renderCredentialDetails(credential) {
  const payload = credential.payload || {};

  if (credential.type === "MaterialPassport") {
    return [
      `Product: ${payload.productName}`,
      `Product ID: ${payload.productId}`,
      `Lot ID: ${payload.lotId}`,
      `Batch: ${payload.batchNumber}`,
      `Recycled content: ${payload.recycledContent}%`,
      `Carbon footprint: ${payload.carbonFootprint} kg CO2e`,
    ].filter(Boolean);
  }

  if (credential.type === "EnvironmentalFootprintTestPassport") {
    return [
      `Methodology: ${payload.methodology}`,
      `Carbon emissions: ${payload.carbonEmissions ?? payload.carbonFootprint} kg CO2e`,
      `Water footprint: ${payload.waterFootprint}`,
      `Waste generated: ${payload.wasteGenerated}`,
      `Renewable energy: ${payload.renewableEnergyPercentage}%`,
    ].filter(Boolean);
  }

  if (credential.type === "CEMArkingTestREport") {
    return [
      `Certificate type: ${payload.certificateType}`,
      `Certificate ID: ${payload.certId}`,
      `Standard: ${payload.standard}`,
      `Fire safety class: ${payload.fireSafetyClass || payload.fireResistanceClass}`,
      `Product: ${payload.productName}`,
    ].filter(Boolean);
  }

  if (credential.type === "AssetHandoverCredential") {
    return [
      `Asset ID: ${payload.assetId}`,
      `Asset Name: ${payload.assetName}`,
      `Product ID: ${payload.productId}`,
      `Linked credentials: ${(payload.linkedCredentialIds || []).length}`,
    ].filter(Boolean);
  }

  return [renderCredentialSummary(credential)];
}

function ReceivedAssetsView() {
  useFlowSnapshot();
  const pkg = getBuildingOwnerPackage();
  const assets = useMemo(
    () =>
      pkg
        ? [{
            id: pkg.asset.id,
            title: pkg.asset.productName,
            productId: pkg.asset.productId,
            linkedCredentials: pkg.linkedCredentials,
            handover: pkg.handover,
            asset: pkg.asset,
          }]
        : [],
    [pkg],
  );
  const [selectedAssetId, setSelectedAssetId] = useState(pkg?.asset?.id || null);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || assets[0] || null;
  const verificationChecks = [
    { label: "Transfer Credential", ok: !!selectedAsset?.handover },
    { label: "Issuer Present", ok: !!selectedAsset?.handover?.issuerOrg },
    { label: "DPP Completeness", ok: (selectedAsset?.linkedCredentials?.length || 0) > 0 },
  ];

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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-4 space-y-4">
        <div className="card">
          <h3 className="font-semibold">Received Assets</h3>
          <p className="text-xs text-gray-500 mt-1">Click an asset to open full DPP details.</p>
          <div className="mt-4 space-y-2">
            {assets.map((asset) => {
              const active = asset.id === selectedAssetId;
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    active ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{asset.title}</p>
                  <p className="text-xs text-gray-500 mt-1">Asset ID: {asset.id}</p>
                  <p className="text-xs text-gray-500">Product ID: {asset.productId}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card border border-indigo-200 bg-indigo-50">
          <h3 className="font-semibold text-indigo-900">Verification Dashboard</h3>
          <div className="mt-3 space-y-2">
            {verificationChecks.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-indigo-800">{item.label}</span>
                <span className={`badge ${item.ok ? "badge-success" : "badge-warning"}`}>
                  {item.ok ? "OK" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="xl:col-span-8 space-y-4">
        <div className="card border border-indigo-200 bg-indigo-50">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="font-semibold text-indigo-900">{selectedAsset.asset.productName}</p>
              <p className="text-xs text-indigo-700">
                Asset ID: {selectedAsset.asset.id} · Product ID: {selectedAsset.asset.productId} · GTIN: {selectedAsset.asset.gtin}
              </p>
            </div>
          </div>
          <p className="text-xs text-indigo-700 mt-3">
            Construction handover: <span className="font-mono break-all">{selectedAsset.handover.id}</span>
          </p>
          <p className="text-xs text-indigo-700 mt-1">
            Ownership timeline: manufacturer -&gt; construction company -&gt; building owner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedAsset.linkedCredentials.map((credential) => {
            const verified = true;
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
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                  {renderCredentialDetails(credential).map((line) => (
                    <div key={`${credential.id}-${line}`}>{line}</div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-400">{renderCredentialSummary(credential)}</p>
                <p className="mt-2 text-xs text-gray-400 font-mono break-all">{credential.id}</p>
              </div>
            );
          })}
        </div>
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

  const verified = pkg.linkedCredentials.length;

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
  const verifiedCount = pkg ? pkg.linkedCredentials.length : 0;

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
