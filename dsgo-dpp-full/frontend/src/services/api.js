import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email) => {
    const { data } = await api.post('/auth/login', { email, password: 'demo' });
    return data;
  },
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  verify: async () => {
    const { data } = await api.get('/auth/verify');
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export const materialsService = {
  create: async (materialData) => {
    const { data } = await api.post('/materials', materialData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/materials/${id}`);
    return data;
  },
  createLot: async (lotData) => {
    const { data } = await api.post('/materials/lots', lotData);
    return data;
  },
  getLot: async (id) => {
    const { data } = await api.get(`/materials/lots/${id}`);
    return data;
  },
};

export const productsService = {
  create: async (productData) => {
    const { data } = await api.post('/products', productData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },
  createBOM: async (id, components) => {
    const { data } = await api.post(`/products/${id}/bom`, { components });
    return data;
  },
  getBOM: async (id) => {
    const { data } = await api.get(`/products/${id}/bom`);
    return data;
  },
};

export const shipmentsService = {
  create: async (shipmentData) => {
    const { data } = await api.post('/shipments', shipmentData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/shipments/${id}`);
    return data;
  },
  updateStatus: async (id, status) => {
    const { data } = await api.put(`/shipments/${id}/status`, { status });
    return data;
  },
  receive: async (id, data) => {
    const { data: result } = await api.post(`/shipments/${id}/receive`, data);
    return result;
  },
};

export const credentialsService = {
  list: async (params = {}) => {
    const { data } = await api.get('/credentials', { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/credentials/${id}`);
    return data;
  },
  issueMaterialPassport: async (credentialData) => {
    const { data } = await api.post('/credentials/material-passport', credentialData);
    return data;
  },
  issueTestReport: async (credentialData) => {
    const { data } = await api.post('/credentials/test-report', credentialData);
    return data;
  },
  issueLCA: async (credentialData) => {
    const { data } = await api.post('/credentials/lca', credentialData);
    return data;
  },
  issueCertificate: async (credentialData) => {
    const { data } = await api.post('/credentials/certificate', credentialData);
    return data;
  },
  issueDPP: async (credentialData) => {
    const { data } = await api.post('/credentials/dpp', credentialData);
    return data;
  },
  issueHandover: async (credentialData) => {
    const { data } = await api.post('/credentials/handover', credentialData);
    return data;
  },
  issueRepair: async (credentialData) => {
    const { data } = await api.post('/credentials/repair', credentialData);
    return data;
  },
  revoke: async (id, reason) => {
    const { data } = await api.post(`/credentials/${id}/revoke`, { reason });
    return data;
  },
  verify: async (credentialId) => {
    const { data } = await api.post('/credentials/verify', { credentialId });
    return data;
  },
};

export const dppService = {
  create: async (dppData) => {
    const { data } = await api.post('/dpp/create', dppData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/dpp/${id}`);
    return data;
  },
  getCredentials: async (id) => {
    const { data } = await api.get(`/dpp/${id}/credentials`);
    return data;
  },
  assemble: async (id, componentCredentials) => {
    const { data } = await api.post(`/dpp/${id}/assemble`, { componentCredentials });
    return data;
  },
  transfer: async (id, toOrganizationId) => {
    const { data } = await api.post(`/dpp/${id}/transfer`, { toOrganizationId });
    return data;
  },
  append: async (id, eventData) => {
    const { data } = await api.post(`/dpp/${id}/append`, eventData);
    return data;
  },
  getHistory: async (id) => {
    const { data } = await api.get(`/dpp/${id}/history`);
    return data;
  },
};

export const testLabsService = {
  getRequests: async () => {
    const { data } = await api.get('/test-requests');
    return data;
  },
  getRequest: async (id) => {
    const { data } = await api.get(`/test-requests/${id}`);
    return data;
  },
  submitResults: async (resultData) => {
    const { data } = await api.post('/test-results', resultData);
    return data;
  },
  issueCredential: async (credentialData) => {
    const { data } = await api.post('/credentials/test-report', credentialData);
    return data;
  },
};

export const lcaService = {
  createProject: async (projectData) => {
    const { data } = await api.post('/lca/projects', projectData);
    return data;
  },
  getProject: async (id) => {
    const { data } = await api.get(`/lca/projects/${id}`);
    return data;
  },
  submitResults: async (resultData) => {
    const { data } = await api.post('/lca/results', resultData);
    return data;
  },
  getPending: async () => {
    const { data } = await api.get('/lca/pending-review');
    return data;
  },
  approve: async (id) => {
    const { data } = await api.post(`/lca/${id}/approve`);
    return data;
  },
};

export const certificationsService = {
  getPending: async () => {
    const { data } = await api.get('/certifications/pending');
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/certifications/${id}`);
    return data;
  },
  approve: async (id, certData) => {
    const { data } = await api.post(`/certifications/${id}/approve`, certData);
    return data;
  },
  revoke: async (id, reason) => {
    const { data } = await api.post(`/certifications/${id}/revoke`, { reason });
    return data;
  },
};

export const transactionsService = {
  create: async (txData) => {
    const { data } = await api.post('/transactions', txData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/transactions/${id}`);
    return data;
  },
};

export const assetHandoversService = {
  create: async (handoverData) => {
    const { data } = await api.post('/asset-handovers', handoverData);
    return data;
  },
  accept: async (id, data) => {
    const { data: result } = await api.post(`/asset-handovers/${id}/accept`, data);
    return result;
  },
};

export const assetsService = {
  get: async (id) => {
    const { data } = await api.get(`/assets/${id}`);
    return data;
  },
  getDPPs: async (id) => {
    const { data } = await api.get(`/assets/${id}/dpps`);
    return data;
  },
};

export const repairsService = {
  create: async (repairData) => {
    const { data } = await api.post('/repairs', repairData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/repairs/${id}`);
    return data;
  },
};

export const auditService = {
  createRequest: async (requestData) => {
    const { data } = await api.post('/audit/requests', requestData);
    return data;
  },
  getRequest: async (id) => {
    const { data } = await api.get(`/audit/requests/${id}`);
    return data;
  },
  approve: async (id, accessGrant) => {
    const { data } = await api.post('/audit/approve', { auditRequestId: id, accessGrant });
    return data;
  },
  submit: async (submissionData) => {
    const { data } = await api.post('/audit/submit', submissionData);
    return data;
  },
};

export const complianceService = {
  getRequirements: async (framework) => {
    const { data } = await api.get('/compliance/requirements', { params: { framework } });
    return data;
  },
  check: async (checkData) => {
    const { data } = await api.post('/compliance/check', checkData);
    return data;
  },
  collectPresentations: async (assetIds, credentialTypes) => {
    const { data } = await api.post('/compliance/presentations/collect', {
      assetIds,
      requiredCredentialTypes: credentialTypes,
    });
    return data;
  },
};

export const presentationsService = {
  request: async (requestData) => {
    const { data } = await api.post('/presentations/request', requestData);
    return data;
  },
  submit: async (submissionData) => {
    const { data } = await api.post('/presentations/submit', submissionData);
    return data;
  },
  verify: async (presentation) => {
    const { data } = await api.post('/presentations/verify', { presentation });
    return data;
  },
};

export const verificationsService = {
  verify: async (verificationData) => {
    const { data } = await api.post('/verifications', verificationData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/verifications/${id}`);
    return data;
  },
  getHistory: async (resourceType, resourceId) => {
    const { data } = await api.get(`/verifications/history/${resourceType}/${resourceId}`);
    return data;
  },
};

export const dismantlingService = {
  intake: async (intakeData) => {
    const { data } = await api.post('/dismantling/intake', intakeData);
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/dismantling/${id}`);
    return data;
  },
};

export const recyclingService = {
  intake: async (intakeData) => {
    const { data } = await api.post('/recycling/intake', intakeData);
    return data;
  },
  addEvent: async (eventData) => {
    const { data } = await api.post('/recycling/events', eventData);
    return data;
  },
  getStatus: async (id) => {
    const { data } = await api.get(`/recycling/${id}/status`);
    return data;
  },
};

export default api;
