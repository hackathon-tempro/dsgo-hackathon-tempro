import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw error.response?.data || error;
  },
);

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {
  login: async (email, password = "demo") => {
    return apiClient.post("/auth/login", { email, password });
  },
  verify: async () => {
    return apiClient.post("/auth/verify", {});
  },
  me: async () => {
    return apiClient.get("/auth/me");
  },
  logout: async () => {
    return apiClient.post("/auth/logout", {});
  },
};

// ============================================
// ORGANIZATIONS SERVICE
// ============================================
export const organizationsService = {
  list: async (page = 0, limit = 50) => {
    return apiClient.get("/organizations", { params: { page, limit } });
  },
  get: async (id) => {
    return apiClient.get(`/organizations/${id}`);
  },
  create: async (data) => {
    return apiClient.post("/organizations", data);
  },
};

// ============================================
// CREDENTIALS SERVICE
// ============================================
export const credentialsService = {
  list: async () => {
    return apiClient.get("/credentials");
  },
  get: async (id) => {
    return apiClient.get(`/credentials/${id}`);
  },
  issueMaterialPassport: async (data) => {
    return apiClient.post("/credentials/material-passport", data);
  },
  issueTestReport: async (data) => {
    return apiClient.post("/credentials/test-report", data);
  },
  issueLCA: async (data) => {
    return apiClient.post("/credentials/lca", data);
  },
  issueCertificate: async (data) => {
    return apiClient.post("/credentials/certificate", data);
  },
  issueDPP: async (data) => {
    return apiClient.post("/credentials/dpp", data);
  },
  issueHandover: async (data) => {
    return apiClient.post("/credentials/handover", data);
  },
  issueRepair: async (data) => {
    return apiClient.post("/credentials/repair", data);
  },
  verify: async (id) => {
    return apiClient.post(`/credentials/verify`, { credentialId: id });
  },
};

// ============================================
// DPP SERVICE
// ============================================
export const dppService = {
  list: async () => {
    return apiClient.get("/dpp");
  },
  get: async (id) => {
    return apiClient.get(`/dpp/${id}`);
  },
  create: async (data) => {
    return apiClient.post("/dpp/create", data);
  },
  getHistory: async (id) => {
    return apiClient.get(`/dpp/${id}/history`);
  },
  update: async (id, data) => {
    return apiClient.put(`/dpp/${id}`, data);
  },
  transfer: async (data) => {
    return apiClient.post("/dpp/transfer", data);
  },
  assemble: async (data) => {
    return apiClient.post("/dpp/assemble", data);
  },
};

// ============================================
// SHIPMENTS SERVICE
// ============================================
export const shipmentsService = {
  list: async () => {
    return apiClient.get("/shipments");
  },
  get: async (id) => {
    return apiClient.get(`/shipments/${id}`);
  },
  create: async (data) => {
    return apiClient.post("/shipments", data);
  },
};

// ============================================
// MATERIALS SERVICE
// ============================================
export const materialsService = {
  list: async () => {
    return apiClient.get("/materials");
  },
  get: async (id) => {
    return apiClient.get(`/materials/${id}`);
  },
  create: async (data) => {
    return apiClient.post("/materials", data);
  },
};

// ============================================
// PRODUCTS SERVICE
// ============================================
export const productsService = {
  list: async () => {
    return apiClient.get("/products");
  },
  get: async (id) => {
    return apiClient.get(`/products/${id}`);
  },
  create: async (data) => {
    return apiClient.post("/products", data);
  },
};

// ============================================
// TEST LABS SERVICE
// ============================================
export const testLabsService = {
  list: async () => {
    return apiClient.get("/test-labs");
  },
  getRequests: async () => {
    return apiClient.get("/test-requests");
  },
  getSamples: async () => {
    return apiClient.get("/samples");
  },
  getResults: async () => {
    return apiClient.get("/test-results");
  },
  getReports: async () => {
    return apiClient.get("/test-results");
  },
  acceptRequest: async (id) => {
    return apiClient.post(`/test-requests/${id}/accept`, {});
  },
  submitResult: async (id, data) => {
    return apiClient.post(`/test-results/${id}`, data);
  },
  submitResults: async (data) => {
    return apiClient.post("/test-results", data);
  },
};

// ============================================
// LCA SERVICE
// ============================================
export const lcaService = {
  list: async () => {
    return apiClient.get("/lca");
  },
  get: async (id) => {
    return apiClient.get(`/lca/${id}`);
  },
  create: async (data) => {
    return apiClient.post("/lca", data);
  },
  createProject: async (data) => {
    return apiClient.post("/lca/projects", data);
  },
  getPending: async () => {
    return apiClient.get("/lca?status=pending");
  },
  getCompleted: async () => {
    return apiClient.get("/lca?status=completed");
  },
  submitResults: async (data) => {
    return apiClient.post("/lca/results", data);
  },
  getCredentials: async () => {
    return apiClient.get("/credentials?type=lca");
  },
};

// ============================================
// CERTIFICATIONS SERVICE
// ============================================
export const certificationsService = {
  list: async () => {
    return apiClient.get("/certifications");
  },
  get: async (id) => {
    return apiClient.get(`/certifications/${id}`);
  },
  getPending: async () => {
    return apiClient.get("/certifications?status=pending");
  },
  getIssued: async () => {
    return apiClient.get("/certifications?status=issued");
  },
  getActive: async () => {
    return apiClient.get("/certifications?status=active");
  },
  approve: async (id, data) => {
    return apiClient.post(`/certifications/${id}/approve`, data);
  },
  issueCertificate: async (id, data) => {
    return apiClient.post(`/certifications/${id}/issue`, data);
  },
  reject: async (id, data) => {
    return apiClient.post(`/certifications/${id}/reject`, data);
  },
};

// ============================================
// VERIFICATIONS SERVICE
// ============================================
export const verificationService = {
  verify: async (credentialId) => {
    return apiClient.post("/verifications", { credentialId });
  },
  list: async () => {
    return apiClient.get("/verifications");
  },
};

// ============================================
// ASSET SERVICE
// ============================================
export const assetsService = {
  list: async () => {
    return apiClient.get("/assets");
  },
  get: async (id) => {
    return apiClient.get(`/assets/${id}`);
  },
  create: async (data) => {
    return apiClient.post("/assets", data);
  },
};

// ============================================
// ASSET HANDOVER SERVICE
// ============================================
export const assetHandoversService = {
  list: async () => {
    return apiClient.get("/asset-handovers");
  },
  create: async (data) => {
    return apiClient.post("/asset-handovers", data);
  },
  accept: async (id) => {
    return apiClient.post(`/asset-handovers/${id}/accept`, {});
  },
};

// ============================================
// REPAIRS SERVICE
// ============================================
export const repairsService = {
  list: async () => {
    return apiClient.get("/repairs");
  },
  create: async (data) => {
    return apiClient.post("/repairs", data);
  },
  complete: async (id, data) => {
    return apiClient.post(`/repairs/${id}/complete`, data);
  },
};

// ============================================
// AUDIT SERVICE
// ============================================
export const auditService = {
  getLogs: async (organizationId, filters = {}) => {
    return apiClient.get(`/audit`, {
      params: { org: organizationId, ...filters },
    });
  },
  createRequest: async (data) => {
    return apiClient.post("/audit/requests", data);
  },
  getRequests: async () => {
    return apiClient.get("/audit/requests");
  },
  approve: async (id, data) => {
    return apiClient.post("/audit/approve", data);
  },
  submit: async (data) => {
    return apiClient.post("/audit/submit", data);
  },
};

// ============================================
// COMPLIANCE SERVICE
// ============================================
export const complianceService = {
  checkPortfolio: async (organizationId) => {
    return apiClient.get(`/compliance`, { params: { org: organizationId } });
  },
  getReport: async (organizationId) => {
    return apiClient.get(`/compliance/${organizationId}/report`);
  },
  check: async (data) => {
    return apiClient.post("/compliance/check", data);
  },
};

// ============================================
// PRESENTATIONS SERVICE (OID4VP)
// ============================================
export const presentationsService = {
  createRequest: async (data) => {
    return apiClient.post("/presentations", data);
  },
  submitPresentation: async (data) => {
    return apiClient.post("/presentations/submit", data);
  },
};

// ============================================
// TRANSACTIONS SERVICE
// ============================================
export const transactionsService = {
  list: async () => {
    return apiClient.get("/transactions");
  },
  create: async (data) => {
    return apiClient.post("/transactions", data);
  },
};

// ============================================
// RECYCLING SERVICE
// ============================================
export const recyclingService = {
  list: async () => {
    return apiClient.get("/recycling");
  },
  create: async (data) => {
    return apiClient.post("/recycling", data);
  },
  intake: async (data) => {
    return apiClient.post("/recycling/intake", data);
  },
  addEvent: async (data) => {
    return apiClient.post("/recycling/events", data);
  },
};

// ============================================
// DISMANTLING SERVICE
// ============================================
export const dismantlingService = {
  list: async () => {
    return apiClient.get("/dismantling");
  },
  create: async (data) => {
    return apiClient.post("/dismantling", data);
  },
  intake: async (data) => {
    return apiClient.post("/dismantling/intake", data);
  },
};

export default apiClient;
