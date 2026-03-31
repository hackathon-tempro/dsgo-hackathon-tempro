import { Routes, Route } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle, ClipboardCheck, FileText, Package } from "lucide-react";
import toast from "react-hot-toast";
import { Layout } from "../shared/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  canConstructionHandoverToOwner,
  getConstructionNextTypeToVerify,
  getConstructionPackage,
  getConstructionVerificationOrder,
  hasRoleVerified,
  issueFlowCredential,
  useFlowSnapshot,
  verifyCredential,
} from "../../demo/sequentialFlow";

const navItems = [
  { label: "Asset Receiving", path: "/construction-company" },
  { label: "Handover to Owner", path: "/construction-company/handover" },
];

function renderCredentialSummary(credential) {
  const payload = credential.payload || {};

  if (credential.type === "TestReport") {
    return [
      `Test type: ${payload.testType}`,
      `Standard: ${payload.standard}`,
      `Conclusion: ${payload.conclusion}`,
      payload.fireRating ? `Fire rating: ${payload.fireRating}` : null,
    ].filter(Boolean);
  }

  if (credential.type === "CEMArkingTestREport") {
    return [
      `Certificate type: ${payload.certificateType}`,
      `Cert ID: ${payload.certId}`,
      `Standard: ${payload.standard}`,
      payload.fireResistanceClass ? `Class: ${payload.fireResistanceClass}` : null,
    ].filter(Boolean);
  }

  if (credential.type === "EnvironmentalFootprintTestPassport") {
    return [
      `Methodology: ${payload.methodology}`,
      `Carbon footprint: ${payload.carbonFootprint} kg CO2e`,
      `Water footprint: ${payload.waterFootprint}`,
    ].filter(Boolean);
  }

  return [];
}

function ReceivingView() {
  const { user } = useAuth();
  useFlowSnapshot();
  const pkg = getConstructionPackage();

  if (!pkg) {
    return (
      <div className="card text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Waiting for AssetHandoverCredential from Manufacturer.</p>
        <p className="text-xs text-gray-400 mt-2">
          Go to Manufacturer → Asset Handover and issue the credential first.
        </p>
      </div>
    );
  }

  const order = getConstructionVerificationOrder();
  const nextType = getConstructionNextTypeToVerify();

  const handleVerify = (credential) => {
    if (nextType && credential.type !== nextType) {
      toast.error(`Verify ${nextType} first`);
      return;
    }

    const result = verifyCredential(credential.id, "construction_company", user?.org || "Construction Company");
    if (!result.ok) {
      toast.error(result.reason || "Verification failed");
      return;
    }

    toast.success(`${credential.type} verified by Construction Company`);
  };

  return (
    <div className="space-y-6">
      <div className="card border border-primary-200 bg-primary-50">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-primary-600" />
          <div>
            <p className="font-semibold text-primary-900">{pkg.asset.productName}</p>
            <p className="text-xs text-primary-700">
              Asset ID: {pkg.asset.id} · Product ID: {pkg.asset.productId}
            </p>
          </div>
        </div>
        <p className="text-xs text-primary-700 mt-3">
          Manufacturer handover: <span className="font-mono break-all">{pkg.handover.id}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {order.map((type) => {
          const credential = pkg.linkedCredentials.find((item) => item.type === type);
          const verified = credential ? hasRoleVerified(credential, "construction_company") : false;
          const isCurrent = nextType === type;

          return (
            <div key={type} className="card border border-gray-200">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-sm">{type}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {credential ? `From ${credential.issuerOrg}` : "Missing from package"}
                  </p>
                </div>
                <span className={`badge ${verified ? "badge-success" : isCurrent ? "badge-warning" : "badge-gray"}`}>
                  {verified ? "Verified" : isCurrent ? "Verify now" : "Locked"}
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                {credential ? (
                  renderCredentialSummary(credential).map((line) => <div key={line}>{line}</div>)
                ) : (
                  <div>Credential not linked on this package.</div>
                )}
              </div>

              {credential && (
                <p className="mt-3 text-xs text-gray-400 font-mono break-all">{credential.id}</p>
              )}

              <button
                disabled={!credential || verified || (!!nextType && !isCurrent)}
                onClick={() => handleVerify(credential)}
                className="btn btn-outline text-xs mt-4 w-full disabled:opacity-50"
              >
                {verified ? "Verified" : "Verify"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HandoverToOwner() {
  const { user } = useAuth();
  const { credentials } = useFlowSnapshot();
  const pkg = getConstructionPackage();
  const ownerHandover = credentials.find(
    (credential) =>
      credential.type === "AssetHandoverCredential" &&
      credential.issuerRole === "construction_company" &&
      credential.recipientRole === "building_owner",
  );

  const handleHandover = () => {
    if (!pkg) {
      toast.error("No incoming asset package found");
      return;
    }
    if (!canConstructionHandoverToOwner()) {
      toast.error("Verify TestReport, CE marking, and LCA report in order before handover");
      return;
    }

    issueFlowCredential({
      type: "AssetHandoverCredential",
      issuerRole: "construction_company",
      issuerOrg: user?.org || "Construction Company",
      recipientRole: "building_owner",
      recipientOrg: "PropInvest Real Estate",
      payload: {
        assetId: pkg.asset.id,
        assetName: pkg.asset.productName,
        productId: pkg.asset.productId,
        linkedCredentialIds: pkg.linkedCredentials.map((credential) => credential.id),
        previousHandoverCredentialId: pkg.handover.id,
      },
    });

    toast.success("AssetHandoverCredential sent to Building Owner");
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold">Construction Company -&gt; Building Owner</h2>
        <p className="text-sm text-gray-600 mt-2">
          Forward the same asset product and linked credentials to the building owner after verification.
        </p>
        <button
          disabled={!canConstructionHandoverToOwner()}
          onClick={handleHandover}
          className="btn btn-primary mt-4 disabled:opacity-50"
        >
          Send AssetHandoverCredential
        </button>
      </div>

      {ownerHandover && (
        <div className="card border border-green-200 bg-green-50">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Current owner handover in flow</span>
          </div>
          <p className="text-xs text-green-700 mt-2 font-mono break-all">{ownerHandover.id}</p>
        </div>
      )}
    </div>
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

export default function Dashboard() {
  useFlowSnapshot();
  const pkg = getConstructionPackage();
  const nextType = getConstructionNextTypeToVerify();
  const verifiedCount = pkg
    ? pkg.linkedCredentials.filter((credential) =>
        hasRoleVerified(credential, "construction_company"),
      ).length
    : 0;

  return (
    <Layout title="Construction Company Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Asset Received" value={pkg ? "Yes" : "No"} />
        <StatCard icon={ClipboardCheck} label="Verified Linked Credentials" value={verifiedCount} />
        <StatCard icon={ArrowRight} label="Next Required" value={nextType || "Done"} />
        <StatCard icon={Building2} label="Ready for Owner" value={canConstructionHandoverToOwner() ? "Yes" : "No"} />
      </div>

      <Routes>
        <Route path="" element={<ReceivingView />} />
        <Route path="handover" element={<HandoverToOwner />} />
      </Routes>
    </Layout>
  );
}
