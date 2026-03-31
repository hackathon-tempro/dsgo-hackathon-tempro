import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "../shared/Layout";
import {
  ClipboardList,
  FlaskConical,
  CheckCircle,
  FileText,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { testLabsService, credentialsService } from "../../services/api";

const navItems = [
  { label: "Test Requests", path: "/test-lab" },
  { label: "Completed Tests", path: "/test-lab/completed" },
  { label: "Issued Credentials", path: "/test-lab/credentials" },
  { label: "Reports", path: "/test-lab/reports" },
];

function TestRequestsView({ onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [testResults, setTestResults] = useState({
    tensile_strength: "",
    method: "ISO 6892-1",
    conclusion: "compliant",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await testLabsService
        .getRequests()
        .catch(() => ({ data: [] }));
      setRequests(data.data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!selectedRequest) {
      toast.error("Please select a test request");
      return;
    }

    setSubmitting(true);
    try {
      await testLabsService.submitResults({
        testRequestId: selectedRequest.id,
        results: testResults,
        status: "completed",
      });
      toast.success("Test results submitted");
      setSelectedRequest(null);
      setTestResults({
        tensile_strength: "",
        method: "ISO 6892-1",
        conclusion: "compliant",
      });
      loadRequests();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to submit results:", error);
      toast.error("Failed to submit results");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueCredential = async () => {
    if (!selectedRequest) {
      toast.error("Please select a test request");
      return;
    }

    try {
      await credentialsService.issueTestReport({
        testResultId: selectedRequest.id,
        dppId: selectedRequest?.dpp_id,
        testData: testResults,
      });
      toast.success("TestReportCredential issued!");
      loadRequests();
    } catch (error) {
      console.error("Failed to issue credential:", error);
      toast.error("Failed to issue credential");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Test Requests</h2>

      {requests.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No pending test requests
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className={`card cursor-pointer hover:border-primary-300 ${
                  selectedRequest?.id === req.id ? "border-primary-500" : ""
                }`}
                onClick={() => setSelectedRequest(req)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {req.test_type || "Test Request"}
                    </p>
                    <p className="text-xs text-gray-500">DPP: {req.dpp_id}</p>
                  </div>
                  <span className="badge badge-warning">{req.status}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedRequest && (
            <div className="card">
              <h3 className="font-medium mb-4">Record Test Results</h3>
              <form onSubmit={handleSubmitResults} className="space-y-4">
                <div>
                  <label className="label">Tensile Strength (MPa)</label>
                  <input
                    type="number"
                    className="input"
                    value={testResults.tensile_strength}
                    onChange={(e) =>
                      setTestResults({
                        ...testResults,
                        tensile_strength: e.target.value,
                      })
                    }
                    placeholder="540"
                    required
                  />
                </div>
                <div>
                  <label className="label">Test Method</label>
                  <select
                    className="input"
                    value={testResults.method}
                    onChange={(e) =>
                      setTestResults({ ...testResults, method: e.target.value })
                    }
                  >
                    <option value="ISO 6892-1">ISO 6892-1</option>
                    <option value="EN 10002">EN 10002</option>
                    <option value="ASTM E8">ASTM E8</option>
                  </select>
                </div>
                <div>
                  <label className="label">Conclusion</label>
                  <select
                    className="input"
                    value={testResults.conclusion}
                    onChange={(e) =>
                      setTestResults({
                        ...testResults,
                        conclusion: e.target.value,
                      })
                    }
                  >
                    <option value="compliant">Compliant</option>
                    <option value="non-compliant">Non-Compliant</option>
                    <option value="conditional">Conditional</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1"
                  >
                    {submitting ? "Submitting..." : "Submit Results"}
                  </button>
                  <button
                    type="button"
                    onClick={handleIssueCredential}
                    className="btn btn-success"
                  >
                    Issue Credential
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompletedTestsView() {
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompletedTests();
  }, []);

  const loadCompletedTests = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call for completed tests
      setCompletedTests([]);
    } catch (error) {
      console.error("Failed to load completed tests:", error);
      toast.error("Failed to load completed tests");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Completed Tests</h2>
      <div className="card text-center py-12 text-gray-500">
        <p>No completed tests yet</p>
      </div>
    </div>
  );
}

function IssuedCredentialsView() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await credentialsService.list().catch(() => ({ data: [] }));
      setCredentials(data.data || []);
    } catch (error) {
      console.error("Failed to load credentials:", error);
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Issued TestReportCredentials</h2>
      {credentials.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No credentials issued yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => (
            <div key={cred.id} className="card">
              <h3 className="font-medium mb-2">{cred.type}</h3>
              <p className="text-xs text-gray-500 font-mono mb-2">
                {cred.credential_id}
              </p>
              <span className="badge badge-success">Issued</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Reports</h2>
      <div className="card text-center py-12 text-gray-500">
        <p>Test reports will be available here</p>
      </div>
    </div>
  );
}

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

export default function TestLabDashboard() {
  const [requests, setRequests] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, credsData] = await Promise.all([
        testLabsService.getRequests().catch(() => ({ data: [] })),
        credentialsService.list().catch(() => ({ data: [] })),
      ]);
      setRequests(requestsData.data || []);
      setCredentials(credsData.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Test Lab Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={ClipboardList}
          label="Pending Tests"
          value={requests.length}
        />
        <StatCard icon={FlaskConical} label="Completed" value="-" />
        <StatCard
          icon={CheckCircle}
          label="Credentials Issued"
          value={credentials.length}
        />
      </div>

      <Routes>
        <Route path="" element={<TestRequestsView onRefresh={loadData} />} />
        <Route path="completed" element={<CompletedTestsView />} />
        <Route path="credentials" element={<IssuedCredentialsView />} />
        <Route path="reports" element={<ReportsView />} />
      </Routes>
    </Layout>
  );
}
