import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Landmark,
  Leaf,
  Flame,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  DEMO_STAGES,
  DEMO_RETURN_PATH,
  getNextSuggestedStage,
  getUseCaseStatus,
  isStageUnlocked,
  readDemoProgress,
  resetDemoProgress,
} from "../demo/workflow";
import { getWalletViewForRole, resetFlowState, useFlowSnapshot } from "../demo/sequentialFlow";

const STAGE_BY_ID = Object.fromEntries(DEMO_STAGES.map((stage) => [stage.id, stage]));
const ISSUER_IDS = ["issuer_lca", "tester", "issuer_ce"];

function actorLabel(role) {
  if (role === "supplier") return "Supplier";
  if (role === "manufacturer") return "Manufacturer";
  if (role === "lca_org") return "LCA Organisation";
  if (role === "test_lab") return "Test Lab";
  if (role === "certification_body") return "SKG IKOB";
  if (role === "construction_company") return "Construction Company";
  if (role === "building_owner") return "Building Owner";
  return role;
}

function UseCaseCard({ icon: Icon, title, description, done }) {
  return (
    <div className="rounded-xl border p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Icon className="w-4 h-4 text-primary-600" />
          {title}
        </div>
        <span className={`badge ${done ? "badge-success" : "badge-gray"}`}>
          {done ? "Complete" : "Pending"}
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-2">{description}</p>
    </div>
  );
}

function StageCard({ stage, done, locked, onOpen, walletView }) {
  const issued = walletView?.issued || [];
  const received = walletView?.received || [];

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        done ? "border-green-300 bg-green-50" : locked ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              done ? "bg-green-100 text-green-600" : locked ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-blue-600"
            }`}
          >
            {done ? <CheckCircle2 className="w-5 h-5" /> : locked ? <Lock className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{stage.title}</h3>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`badge ${done ? "badge-success" : locked ? "badge-gray" : "badge-warning"}`}>
          {done ? "Reviewed" : locked ? "Locked" : "Ready"}
        </span>
        <button
          onClick={onOpen}
          disabled={locked}
          className="btn btn-primary text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Open Interface <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 rounded-lg border bg-gray-50 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-800">Credenco Wallet VCs</p>
          <span className="text-[11px] text-gray-500">Issued {issued.length} · Received {received.length}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Issued from this wallet</p>
          {issued.length === 0 ? (
            <p className="text-xs text-gray-500 mt-1">No issued credentials yet.</p>
          ) : (
            issued.map((credential) => (
              <p key={credential.id} className="text-xs text-gray-700 mt-1">
                {credential.type} · {actorLabel(credential.issuerRole)} Wallet -&gt; {actorLabel(credential.recipientRole)} Wallet
              </p>
            ))
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Contained in this wallet (received)</p>
          {received.length === 0 ? (
            <p className="text-xs text-gray-500 mt-1">No received credentials yet.</p>
          ) : (
            received.map((credential) => (
              <p key={credential.id} className="text-xs text-gray-700 mt-1">
                {credential.type} · from {credential.issuerOrg}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DemoWorkflow() {
  const navigate = useNavigate();
  const { switchToCompany, user } = useAuth();
  useFlowSnapshot();
  const [completed, setCompleted] = useState(readDemoProgress());

  const completedSet = useMemo(() => new Set(completed), [completed]);
  const useCaseStatus = useMemo(() => getUseCaseStatus(completedSet), [completedSet]);
  const nextStage = useMemo(() => getNextSuggestedStage(completedSet), [completedSet]);
  const unlockedEvidence = useMemo(() => {
    const items = [];
    if (completedSet.has("supplier")) items.push("MaterialPassport");
    if (completedSet.has("manufacturer")) items.push("Manufacturer receiving and verification");
    if (completedSet.has("issuer_lca")) items.push("EnvironmentalFootprintTestPassport");
    if (completedSet.has("tester")) items.push("TestReport");
    if (completedSet.has("issuer_ce")) items.push("CEMArkingTestREport");
    if (completedSet.has("construction")) items.push("AssetHandoverCredential to construction company");
    if (completedSet.has("owner")) items.push("Final owner verification completed");
    return items;
  }, [completedSet]);

  const openStage = (stage) => {
    if (!isStageUnlocked(stage.id, completedSet)) {
      toast.error("This stage is locked until prior demo steps are completed");
      return;
    }

    try {
      switchToCompany(stage.companyId);
      localStorage.setItem("demo_journey_return_path", DEMO_RETURN_PATH);
      localStorage.setItem("demo_active_stage", stage.id);
      navigate(stage.interfacePath);
      toast.success(`${stage.title} interface opened`);
    } catch {
      toast.error("Could not switch context for this stage");
    }
  };

  const handleReset = () => {
    resetDemoProgress();
    resetFlowState();
    setCompleted([]);
    localStorage.removeItem("demo_active_stage");
    toast("Demo progress reset");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interactive Demo Journey</h1>
              <p className="text-sm text-gray-500 mt-1">
                Started by {user?.name} ({user?.org})
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Open each real interface, perform the action, then click "Complete Stage & Return" from that dashboard.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-info">{completedSet.size}/{DEMO_STAGES.length} completed</span>
              <button onClick={handleReset} className="btn btn-outline text-sm">Reset Progress</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <UseCaseCard
              icon={Leaf}
              title="Material Flow"
              description="Supplier material passport reaches manufacturer as the first linked credential."
              done={useCaseStatus.material}
            />
            <UseCaseCard
              icon={Flame}
              title="Parallel Certifications"
              description="LCA, Test Lab, and SKG IKOB credentials are issued in parallel to manufacturer."
              done={useCaseStatus.certification}
            />
            <UseCaseCard
              icon={Landmark}
              title="Asset Handover"
              description="Manufacturer to construction, then construction to owner with linked verification."
              done={useCaseStatus.handover}
            />
          </div>

          {nextStage && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800">
              Next recommended step: <span className="font-semibold">{nextStage.title}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">Upstream Issuers (parallel)</h2>
                <span className="text-xs text-gray-500">All issuers send credentials to Manufacturer</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {["supplier", ...ISSUER_IDS].map((id) => {
                  const stage = STAGE_BY_ID[id];
                  const done = completedSet.has(stage.id);
                  const locked = !done && !isStageUnlocked(stage.id, completedSet);
                  return (
                    <StageCard
                      key={stage.id}
                      stage={stage}
                      done={done}
                      locked={locked}
                      onOpen={() => openStage(stage)}
                      walletView={getWalletViewForRole(stage.role)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center text-gray-400 py-1">
              <span className="text-xs font-medium">All upstream flows</span>
            </div>
            <div className="flex justify-center text-gray-400">
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>

            {["manufacturer"].map((id) => {
              const stage = STAGE_BY_ID[id];
              const done = completedSet.has(stage.id);
              const locked = !done && !isStageUnlocked(stage.id, completedSet);

              return (
                <div key={stage.id}>
                  <StageCard
                    stage={stage}
                    done={done}
                    locked={locked}
                    onOpen={() => openStage(stage)}
                    walletView={getWalletViewForRole(stage.role)}
                  />
                </div>
              );
            })}

            <div className="flex justify-center text-gray-400 py-2">
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>

            {["construction", "owner"].map((id, idx, arr) => {
              const stage = STAGE_BY_ID[id];
              const done = completedSet.has(stage.id);
              const locked = !done && !isStageUnlocked(stage.id, completedSet);

              return (
                <div key={stage.id}>
                  <StageCard
                    stage={stage}
                    done={done}
                    locked={locked}
                    onOpen={() => openStage(stage)}
                    walletView={getWalletViewForRole(stage.role)}
                  />
                  {idx < arr.length - 1 && (
                    <div className="flex justify-center text-gray-400 py-2">
                      <ArrowRight className="w-5 h-5 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border bg-gray-50 p-4">
            <h2 className="text-sm font-semibold text-gray-800">Demo Presenter Flow</h2>
            <p className="text-xs text-gray-600 mt-2">
              Supplier issues MaterialPassport, manufacturer receives all credentials, LCA + Test Lab + SKG IKOB run in parallel,
              then Manufacturer and Construction Company each issue AssetHandoverCredential until owner receives the linked package.
            </p>
            <div className="mt-3 space-y-1.5">
              {unlockedEvidence.length === 0 ? (
                <p className="text-xs text-gray-500">No evidence unlocked yet.</p>
              ) : (
                unlockedEvidence.map((item) => (
                  <div key={item} className="text-xs text-gray-700 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
