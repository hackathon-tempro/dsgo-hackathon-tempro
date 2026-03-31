import { Routes, Route, Link } from "react-router-dom";
import { CheckCircle, FileUp, Package, ShieldCheck, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../shared/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  canManufacturerHandover,
  getDownstreamLinkedTypes,
  getRequiredManufacturerTypes,
  issueFlowCredential,
  useFlowSnapshot,
} from "../../demo/sequentialFlow";

const navItems = [
  { label: "Incoming Credentials", path: "/manufacturer" },
  { label: "Asset Handover", path: "/manufacturer/handover" },
];

function roleLabel(role) {
  if (role === "supplier") return "Supplier";
  if (role === "lca_org") return "LCA";
  if (role === "test_lab") return "Test Lab";
  if (role === "certification_body") return "SKG IKOB";
  return role;
}

function renderCredentialPayload(credential) {
  const payload = credential.payload || {};

  if (credential.type === "MaterialPassport") {
    return (
      <div className="text-xs text-gray-600 space-y-1">
        <div>Product: <span className="font-medium">{payload.productName}</span></div>
        <div>Lot ID: <span className="font-mono">{payload.lotId}</span></div>
        <div>Batch: <span className="font-mono">{payload.batchNumber}</span></div>
        <div>Recycled content: <span className="font-medium">{payload.recycledContent}%</span></div>
        <div>CO2 footprint: <span className="font-medium">{payload.carbonFootprint} kg CO2e</span></div>
      </div>
    );
  }

  if (credential.type === "EnvironmentalFootprintTestPassport") {
    return (
      <div className="text-xs text-gray-600 space-y-1">
        <div>Methodology: <span className="font-medium">{payload.methodology}</span></div>
        <div>Carbon footprint: <span className="font-medium">{payload.carbonFootprint} kg CO2e</span></div>
        <div>Water footprint: <span className="font-medium">{payload.waterFootprint}</span></div>
      </div>
    );
  }

  if (credential.type === "TestReport") {
    return (
      <div className="text-xs text-gray-600 space-y-1">
        <div>Test type: <span className="font-medium">{payload.testType}</span></div>
        <div>Standard: <span className="font-medium">{payload.standard}</span></div>
        <div>Conclusion: <span className="font-medium">{payload.conclusion}</span></div>
        {payload.fireRating && <div>Fire rating: <span className="font-medium">{payload.fireRating}</span></div>}
      </div>
    );
  }

  if (credential.type === "CEMArkingTestREport") {
    return (
      <div className="text-xs text-gray-600 space-y-1">
        <div>Certificate type: <span className="font-medium">{payload.certificateType}</span></div>
        <div>Cert ID: <span className="font-mono">{payload.certId}</span></div>
        <div>Standard: <span className="font-medium">{payload.standard}</span></div>
        {payload.fireResistanceClass && (
          <div>Fire resistance class: <span className="font-medium">{payload.fireResistanceClass}</span></div>
        )}
      </div>
    );
  }

  return null;
}

function IncomingCredentials() {
  const { asset, credentials } = useFlowSnapshot();
  const requiredTypes = getRequiredManufacturerTypes();
  const incomingCredentials = credentials.filter(
    (credential) =>
      credential.recipientRole === "manufacturer" && requiredTypes.includes(credential.type),
  );

  return (
    <div className="space-y-6">
      <div className="card border border-primary-200 bg-primary-50">
        <h3 className="text-sm font-semibold text-primary-900">Next Action</h3>
        <p className="text-xs text-primary-800 mt-1">
          After verifying all incoming credentials, issue the AssetHandoverCredential to Construction Company.
        </p>
        <Link to="/manufacturer/handover" className="btn btn-primary text-xs mt-3 inline-flex">
          Go To Handover Screen
        </Link>
      </div>

      <div className="card border border-primary-200 bg-primary-50">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-primary-600" />
          <div>
            <p className="font-semibold text-primary-900">{asset.productName}</p>
            <p className="text-xs text-primary-700">
              Asset ID: {asset.id} · Product ID: {asset.productId} · GTIN: {asset.gtin}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredTypes.map((type) => {
          const credential = incomingCredentials.find((item) => item.type === type);
          const isVerified = !!credential;

          return (
            <div key={type} className="card border border-gray-200">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-semibold text-sm">{type}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {credential
                      ? `Issued by ${credential.issuerOrg} (${roleLabel(credential.issuerRole)})`
                      : "Waiting for this credential to be issued upstream"}
                  </p>
                </div>
                <span className={`badge ${isVerified ? "badge-success" : credential ? "badge-warning" : "badge-gray"}`}>
                  {isVerified ? "Verified" : credential ? "Received" : "Pending"}
                </span>
              </div>

              {credential ? (
                <>
                  <div className="mt-3 rounded-lg bg-gray-50 p-3">
                    {renderCredentialPayload(credential)}
                  </div>
                  <p className="mt-3 text-xs text-gray-400 font-mono break-all">{credential.id}</p>
                </>
              ) : (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                  This exact credential is not in the flow yet.
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                {credential ? "Auto-verified on issuance" : "Awaiting issuance from upstream"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssetHandover() {
  const { user } = useAuth();
  const { asset, credentials } = useFlowSnapshot();
  const requiredTypes = getRequiredManufacturerTypes();
  const downstreamTypes = getDownstreamLinkedTypes();
  const incomingCredentials = credentials.filter(
    (credential) =>
      credential.recipientRole === "manufacturer" && requiredTypes.includes(credential.type),
  );
  const manufacturerHandover = credentials.find(
    (credential) =>
      credential.type === "AssetHandoverCredential" &&
      credential.issuerRole === "manufacturer" &&
      credential.recipientRole === "construction_company",
  );

  const handleHandover = () => {
    if (!canManufacturerHandover()) {
      toast.error("Verify all incoming credentials first");
      return;
    }

    issueFlowCredential({
      type: "AssetHandoverCredential",
      issuerRole: "manufacturer",
      issuerOrg: user?.org || "Manufacturer",
      recipientRole: "construction_company",
      recipientOrg: "Constructa BV",
      payload: {
        assetId: asset.id,
        assetName: asset.productName,
        productId: asset.productId,
        linkedCredentialIds: incomingCredentials
          .filter((credential) => downstreamTypes.includes(credential.type))
          .map((credential) => credential.id),
      },
    });

    toast.success("AssetHandoverCredential sent to Construction Company");
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold">Manufacturer -&gt; Construction Company</h2>
        <p className="text-sm text-gray-600 mt-2">
          Send the asset product with the exact linked credentials that were received here.
        </p>
        <button
          disabled={!canManufacturerHandover()}
          onClick={handleHandover}
          className="btn btn-primary mt-4 disabled:opacity-50"
        >
          Issue AssetHandoverCredential
        </button>
      </div>

      {manufacturerHandover && (
        <div className="card border border-green-200 bg-green-50">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Current handover in flow</span>
          </div>
          <p className="text-xs text-green-700 mt-2 font-mono break-all">{manufacturerHandover.id}</p>
        </div>
      )}
    </div>
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

export default function Dashboard() {
  const { credentials } = useFlowSnapshot();
  const requiredTypes = getRequiredManufacturerTypes();
  const incomingCredentials = credentials.filter(
    (credential) =>
      credential.recipientRole === "manufacturer" && requiredTypes.includes(credential.type),
  );
  const availableCount = incomingCredentials.length;

  return (
    <Layout title="Manufacturer Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Truck} label="Incoming Credentials" value={incomingCredentials.length} />
        <StatCard icon={ShieldCheck} label="Auto-Verified" value={availableCount} />
        <StatCard icon={Package} label="Required for Handover" value={requiredTypes.length} />
        <StatCard icon={FileUp} label="Ready to Handover" value={canManufacturerHandover() ? "Yes" : "No"} />
      </div>

      <Routes>
        <Route path="" element={<IncomingCredentials />} />
        <Route path="handover" element={<AssetHandover />} />
      </Routes>
    </Layout>
  );
}
