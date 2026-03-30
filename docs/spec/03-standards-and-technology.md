# 03 — Standards and Technology

## Core Standards

| Standard | Purpose in this platform |
|----------|--------------------------|
| **W3C Verifiable Credentials Data Model 2.0** | Cryptographically verifiable claims for all credentials exchanged in the chain |
| **Decentralized Identifiers (DID) — W3C** | Identifying organisations and products; used as subject and issuer IDs in all VCs |
| **OpenID for Verifiable Presentations (OID4VP)** | Exchanging verifiable presentations between holders and verifiers |
| **iSHARE Trust Framework** | Identification, authentication, and authorisation between DSGO participants; delegation evidence |
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

## iSHARE Trust Framework

The iSHARE Trust Framework provides the identification, authentication, and authorisation layer for all machine-to-machine (M2M) and human-to-machine (H2M) data exchange between DSGO participants.

**Key technical building blocks:**

- **PKI and digital certificates** — authentication of parties and machines
- **OAuth 2.0 / OpenID Connect** — access token flows, extended with iSHARE delegation evidence
- **JWT** — non-repudiation for data exchanged in the iSHARE context
- **XACML (JSON port)** — delegation policies and access control rules
- **Participant Registry** — central registry to verify whether a counterparty is an admitted iSHARE/DSGO member

**Delegation model:** A party unknown to a service provider can still receive data if a known "Entitled Party" has registered a delegation for them at an Authorisation Registry. This allows data exchange without prior bilateral contracts — critical for multi-party DPP workflows.

**Reference:** framework.ishare.eu

## Credenco Business Wallet

The Credenco Business Wallet is the credential issuance and verification platform used by the DPP service provider (Credenco/Quintessence Research). It supports:

- **Issuer** — issue Verifiable Credentials to other organisations or products
- **Holder** — store credentials in an organisation wallet
- **Verifier** — receive and validate credentials from other parties

It implements OpenID4VC and W3C Verifiable Credentials, and exposes a REST API for backend integration.

See **15-credenco-wallet-integration.md** for integration details.
