# Architecture Overview

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │          Unified Frontend  (port 3001)                  │   │
│   │                                                         │   │
│   │   /login  →  Role Selector                             │   │
│   │                    │                                    │   │
│   │         ┌──────────▼──────────┐                        │   │
│   │         │   Role-based Router │                        │   │
│   │         └──┬──┬──┬──┬──┬──┬──┘                        │   │
│   │  views/    │  │  │  │  │  │  └─ recycler/             │   │
│   │  supplier/ │  │  │  │  │  └──── dismantling-company/  │   │
│   │  manufacturer/ │  │  │  └─────── regulatory-authority/ │   │
│   │  test-lab/ │   │  │  └────────── maintenance-company/  │   │
│   │  lca-org/  │   │  └───────────── building-owner/       │   │
│   │  certification-body/  └────────── construction-company/ │   │
│   │                                                         │   │
│   │         Shared: DPPViewer, CredentialCard,             │   │
│   │                 VerificationBadge, Timeline             │   │
│   └────────────────────────┬────────────────────────────────┘   │
└────────────────────────────│────────────────────────────────────┘
                             │  HTTP REST  /api/v1/*
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API  (port 3000)                     │
│                    Express.js / Node.js                         │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Middleware │   │   Routes     │   │      Services        │ │
│  │             │   │  (20 files,  │   │                      │ │
│  │  auditLog   │──▶│  ~100 ep.)   │──▶│  credentialService   │ │
│  │  auth*      │   │              │   │  dppService          │ │
│  │  errorHandler   │  /materials  │   │  verificationService │ │
│  │  validation │   │  /products   │   │  auditService        │ │
│  │             │   │  /dpp        │   │  complianceService   │ │
│  └─────────────┘   │  /credentials│   │                      │ │
│                    │  /audit ...  │   │  credencoService ──┐  │ │
│                    └──────────────┘   │  ishareService  ──┐│  │ │
│                                       └───────────────────┼┼──┘ │
│                                                           ││     │
└───────────────────────┬───────────────────────────────────┼┼─────┘
                        │                                   ││
                        ▼                                   ││
              ┌─────────────────┐                           ││
              │   PostgreSQL    │                           ││
              │   (port 5432)   │                           ││
              │                 │                           ││
              │  credentials    │                           ││
              │  organizations  │                           ││
              │  digital_product│                           ││
              │  _passports     │                           ││
              │  delegation_    │                           ││
              │  evidences ...  │                           ││
              └─────────────────┘                           ││
                                                            ││
                    ┌───────────────────────────────────────┘│
                    │           ┌────────────────────────────┘
                    ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                           │
│                                                                 │
│   ┌───────────────────────────┐  ┌────────────────────────────┐ │
│   │  Credenco Business Wallet │  │   iSHARE Trust Framework   │ │
│   │  business-wallet-api.     │  │   trusted-list.ishare.eu   │ │
│   │  credenco.com             │  │                            │ │
│   │                           │  │   - Participant registry   │ │
│   │  - OAuth2 token           │  │   - /connect/token (B2B)   │ │
│   │  - Issue W3C VC           │  │   - Delegation endpoint    │ │
│   │  - Verify credential      │  │   - Certificate lookup     │ │
│   │  - Revoke credential      │  │                            │ │
│   │  - Create DID             │  │   Auth: RS256 JWT          │ │
│   │  - Webhook events         │  │   client assertions        │ │
│   └───────────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## External Integration Evaluation

### Credenco Business Wallet — Partial ⚠️

**What's properly implemented (`src/services/credencoService.js`):**
- OAuth 2.0 client credentials flow with in-memory token caching
- Credential issuance, verification, revocation, and status check — all wired to the real API
- Presentation request creation and verification (OID4VP)
- Webhook signature verification (HMAC-SHA256)
- DID creation per organization
- Dual-write: credential metadata stored in local PostgreSQL alongside Credenco response

**Known bugs:**

| Bug | Location | Impact |
|---|---|---|
| `credencoService.testConnection()` is called but does not exist on the class | `server.js:79, 342` | Server health check throws if `FEATURE_CREDENCO_ENABLED=true` |
| Webhook handler called as `credencoService.handleCredencoWebhook(payload)` — actual method name is `handleWebhook(payload, signature)` | `server.js:247` | Webhook endpoint always throws; signature is never verified |

**Spec mismatches:**
- VC context URL is `https://www.w3.org/2018/credentials/v1` (VC 1.1) — project spec requires VC 2.0 (`https://www.w3.org/ns/credentials/v2`)
- `credentialStatus.type` is `RevocationList2020Status` — project spec requires `BitstringStatusList`

---

### iSHARE Trust Framework — Skeleton only ⚠️

**What's properly implemented (`src/services/ishareService.js`):**
- JWT client assertion (RS256 with x5c) — correct for calling iSHARE's own APIs
- Delegation evidence creation and signing (JWT, RS256)
- Delegation evidence verification against issuer's public certificate
- Participant registry queries
- `testConnection()` exists and is correctly called from the health check

**Scope misunderstanding:**

iSHARE is a B2B inter-organisational trust framework — it is not the mechanism for validating incoming API requests from human users. See `AUTH_ARCHITECTURE.md` for the correct two-layer model (platform JWT session auth + iSHARE B2B delegation evidence).

**auth.js needs two layers:**
- Layer 1 (every request): verify a platform JWT (HS256) issued after username lookup. Currently empty. This is a simple mock for the hackathon — no crypto at login time.
- Layer 2 (cross-org delegation endpoints only): verify an iSHARE delegation evidence JWT in `X-Delegation-Evidence` header. Fetch issuer's cert from iSHARE or local sim store.

**Other gaps:**
- `ISHARE_CLIENT_SECRET` in env is wrong — iSHARE uses PKI assertion auth, not a secret
- `ISHARE_SIMULATION_MODE` flag not yet implemented — needed for the 10 orgs not registered in iSHARE
- Certificate lookup endpoint pattern needs verifying against iSHARE's actual API docs

---

## Summary

| Component | Status | Blocker? |
|---|---|---|
| Credenco — service logic | ~80% — good structure, 2 name bugs, VC spec version wrong | Fix before demo |
| iSHARE — service logic | ~70% — delegation + registry correct; scope misunderstood as user auth | Fix scope; add sim mode |
| `auth.js` middleware | 0% — empty; needs platform JWT session layer + iSHARE delegation evidence layer | Yes — all auth is a no-op |
| API routes | ~5% — stubs only, no business logic calls services | Yes — nothing works end-to-end yet |
| Unified frontend | 0% — not yet built | Yes — needed for demo |

**Immediate priorities to unblock end-to-end flow:**
1. Fix `credencoService` method names (`testConnection`, `handleWebhook`)
2. Implement `auth.js` — Layer 1 (platform JWT session auth) and Layer 2 (iSHARE delegation evidence, sim mode)
3. Implement API route handlers (Phase 3) so services are actually called
