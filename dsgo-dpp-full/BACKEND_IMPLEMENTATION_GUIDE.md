# DSGO/DPP MVP - Complete Backend Implementation Guide

## Architecture Overview

This is a **complete, production-ready backend** for the DSGO/DPP platform supporting all 13 user stories, real Credenco integration, iSHARE authentication, and multi-org flows.

### Tech Stack
- **Framework:** Express.js (Node.js)
- **Database:** PostgreSQL
- **Authentication:** OAuth 2.0 (iSHARE)
- **Credential Service:** Credenco Business Wallet API
- **Security:** JWT, API Keys, HTTPS

---

## 1. PROJECT STRUCTURE

```
dsgo-dpp-backend/
├── src/
│   ├── server.js                 # Express app & server startup
│   ├── database.js              # PostgreSQL connection pool
│   ├── config.js                # Environment & configuration
│   ├── middleware/
│   │   ├── auth.js              # iSHARE & API key authentication
│   │   ├── auditLog.js          # Audit trail logging
│   │   └── errorHandler.js      # Global error handling
│   ├── services/
│   │   ├── credencoService.js   # Credenco Wallet API integration
│   │   ├── ishareService.js     # iSHARE OAuth 2.0 & delegation
│   │   ├── credentialService.js # W3C VC creation & verification
│   │   ├── dppService.js        # DPP assembly & lifecycle
│   │   ├── verificationService.js # Credential verification
│   │   ├── auditService.js      # Audit request handling
│   │   └── complianceService.js # Compliance checking
│   ├── routes/
│   │   ├── organizations.js     # /orgs/* endpoints
│   │   ├── materials.js         # /materials/* & /lots/*
│   │   ├── products.js          # /products/* endpoints
│   │   ├── shipments.js         # /shipments/* (story 1, 14)
│   │   ├── credentials.js       # /credentials/* (all types)
│   │   ├── dpp.js               # /dpp/* (stories 2, 6-8, 11)
│   │   ├── testLabs.js          # /test-labs/* (story 3)
│   │   ├── lca.js               # /lca/* (stories 4-5)
│   │   ├── certifications.js    # /certifications/* (story 5)
│   │   ├── transactions.js      # /transactions/* (stories 7-8)
│   │   ├── assets.js            # /assets/* (stories 8, 10)
│   │   ├── repairs.js           # /repairs/* (story 11)
│   │   ├── audit.js             # /audit/* (story 12)
│   │   ├── dismantling.js       # /dismantling/* (story 13)
│   │   ├── recycling.js         # /recycling/* (story 14)
│   │   └── compliance.js        # /compliance/* (story 10)
│   ├── models/
│   │   └── index.js             # Data model definitions
│   ├── migrations/
│   │   ├── run.js               # Migration runner
│   │   └── 001-init.sql         # Database schema
│   └── utils/
│       ├── diddoc.js            # DID document generation
│       ├── vcBuilder.js         # W3C VC builder
│       └── validators.js        # Input validation
├── .env                          # Configuration (git-ignored)
├── .env.example                  # Example configuration
├── docker-compose.yml           # PostgreSQL + Redis
├── package.json
└── README.md
```

---

## 2. SETUP & INSTALLATION

### 2.1 Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+ (optional, for caching)
- Docker & Docker Compose (recommended)

### 2.2 Installation Steps

```bash
# Clone the repository
git clone <repo-url>
cd dsgo-dpp-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Start PostgreSQL (Docker)
docker-compose up -d

# Wait for PostgreSQL to be ready (10-15 seconds)
sleep 15

# Run database migrations
npm run migrate

# Start the server
npm run dev
```

---

## 3. ENVIRONMENT CONFIGURATION (.env)

```
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dsgo_dpp

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Credenco Integration
CREDENCO_BASE_URL=https://wallet.acc.credenco.com
CREDENCO_CLIENT_ID=<your-client-id>
CREDENCO_CLIENT_SECRET=<your-client-secret>
CREDENCO_ISSUER_TEMPLATE_ID=<issuer-template-id>

# Credenco Credential Templates
CREDENCO_TEMPLATE_MATERIAL_PASSPORT=<template-id>
CREDENCO_TEMPLATE_TEST_REPORT=<template-id>
CREDENCO_TEMPLATE_LCA=<template-id>
CREDENCO_TEMPLATE_CERTIFICATE=<template-id>
CREDENCO_TEMPLATE_DPP=<template-id>
CREDENCO_TEMPLATE_HANDOVER=<template-id>
CREDENCO_TEMPLATE_REPAIR=<template-id>

# iSHARE Integration
ISHARE_BASE_URL=https://scheme.ishare.eu
ISHARE_CLIENT_ID=<your-ishare-client-id>
ISHARE_CLIENT_SECRET=<your-ishare-client-secret>
ISHARE_PRIVATE_KEY_PATH=./keys/private.pem
ISHARE_PUBLIC_KEY_PATH=./keys/public.pem

# DPP Service
DPP_SERVICE_DID=did:web:dpp-service.example.com
DPP_SERVICE_PRIVATE_KEY=./keys/dpp-service-private.pem

# JWT
JWT_SECRET=<your-jwt-secret-min-32-chars>
JWT_EXPIRY=24h

# Audit
ENABLE_AUDIT_LOG=true
AUDIT_LOG_RETENTION_DAYS=365

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

---

## 4. DATABASE SCHEMA (PostgreSQL)

The schema includes 25+ tables covering all data models:

- **organizations** - All stakeholders (supplier, mfg, lab, etc.)
- **materials** - Material masters
- **material_lots** - Material batches
- **products** - Product masters
- **product_instances** - Individual product units
- **digital_product_passports** - DPP records (append-only)
- **credentials** - W3C VC storage
- **verification_records** - Verification audit trail
- **test_labs**, **test_requests**, **samples**, **test_results** - Story 3
- **lca_projects**, **lca_results**, **lca_documents** - Stories 4-5
- **shipments** - Story 1, 14
- **transactions** - Story 7
- **asset_handovers** - Story 8
- **assets** - Buildings/structures
- **audit_requests**, **audit_records** - Story 12
- **access_grants** - Access control
- **lifecycle_events** - Product event history
- **repair_records** - Story 11
- **compliance_requirements**, **compliance_results** - Story 10
- **audit_log** - Complete action trail

---

## 5. CORE SERVICES

### 5.1 Credenco Service (`credencoService.js`)

**Functions:**
- `issueCredential(templateId, claims, holderDid)` - Issue W3C VC
- `verifyCredential(credential)` - Verify signature & status
- `revokeCredential(credentialId)` - Revoke credential
- `createPresentation(credentials, verifier)` - OID4VP presentation

**Implementation Points:**
- OAuth 2.0 client credentials flow for token
- Template ID mapping for each credential type
- Error handling for rate limits & timeouts
- Credential caching in Redis

**Key Endpoints Called:**
```
POST /oauth2/token
POST /api/v2/credentials/issue
POST /api/v1/credentials/verify
POST /api/v1/credentials/{id}/revoke
POST /api/v1/oidc4vp/start
```

### 5.2 iSHARE Service (`ishareService.js`)

**Functions:**
- `getAccessToken()` - Get OAuth 2.0 access token
- `verifyDelegation(delegation)` - Validate delegation evidence
- `checkParticipant(did)` - Verify org in Participant Registry
- `createDelegation(grantedTo, scope)` - Create delegation evidence

**Implementation Points:**
- JWT token generation with private key
- Delegation evidence structure (XACML-style)
- Participant registry lookup
- Token caching with expiry

**Key Endpoints Called:**
```
POST https://scheme.ishare.eu/oauth2/token
GET https://scheme.ishare.eu/parties/{id}
POST https://scheme.ishare.eu/delegations
```

### 5.3 Credential Service (`credentialService.js`)

**Functions:**
- `createMaterialPassportCredential(lotData, issuer)` - Story 1
- `createTestReportCredential(testData, issuer)` - Story 3
- `createLCACredential(lcaData, issuer)` - Story 4
- `createProductCertificate(certData, issuer)` - Story 5
- `createDPPCredential(dppData, issuer)` - Story 2, 6
- `createAssetHandoverCredential(handoverData, issuer)` - Story 8
- `createRepairCredential(repairData, issuer)` - Story 11

**Implementation Points:**
- W3C VC 2.0 JSON-LD format
- BitstringStatusList for revocation
- Proof generation (Ed25519Signature2020)
- Subject ID binding (URN format)

### 5.4 DPP Service (`dppService.js`)

**Functions:**
- `createDPP(productInstance, credentials)` - Create new DPP
- `appendCredential(dppId, newCredential)` - Append-only update
- `transferDPP(dppId, fromOrg, toOrg)` - Transfer ownership
- `getDPPHistory(dppId)` - Get full DPP lifecycle
- `validateAppendOnly(dppId, newCred)` - Enforce immutability

**Critical Logic:**
- Append-only enforcement (no overwrites)
- Version incrementing (v1 → v2 → v3)
- Credential ordering
- Lifecycle stage transitions
- Access control checks

### 5.5 Verification Service (`verificationService.js`)

**Functions:**
- `verifyCredential(credential, verifier)` - Full verification
- `checkSignature(credential)` - Cryptographic validation
- `checkIssuerTrust(issuerDid)` - Trusted issuer registry
- `checkRevocation(credentialStatus)` - BitstringStatusList
- `checkSchema(credential, type)` - Schema validation
- `checkBinding(credential, subject)` - Subject binding

**Verification Checks:**
1. Signature validity (Ed25519)
2. Issuer in trusted registry
3. Credential not revoked
4. Schema matches type
5. Subject ID matches lot/product
6. Not expired

### 5.6 Audit Service (`auditService.js`)

**Functions:**
- `createAuditRequest(authority, target, scope)` - Story 12
- `grantAuditAccess(request, permissions)` - Time-bounded access
- `submitAuditPresentation(credentials, verifications)` - Authority review
- `recordAuditFinding(request, findings)` - Document audit results

**Audit Record Structure:**
```javascript
{
  auditRequestId,
  authorityId,
  targetOrgId,
  checkedCredentials: [credentialIds],
  verificationResults: { ... },
  findings: "Compliant" | "Non-compliant" | "Conditional",
  evidence: [attachments],
  checkedAt: timestamp
}
```

---

## 6. API ENDPOINTS (100+ endpoints across 13 stories)

### Story 1: Material Delivery (Supplier → Manufacturer)

```
POST   /api/v1/materials              Create material master
POST   /api/v1/lots                   Create material lot
GET    /api/v1/lots/:id               Get lot details
POST   /api/v1/shipments              Create shipment with credentials
GET    /api/v1/shipments/:id          Get shipment details
POST   /api/v1/credentials/verify     Verify MaterialPassportCredential
```

### Story 2: DPP Creation (Manufacturer)

```
POST   /api/v1/products               Create product master
POST   /api/v1/products/:id/bom       Add bill of materials
POST   /api/v1/dpp/create             Create DPP record
POST   /api/v1/credentials/dpp/issue  Request DPP credential from Credenco
GET    /api/v1/dpp/:id                Get DPP details
```

### Story 3: Test Lab Certification

```
POST   /api/v1/test-labs/register     Register test lab
POST   /api/v1/test-requests          Submit test request
POST   /api/v1/samples                Register sample
POST   /api/v1/test-results           Record test result
POST   /api/v1/credentials/test/issue Issue TestReportCredential
GET    /api/v1/test-requests/:id      Get test status
```

### Story 4: LCA Execution

```
POST   /api/v1/lca/projects           Create LCA project
POST   /api/v1/lca/results            Record LCA results
POST   /api/v1/lca/documents          Upload LCA document
POST   /api/v1/credentials/lca/issue  Issue ProductEnvironmentalCredential
GET    /api/v1/lca/projects/:id       Get LCA project
```

### Story 5: Certification Review

```
GET    /api/v1/lca/pending-review     Get pending LCA reports
POST   /api/v1/certifications/approve Approve LCA & issue certificate
POST   /api/v1/credentials/cert/issue Issue ProductCertificate
GET    /api/v1/certifications/:id     Get certificate details
```

### Story 6: DPP Assembly

```
GET    /api/v1/dpp/:id/credentials    Get all credentials for DPP
POST   /api/v1/dpp/:id/assemble       Assemble DPP from credentials
GET    /api/v1/dpp/:id/verification   Get verification summary
```

### Story 7: Product Transfer (Manufacturer → Construction)

```
POST   /api/v1/transactions           Create product transaction
GET    /api/v1/transactions/:id       Get transaction details
POST   /api/v1/dpp/:id/transfer       Transfer DPP ownership
POST   /api/v1/presentations/request  Request presentation for transfer
GET    /api/v1/dpp/:id/history        Get DPP custody chain
```

### Story 8: Project Handover (Construction → Building Owner)

```
POST   /api/v1/asset-handovers        Create asset handover
GET    /api/v1/asset-handovers/:id    Get handover details
POST   /api/v1/assets                 Create asset (building) record
POST   /api/v1/dpp/:id/accept-handover Accept DPP into portfolio
GET    /api/v1/assets/:id/dpps        Get all DPPs for asset
```

### Story 10: Compliance Verification (Building Owner)

```
GET    /api/v1/compliance/requirements Get compliance rules
POST   /api/v1/compliance/check        Run compliance check
GET    /api/v1/compliance/results/:id  Get compliance result
POST   /api/v1/presentations/collect   Collect proofs from DPP holders
```

### Story 11: Repair & DPP Update (Maintenance)

```
POST   /api/v1/access-grants          Request append access
GET    /api/v1/access-grants/:id      Get access grant
POST   /api/v1/repairs                Record repair event
POST   /api/v1/credentials/repair/issue Issue RepairCredential
POST   /api/v1/dpp/:id/append         Append credential to DPP (append-only)
GET    /api/v1/dpp/:id/versions       Get DPP version history
```

### Story 12: Regulatory Audit

```
POST   /api/v1/audit/requests         Create audit request
GET    /api/v1/audit/requests/:id     Get audit request
POST   /api/v1/audit/approve          Grant audit access
POST   /api/v1/presentations/audit    Submit credentials for audit
POST   /api/v1/audit/records          Record audit findings
GET    /api/v1/audit/records/:id      Get audit record
```

### Story 13: Dismantling

```
GET    /api/v1/dpp/:id/for-dismantling Get DPP for dismantling
POST   /api/v1/dismantling/intake     Register dismantling intake
POST   /api/v1/dismantling/outcomes   Record dismantling results
POST   /api/v1/lifecycle-events       Record lifecycle event
```

### Story 14: Recycling

```
GET    /api/v1/lots/:id/recyclability Get recycling information
POST   /api/v1/recycling/intake       Register material for recycling
POST   /api/v1/recycling/events       Record EPCIS event (optional)
GET    /api/v1/recycling/status/:id   Get recycling status
```

### Cross-Cutting

```
GET    /api/v1/orgs/:id               Get organization details
POST   /api/v1/auth/token             Get iSHARE access token
GET    /api/v1/dpp/:id                Get DPP (with all credentials)
GET    /api/v1/audit-log              Get audit trail (admin)
POST   /api/v1/presentations/verify   Verify presentation
```

---

## 7. AUTHENTICATION & AUTHORIZATION

### 7.1 iSHARE Authentication Flow

```
1. Client requests access token
   POST /api/v1/auth/token
   {
     "client_id": "urn:example:client",
     "client_secret": "...",
     "grant_type": "client_credentials"
   }

2. Server requests iSHARE token
   POST https://scheme.ishare.eu/oauth2/token
   With JWT assertion (signed with private key)

3. iSHARE returns access token
   { "access_token": "...", "expires_in": 3600 }

4. Server adds token to request headers
   Authorization: Bearer <iSHARE-token>

5. Server validates delegation
   - Check if requester has delegation for scope
   - Verify signature of delegation evidence
   - Check Participant Registry for validity
```

### 7.2 API Key Authentication (Fallback)

For simpler scenarios:

```
GET /api/v1/dpp/123
Authorization: Bearer sk_live_xxxxx

Middleware checks:
1. Extract API key from header
2. Lookup organization by API key
3. Verify organization status (active)
4. Attach org context to request
```

### 7.3 Access Control

```javascript
// Append-only enforcement
app.post('/api/v1/dpp/:id/append', async (req, res) => {
  const dpp = await getDPP(req.params.id);
  
  // Only allow APPEND, never OVERWRITE
  if (req.body.action === 'overwrite') {
    return res.status(403).json({ error: 'DPP is append-only' });
  }
  
  // Check permissions
  const grant = await getAccessGrant(req.org.id, dpp.currentHolderId);
  if (!grant || !grant.permissions.includes('append')) {
    return res.status(403).json({ error: 'No append permission' });
  }
  
  // Append new credential (create new version)
  const newVersion = await appendCredentialToDPP(dpp, req.body.credential);
  res.json(newVersion);
});
```

---

## 8. MIDDLEWARE STACK

### 8.1 Authentication Middleware

```javascript
// Authenticate & attach org context
app.use(authMiddleware);

// Validates iSHARE token OR API key
// Sets req.org = { id, did, role, ... }
```

### 8.2 Audit Logging Middleware

```javascript
// Log every API call to audit_log table
app.use(auditLogMiddleware);

// Captures:
// - Actor (organization ID)
// - Action (HTTP method + path)
// - Resource (table name, ID)
// - Changes (request body)
// - Timestamp
```

### 8.3 Error Handler Middleware

```javascript
app.use(errorHandler);

// Handles:
// - Validation errors (422)
// - Authentication errors (401)
// - Authorization errors (403)
// - Not found (404)
// - Server errors (500)
// Returns consistent error format:
// { error, code, timestamp, traceId }
```

---

## 9. KEY IMPLEMENTATION DETAILS

### 9.1 W3C VC 2.0 Credential Structure

```javascript
const credential = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2"
  ],
  "type": ["VerifiableCredential", "MaterialPassportCredential"],
  "issuer": "did:web:supplier.example.com",
  "validFrom": "2024-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "urn:lot:LOT-2024-001",
    "materialId": "MAT-AL-7075",
    "batchNumber": "BATCH-001",
    // ... material-specific claims
  },
  "credentialStatus": {
    "id": "https://supplier.example.com/status/list#0",
    "type": "BitstringStatusListEntry",
    "statusPurpose": "revocation"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2024-01-01T00:00:00Z",
    "verificationMethod": "did:web:supplier.example.com#key-1",
    "signatureValue": "..."
  }
}
```

### 9.2 Append-Only DPP Enforcement

```javascript
// DPP version history (never modified)
const dppHistory = [
  { version: "v1", credentials: [cred1, cred2], timestamp: "..." },
  { version: "v2", credentials: [cred1, cred2, cred3], timestamp: "..." },
  { version: "v3", credentials: [cred1, cred2, cred3, cred4], timestamp: "..." }
];

// When appending:
// 1. Copy all existing credentials
// 2. Add new credential to end
// 3. Create new version record
// 4. Never modify existing credentials

// This ensures:
// - Full auditability
// - Immutable history
// - Verifiable chain of custody
```

### 9.3 Multi-Org Access Control

```javascript
// Each org has:
// - DID (decentralized identifier)
// - iSHARE delegation evidence
// - Access grants (time-bounded, scoped)

// To perform action on DPP:
const canAccess = (org, dpp, action) => {
  // 1. Check if org is current holder
  if (dpp.currentHolder === org.id) return true;
  
  // 2. Check access grant
  const grant = getAccessGrant(org.id, dpp.currentHolder);
  if (!grant) return false;
  
  // 3. Check grant validity
  if (grant.validUntil < now()) return false;
  
  // 4. Check permission for action
  return grant.permissions.includes(action);
};
```

### 9.4 Audit Trail

```javascript
// Every action creates audit log entry:
const auditEntry = {
  id: uuid(),
  action: "credential_verified",
  actor_id: orgId,
  resource_type: "credential",
  resource_id: credentialId,
  changes: {
    signature_valid: true,
    issuer_trusted: true,
    status: "passed"
  },
  timestamp: now()
};

// Enables:
// - Full traceability
// - Compliance reporting
// - Forensic analysis
// - Regulatory audits
```

---

## 10. DEPLOYMENT

### 10.1 Docker Compose

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dsgo_dpp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    volumes:
      - ./keys:/app/keys:ro

volumes:
  postgres_data:
```

### 10.2 Deployment Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# With Docker
docker-compose up -d

# Run migrations
npm run migrate

# View logs
docker-compose logs -f backend
```

---

## 11. TESTING & VALIDATION

### 11.1 Test Organizations (Seed Data)

```javascript
const orgs = [
  { name: "Arconic", role: "Supplier", did: "did:web:arconic.example.com" },
  { name: "Alkondor", role: "Manufacturer", did: "did:web:alkondor.example.com" },
  { name: "Eurofins", role: "TestLab", did: "did:web:eurofins.example.com" },
  { name: "Alba Concepts", role: "LCAOrganisation", did: "did:web:alba.example.com" },
  { name: "SKG-IKOB", role: "CertificationBody", did: "did:web:skg-ikob.example.com" },
  { name: "Heijmans", role: "ConstructionCompany", did: "did:web:heijmans.example.com" },
  { name: "BuildingOwner Corp", role: "BuildingOwner", did: "did:web:owner.example.com" },
  { name: "Maintenance Inc", role: "MaintenanceCompany", did: "did:web:maintenance.example.com" },
  { name: "Environmental Authority", role: "RegulatoryAuthority", did: "did:web:authority.example.com" },
  { name: "Lagemaat", role: "DismantlingCompany", did: "did:web:lagemaat.example.com" },
  { name: "RecyclerCorp", role: "Recycler", did: "did:web:recycler.example.com" }
];
```

### 11.2 Test Flow (All 13 Stories)

```bash
# Story 1: Material Delivery
curl -X POST http://localhost:3000/api/v1/lots \
  -H "Authorization: Bearer <arconic-token>" \
  -d '{"materialId":"MAT-AL-7075","batchNumber":"BATCH-001"}'

# Story 3: Test Lab Certification
curl -X POST http://localhost:3000/api/v1/test-requests \
  -H "Authorization: Bearer <alkondor-token>" \
  -d '{"labId":"...","lotId":"..."}'

# ... and so on for all stories
```

---

## 12. MONITORING & MAINTENANCE

### 12.1 Health Check

```
GET /health
Response: { status: "ok", timestamp, uptime, db: "connected" }
```

### 12.2 Metrics

- Credential issuance rate
- Verification latency (target < 200ms)
- DPP transfer throughput
- Audit log growth (retention: 1 year)
- iSHARE token refresh rate

### 12.3 Common Issues

| Issue | Solution |
|-------|----------|
| Credenco API timeouts | Implement retry logic with exponential backoff |
| iSHARE token expired | Refresh token before expiry (720s) |
| Database connection pool exhausted | Scale pool or optimize queries |
| Append-only violation | Enforce at application & database level |

---

## 13. SECURITY CHECKLIST

- [ ] All secrets in .env (never in code)
- [ ] HTTPS only in production
- [ ] CORS restricted to known frontends
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input validation)
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for privileged operations
- [ ] API keys rotated quarterly
- [ ] Private keys secured (encrypted, restricted permissions)
- [ ] Database backups automated daily
- [ ] iSHARE delegation evidence validated
- [ ] Append-only DPP enforced at DB & app layer

---

## 14. NEXT STEPS

1. **Setup PostgreSQL & Redis** via docker-compose
2. **Run migrations** to create schema
3. **Configure Credenco** (get API credentials, template IDs)
4. **Configure iSHARE** (get participant ID, private key)
5. **Seed test organizations** (run npm run seed)
6. **Test each story** with provided curl commands
7. **Deploy frontends** (11 separate React apps)
8. **Load test** for production readiness

---

## 15. REFERENCES

- [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)
- [Credenco Business Wallet API](https://docs.acc.credenco.com)
- [iSHARE Technical Specifications](https://framework.ishare.eu)
- [DSGO Specification](./docs/spec/)