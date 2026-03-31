import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "../shared/Layout";
import {
  ClipboardList,
  FlaskConical,
  CheckCircle,
  ShieldCheck,
  Flame,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getAsset, issueFlowCredential, useFlowSnapshot } from "../../demo/sequentialFlow";

const navItems = [
  { label: "Test Requests", path: "/test-lab" },
  { label: "Completed Tests", path: "/test-lab/completed" },
  { label: "Issued Credentials", path: "/test-lab/credentials" },
];

// ---------------------------------------------------------------------------
// Mock pending test requests — pre-seeded for demo
// ---------------------------------------------------------------------------
const INITIAL_REQUESTS = [
  {
    id: "TR-2026-001",
    testType: "Fire Resistance Test",
    standard: "EN 13501-1",
    product: "Aluminium Facade Panel AFP-001",
    requestedBy: "Alkondor",
    requestedAt: "2026-03-28",
    priority: "high",
    sampleDescription: "Facade panel 1200 × 600 mm, aluminium composite, 4 mm",
    status: "pending",
  },
  {
    id: "TR-2026-002",
    testType: "Tensile Strength Test",
    standard: "ISO 6892-1",
    product: "Steel Reinforcement Bar SRB-001",
    requestedBy: "Alkondor",
    requestedAt: "2026-03-29",
    priority: "normal",
    sampleDescription: "Rebar ø 12 mm, S500 grade, 300 mm length",
    status: "pending",
  },
];

// Fire resistance rating options
const FIRE_RATINGS = ["EI30", "EI60", "EI90", "EI120", "E30", "E60", "E90"];

// ---------------------------------------------------------------------------
// Test Requests View
// ---------------------------------------------------------------------------
function TestRequestsView({ onComplete }) {
  const { user } = useAuth();
  useFlowSnapshot();
  const asset = getAsset();
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [selected, setSelected] = useState(INITIAL_REQUESTS[0]);
  const [submitting, setSubmitting] = useState(false);

  // Fire resistance form state
  const [fireForm, setFireForm] = useState({
    fireRating: "EI60",
    testDuration: "60",
    temperature: "1049",
    conclusion: "compliant",
    observations: "Panel maintained structural integrity throughout. No flame penetration observed.",
  });

  // Generic (tensile) form state
  const [genericForm, setGenericForm] = useState({
    tensileStrength: "540",
    method: "ISO 6892-1",
    conclusion: "compliant",
  });

  const isFireTest = selected?.testType === "Fire Resistance Test";

  const handleComplete = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const result = isFireTest
      ? {
          testType: "Fire Resistance Test",
          standard: selected.standard,
          fireRating: fireForm.fireRating,
          testDuration: `${fireForm.testDuration} min`,
          peakTemperature: `${fireForm.temperature} °C`,
          conclusion: fireForm.conclusion,
          observations: fireForm.observations,
        }
      : {
          testType: selected.testType,
          standard: selected.standard,
          tensileStrength: `${genericForm.tensileStrength} MPa`,
          method: genericForm.method,
          conclusion: genericForm.conclusion,
        };

    const completed = {
      ...selected,
      status: "completed",
      completedAt: new Date().toISOString(),
      result,
    };

    setRequests((prev) => prev.filter((r) => r.id !== selected.id));
    issueFlowCredential({
      type: "TestReport",
      issuerRole: "test_lab",
      issuerOrg: user?.org || "Test Lab",
      recipientRole: "manufacturer",
      recipientOrg: "Alkondor",
      payload: {
        productId: asset.productId,
        productName: asset.productName,
        testRequestId: completed.id,
        testType: completed.result.testType,
        standard: completed.result.standard,
        conclusion: completed.result.conclusion,
        fireRating: completed.result.fireRating || null,
      },
    });
    onComplete?.(completed);
    setSelected(null);
    setSubmitting(false);
    toast.success("Test results recorded successfully!");
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Pending Test Requests</h2>

      {pending.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>All test requests completed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request list */}
          <div className="space-y-3">
            {pending.map((req) => (
              <div
                key={req.id}
                className={`card cursor-pointer transition-all hover:border-primary-300 ${
                  selected?.id === req.id ? "border-primary-500 bg-primary-50" : ""
                }`}
                onClick={() => setSelected(req)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {req.testType === "Fire Resistance Test" ? (
                      <Flame className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    ) : (
                      <FlaskConical className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{req.testType}</p>
                      <p className="text-xs text-gray-500">{req.standard}</p>
                      <p className="text-xs text-gray-600 mt-1">{req.product}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="badge badge-warning">Pending</span>
                    {req.priority === "high" && (
                      <span className="text-xs text-orange-600 font-medium">High priority</span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  From: {req.requestedBy} · {req.requestedAt}
                </div>
              </div>
            ))}
          </div>

          {/* Detail / form panel */}
          {selected && (
            <div className="card space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{selected.testType}</h3>
                <p className="text-xs text-gray-500">{selected.standard} · {selected.id}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                <div><span className="text-gray-400">Product: </span>{selected.product}</div>
                <div><span className="text-gray-400">Sample: </span>{selected.sampleDescription}</div>
                <div><span className="text-gray-400">Requested by: </span>{selected.requestedBy}</div>
              </div>

              {isFireTest ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Fire Resistance Rating</label>
                      <select
                        className="input"
                        value={fireForm.fireRating}
                        onChange={(e) => setFireForm({ ...fireForm, fireRating: e.target.value })}
                      >
                        {FIRE_RATINGS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Test Duration (min)</label>
                      <input
                        type="number"
                        className="input"
                        value={fireForm.testDuration}
                        onChange={(e) => setFireForm({ ...fireForm, testDuration: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Peak Temperature (°C)</label>
                    <input
                      type="number"
                      className="input"
                      value={fireForm.temperature}
                      onChange={(e) => setFireForm({ ...fireForm, temperature: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Conclusion</label>
                    <select
                      className="input"
                      value={fireForm.conclusion}
                      onChange={(e) => setFireForm({ ...fireForm, conclusion: e.target.value })}
                    >
                      <option value="compliant">Compliant</option>
                      <option value="non-compliant">Non-Compliant</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Observations</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={fireForm.observations}
                      onChange={(e) => setFireForm({ ...fireForm, observations: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="label">Tensile Strength (MPa)</label>
                    <input
                      type="number"
                      className="input"
                      value={genericForm.tensileStrength}
                      onChange={(e) => setGenericForm({ ...genericForm, tensileStrength: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Test Method</label>
                    <select
                      className="input"
                      value={genericForm.method}
                      onChange={(e) => setGenericForm({ ...genericForm, method: e.target.value })}
                    >
                      <option>ISO 6892-1</option>
                      <option>EN 10002</option>
                      <option>ASTM E8</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Conclusion</label>
                    <select
                      className="input"
                      value={genericForm.conclusion}
                      onChange={(e) => setGenericForm({ ...genericForm, conclusion: e.target.value })}
                    >
                      <option value="compliant">Compliant</option>
                      <option value="non-compliant">Non-Compliant</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={handleComplete}
                disabled={submitting}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Recording results…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Test &amp; Issue TestReportCredential
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completed Tests View
// ---------------------------------------------------------------------------
function CompletedTestsView({ completed }) {
  if (completed.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Completed Tests</h2>
        <div className="card text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No completed tests yet. Complete a test request to see results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Completed Tests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {completed.map((test) => (
          <div key={test.id} className="card border-l-4 border-green-400">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {test.testType === "Fire Resistance Test" ? (
                  <Flame className="w-5 h-5 text-orange-500" />
                ) : (
                  <FlaskConical className="w-5 h-5 text-purple-500" />
                )}
                <span className="font-semibold text-sm">{test.result?.testType || test.testType}</span>
              </div>
              <span className="badge badge-success">Completed</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{test.product}</p>
            {test.result?.fireRating && (
              <div className="bg-orange-50 rounded-lg p-2 text-center mb-2">
                <div className="text-2xl font-bold text-orange-600">{test.result.fireRating}</div>
                <div className="text-xs text-orange-400">Fire Resistance Class</div>
              </div>
            )}
            <div className="text-xs text-gray-600 space-y-1">
              {test.result?.tensileStrength && (
                <div>Tensile strength: <strong>{test.result.tensileStrength}</strong></div>
              )}
              {test.result?.testDuration && (
                <div>Duration: <strong>{test.result.testDuration}</strong> · Peak: <strong>{test.result.peakTemperature}</strong></div>
              )}
              <div className={`font-medium ${test.result?.conclusion === 'compliant' ? 'text-green-600' : 'text-red-600'}`}>
                {test.result?.conclusion === 'compliant' ? '✓ Compliant' : '✗ Non-compliant'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Issued Credentials View
// ---------------------------------------------------------------------------
function IssuedCredentialsView({ completed }) {
  const SEED_CRED = {
    id: "vc-tr-seed-001",
    type: "TestReportCredential",
    testId: "TR-2025-099",
    product: "Steel Reinforcement Bar SRB-001",
    standard: "ISO 6892-1",
    conclusion: "compliant",
    issuedAt: "2026-02-14T11:00:00Z",
    isFireTest: false,
  };

  const creds = [
    SEED_CRED,
    ...completed.map((t) => ({
      id: `vc-${t.id}-${Date.now()}`,
      type: "TestReportCredential",
      testId: t.id,
      product: t.product,
      standard: t.result?.standard || t.standard,
      conclusion: t.result?.conclusion || "compliant",
      issuedAt: t.completedAt,
      fireRating: t.result?.fireRating,
      isFireTest: t.testType === "Fire Resistance Test",
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Issued Credentials</h2>
        <span className="text-sm text-gray-500">{creds.length} credential{creds.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {creds.map((cred) => (
          <div key={cred.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-sm">{cred.type}</span>
              </div>
              <span className="badge badge-success flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Valid
              </span>
            </div>
            {cred.isFireTest && cred.fireRating && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-orange-700">Fire Resistance: {cred.fireRating}</span>
                <span className="text-xs text-orange-500">EN 13501-1</span>
              </div>
            )}
            <div className="text-xs text-gray-600 space-y-1">
              <div><span className="text-gray-400">Product: </span>{cred.product}</div>
              <div><span className="text-gray-400">Standard: </span>{cred.standard}</div>
              <div><span className="text-gray-400">Issued: </span>{new Date(cred.issuedAt).toLocaleDateString()}</div>
            </div>
            <div className="mt-2 text-xs font-mono text-gray-300 truncate">{cred.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-purple-50 rounded-lg">
        <Icon className="w-6 h-6 text-purple-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root dashboard
// ---------------------------------------------------------------------------
export default function TestLabDashboard() {
  const [completedTests, setCompletedTests] = useState([]);

  const handleComplete = (test) => {
    setCompletedTests((prev) => [test, ...prev]);
  };

  return (
    <Layout title="Test Lab Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={ClipboardList} label="Pending Requests" value={Math.max(0, INITIAL_REQUESTS.length - completedTests.length)} />
        <StatCard icon={FlaskConical} label="Completed Tests" value={completedTests.length} />
        <StatCard icon={CheckCircle} label="Credentials Issued" value={completedTests.length + 1} />
      </div>

      <Routes>
        <Route path="" element={<TestRequestsView onComplete={handleComplete} />} />
        <Route path="completed" element={<CompletedTestsView completed={completedTests} />} />
        <Route path="credentials" element={<IssuedCredentialsView completed={completedTests} />} />
      </Routes>
    </Layout>
  );
}
