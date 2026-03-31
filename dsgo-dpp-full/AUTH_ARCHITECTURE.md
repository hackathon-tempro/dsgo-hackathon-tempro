# Authentication & Identity Architecture

This document describes the identity model used in the platform: how human actors and organisations are identified, how Verifiable Credentials are signed and attributed, and what is needed (or not needed) for the hackathon frontend.

---

## Overview: Two Identity Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Human Identity (Ed25519)                             │
│                                                                 │
│  Who is acting?  Individual employee within an organisation     │
│  Key type:       Ed25519 keypair                                │
│  Stored in:      Credenco wallet (or locally generated)         │
│  Used for:       Signing Verifiable Credentials on behalf of    │
│                  their organisation (NOT for UI session auth)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2 — Organisational Identity (X.509 / iSHARE)             │
│                                                                 │
│  Which organisation is acting?                                  │
│  Key type:       X.509 certificate + RSA/EC PEM private key    │
│  Stored in:      Credenco wallet (or local certs directory)    │
│  Used for:       iSHARE participant verification and            │
│                  inter-org delegation evidence                  │
└─────────────────────────────────────────────────────────────────┘
```

Both layers can be stored in the Credenco wallet. Credenco provides signing services for both.

---

## Layer 1 — Human Identity (Ed25519): VC Signing

### What it is

Ed25519 keys are used to **sign Verifiable Credentials**, not to manage UI sessions. When a LabTechnician issues a TestReportCredential, the credential proof is signed with their Ed25519 key. The recipient can verify the signature is valid and trace it back to the issuing organisation.

### The linking problem

A third party verifying a credential knows the issuing organisation but will not have the employee's public key stored anywhere. The solution is to link the employee's key to the organisation's identity through one of two mechanisms:

**Option A — DID Document delegation (recommended for W3C VC)**

The organisation holds a DID (e.g. `did:web:supplier.com`). Their DID Document lists multiple `verificationMethod` entries: the org's main key and any employee keys they have registered as authorised delegates.

```json
{
  "id": "did:web:supplier.com",
  "verificationMethod": [
    {
      "id": "did:web:supplier.com#org-key-1",
      "type": "JsonWebKey2020",
      "publicKeyJwk": { ... }
    },
    {
      "id": "did:web:supplier.com#alice-lab-key-1",
      "type": "JsonWebKey2020",
      "controller": "did:web:supplier.com",
      "publicKeyJwk": { ... }   ← Alice's Ed25519 public key
    }
  ]
}
```

The VC proof references: `"verificationMethod": "did:web:supplier.com#alice-lab-key-1"`.

The verifier resolves the org's DID document, finds Alice's key listed there under the org's authority, and verifies the signature. The verifier only needs to trust the org's DID — not know Alice's key in advance. The org's DID document is the trust anchor.

**Option B — X.509 certificate chain**

The org acts as a CA and issues Alice an X.509 certificate signed with the org's root cert. Alice signs the VC with her key and includes her cert chain in the `x5c` header. The verifier validates the chain up to the org's root cert, which is the only key they need to trust.

If you wanted to implement this:

1. Generate an org root CA keypair (RSA-2048 or EC P-256). Self-sign a root cert — this becomes the org's trust anchor.
2. For each employee, generate an Ed25519 keypair and issue them a leaf X.509 cert signed by the org root: `openssl req -new -key alice.pem | openssl x509 -req -CA org-root.crt -CAkey org-root.key -out alice.crt`
3. When Alice signs a VC, her proof includes the `x5c` header containing `[alice.crt, org-root.crt]` (leaf first, root last).
4. The verifier extracts the chain from `x5c`, validates it (leaf signed by root), then verifies the VC signature against Alice's public key from the leaf cert. Trust is anchored to the org root cert — which the verifier already holds or can look up via iSHARE.

The main trade-off vs Option A: requires running a lightweight CA (even `openssl ca` in a script works for a hackathon), but avoids needing to update a live DID document each time an employee is added or removed. For this project the Credenco wallet already holds the org's X.509 key, so the CA step is the only addition.

### Practical approach for this hackathon

The simplest and fully correct approach is: **Credenco signs all VCs with the organisation's key**. The employee's Ed25519 key is used only to authenticate the employee to the platform (or to Credenco directly), which then issues the VC signed under the org's wallet key. The employee's identity is recorded as a claim inside the credential, not in the proof.

```json
{
  "credentialSubject": {
    "id": "did:web:supplier.com",
    "...": "...",
    "authorisedBy": {
      "name": "Alice van Berg",
      "role": "LabTechnician",
      "employeeId": "user-uuid-123"
    }
  },
  "proof": {
    "type": "JsonWebSignature2020",
    "verificationMethod": "did:web:supplier.com#org-key-1",
    "jws": "..."
  }
}
```

The verifier validates the proof against the org's key. They read `authorisedBy` to know which employee authorised the issuance. No per-employee public key lookup required. This is the recommended path.

If per-employee signing is required later, Option A (DID document delegation) is the correct W3C-native approach.

---

## Layer 2 — Organisational Identity (iSHARE / X.509 PKI)

### What iSHARE is

iSHARE is a **B2B inter-organisational trust framework**. It is not involved in human session auth or VC signing. It is invoked in three specific situations:

| Situation | What happens |
|---|---|
| Verify a counterparty org | Query participant registry: is this EORI a registered DSGO member? |
| Public certificate lookup | Given an EORI, fetch the org's X.509 cert to verify a signed token |
| Delegation evidence | Org A signs a JWT granting Org B access to a specific resource; backend verifies using Org A's cert |

### Delegation evidence

```json
{
  "delegationEvidence": {
    "policyIssuer": "EU.EORI.NL000000001",    ← Building Owner's EORI
    "target": {
      "accessSubject": "EU.EORI.NL000000008"  ← Maintenance Company's EORI
    },
    "policySets": [{
      "policies": [{
        "rules": [{
          "effect": "Permit",
          "action": { "names": ["read"] },
          "resource": { "values": ["dpp:abc-123"] }
        }]
      }]
    }],
    "notBefore": "...",
    "notOnOrAfter": "..."
  }
}
```

Signed by Building Owner using their X.509 private key (stored in Credenco). Maintenance Company presents this when requesting the DPP. Backend verifies the signature using Building Owner's public cert (from iSHARE registry or simulation store).

### Hackathon constraint: one real iSHARE identity

Only one real EORI + X.509 cert/key is available. The remaining 10 simulated organisations use locally-generated RSA keypairs and self-signed certs stored in the database.

`ISHARE_SIMULATION_MODE=true` routes cert lookups to the local store. All delegation evidence signing and verification works identically — just against local certs rather than the live iSHARE registry.

```
Real iSHARE identity (1):
  Real EORI, real X.509 cert + PEM key
  Used when ISHARE_SIMULATION_MODE=false

Simulated organisations (10):
  Simulated EORIs (EU.EORI.SIM000000001 etc.)
  Locally-generated RSA-2048 keypair + self-signed cert
  Generated at seed time, stored in organisations table
```

---

## Frontend Auth: Role Selector Only

For the hackathon, the unified frontend does not need real authentication. The login screen is a role selector:

```
┌─────────────────────────────────┐
│  Enter username:  [ supplier1 ] │
│                  [ Login ]      │
└─────────────────────────────────┘
```

The backend looks up the username in the seed data, returns a platform JWT with `{ userId, organisationId, role }`. No password verification, no cryptographic challenge. This is sufficient to demonstrate the full DPP lifecycle — the meaningful cryptography is at the VC layer (Credenco signing), not the session layer.

If a proper session layer is added later, the correct approach is username/password → bcrypt verify → platform JWT. The Ed25519 challenge-response pattern is not needed for session auth in this context.

---

## Summary: What Goes Where

| Concern | Mechanism | Stored in |
|---|---|---|
| UI session / role routing | Username lookup → platform JWT (HS256) | DB (users table) |
| VC signing (org level) | Credenco wallet, org's key | Credenco |
| VC attribution (who signed) | `authorisedBy` claim in credential subject | VC itself |
| Employee-to-org key linking | DID document delegation (Option A) or X.509 chain (Option B) | DID document or cert |
| Inter-org B2B trust | iSHARE X.509 PKI, delegation evidence JWT | Credenco + iSHARE registry |
| Org identity for non-registered orgs | Locally generated self-signed cert | `organisations` table |

---

## Known Issues in Current Code

| File | Issue |
|---|---|
| `server.js:79` | Calls `credencoService.testConnection()` — method does not exist |
| `server.js:247` | Calls `credencoService.handleCredencoWebhook(payload)` — method is `handleWebhook(payload, signature)` |
| `credencoService.js:78` | VC context is VC 1.1 (`/2018/credentials/v1`) — should be VC 2.0 (`/ns/credentials/v2`) |
| `credencoService.js:92` | `credentialStatus.type` is `RevocationList2020Status` — should be `BitstringStatusList` |
| `ishareService.js` | `ISHARE_CLIENT_SECRET` in env is wrong — iSHARE uses PKI assertion auth, not a secret |
| `auth.js` | Empty — needs implementing (simple username lookup → JWT for hackathon) |
| (missing) | `ISHARE_SIMULATION_MODE` flag not yet implemented |
