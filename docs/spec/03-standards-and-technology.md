# 03 — Standards and Technology

## Core Standards

| Standard | Purpose in this platform |
|----------|--------------------------|
| **W3C Verifiable Credentials Data Model 2.0** | Cryptographically verifiable claims for all credentials exchanged in the chain |
| **Decentralized Identifiers (DID) — W3C** | Identifying organisations and products; used as subject and issuer IDs in all VCs |
| **OpenID for Verifiable Presentations (OID4VP)** | Exchanging verifiable presentations between holders and verifiers |
| **Ed25519 (EdDSA)** | Human identity layer — each user holds an Ed25519 keypair for signing Verifiable Credentials and attributing actions to a named individual within an organisation |
| **iSHARE Trust Framework** | B2B inter-organisational identity only: participant registry, public certificate lookup, and delegation evidence between organisations. Not used for human session auth. |
| **GS1 EPCIS 2.0** | Optional — traceability events in the chain (used in user story 14) |
| **BitstringStatusList** | Revocation and status management for issued credentials |
| **ISO/IEC 17025** | Accreditation standard for test laboratories |
| **ISO 14040 / ISO 14044 / EN 15804** | LCA methodology standards for environmental credentials |
| **ISO 6892-1** | Tensile strength testing method referenced in TestReportCredential |

## Standards per User Story

| User Story | Actor(s) | Primary Standards |
|------------|----------|-------------------|
| 1 | Supplier → Manufacturer | W3C VC 2.0, DID, REST |
| 2 | Manufacturer → DPP creation | W3C VC 2.0, DID, REST |
| 3 | Test lab → Manufacturer | W3C VC 2.0, DID, ISO/IEC 17025 |
| 4 | LCA organisation → Supplier/Manufacturer | W3C VC 2.0, ISO 14040/14044/EN 15804 |
| 5 | Certification body → Manufacturer | W3C VC 2.0, DID |
| 6 | Manufacturer assembles composite DPP | W3C VC 2.0 |
| 7 | Manufacturer → Construction company | W3C VC 2.0, OID4VP |
| 8 | Construction company → Building owner | W3C VC 2.0, OID4VP |
| 10 | Building owner — compliance check | W3C VC 2.0, OID4VP |
| 11 | Maintenance company — DPP update | W3C VC 2.0, DID (append-only) |
| 12 | Authority — audit | W3C VC 2.0, OID4VP |
| 13 | Dismantling company | W3C VC 2.0 |
| 14 | Recycler | W3C VC 2.0, GS1 EPCIS 2.0 |

## Identity: Two Layers

This platform uses two separate and independent identity layers. See **AUTH_ARCHITECTURE.md** for full detail.

### Layer 1 — Human Identity (Ed25519)

Each human user holds an Ed25519 keypair used for **signing Verifiable Credentials** — not for UI session login. When a user (e.g. a LabTechnician) issues a credential, their Ed25519 key signs it. The employee's public key is registered in the organisation's DID document as an authorised delegate, so verifiers can validate the signature by resolving the org's DID — without needing the employee's key distributed separately.

UI session auth is separate and simple: a username lookup returns a platform JWT encoding `{ userId, organisationId, role }`. For the hackathon, this is a mock flow (type "supplier1", get taken to the supplier screen).

This layer handles: VC signing attribution, and proof that a named individual within an org authorised a given credential issuance.

### Layer 2 — Organisational Identity (iSHARE / X.509 PKI)

iSHARE is a **B2B inter-organisational trust framework** — it is not involved in human login. It is invoked in three specific situations:

1. **Verifying a counterparty org** — confirming an EORI is a registered DSGO participant (participant registry lookup)
2. **Public certificate lookup** — fetching an org's X.509 certificate to verify the signature on a JWT they sent
3. **Delegation evidence** — Org A signs a JWT (with their X.509 private key) granting Org B access to a specific resource; the backend verifies it using Org A's public cert

**Key technical building blocks:**

- **PKI and X.509 certificates (x5c)** — RS256/ES256 JWT signing for inter-org tokens
- **JWT with x5c header** — org-to-org assertions and delegation evidence
- **XACML (JSON port)** — delegation policies and access control rules
- **Participant Registry** — maps EORI → verified org + public certificate
- **OAuth 2.0 client credentials** — used only when calling iSHARE's own APIs (e.g. the participant registry requires a client assertion token)

**Delegation model:** Org A (e.g. Building Owner) signs a delegation JWT granting Org B (e.g. Maintenance Company) read access to a specific DPP. Org B presents this when requesting the resource. The backend verifies by fetching Org A's public cert from iSHARE (or local simulation store) and checking the signature and policy.

**Hackathon constraint:** Only one real iSHARE identity (EORI + cert) is available. The remaining 10 simulated organisations use locally-generated RSA keypairs and self-signed certs stored in the database. `ISHARE_SIMULATION_MODE=true` routes cert lookups to the local store instead of the live iSHARE registry.

**Reference:** framework.ishare.eu

## Credenco Business Wallet

The Credenco Business Wallet is the credential issuance and verification platform used by the DPP service provider (Credenco/Quintessence Research). It supports:

- **Issuer** — issue Verifiable Credentials to other organisations or products
- **Holder** — store credentials in an organisation wallet
- **Verifier** — receive and validate credentials from other parties

It implements OpenID4VC and W3C Verifiable Credentials, and exposes a REST API for backend integration.

See **15-credenco-wallet-integration.md** for integration details.
