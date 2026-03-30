# DSGO / DPP Platform Specification

**Version:** 1.0 | March 2026  
**Status:** Draft  
**Total Documentation:** 16 files, ~1,630 lines

This is a restructured specification of the Digital Product Passport (DPP) platform for the DSGO (Digitaal Stelsel Gebouwde Omgeving) ecosystem. The specification has been split from a monolithic 1,431-line document into 16 domain-focused files for better maintainability and navigation.

## Quick Navigation

### Overview & Context
- **[00-overview.md](./00-overview.md)** — Purpose, scope, and file index
- **[01-project-context.md](./01-project-context.md)** — User stories and scope boundaries
- **[02-actors-and-roles.md](./02-actors-and-roles.md)** — All actors, DSGO roles, DPP roles, human roles
- **[03-standards-and-technology.md](./03-standards-and-technology.md)** — W3C VC, DID, OID4VP, iSHARE, GS1, Credenco

### Domain Models
- **[04-domain-model-organizations.md](./04-domain-model-organizations.md)** — Organization, User, Human Role models
- **[05-domain-model-materials-and-products.md](./05-domain-model-materials-and-products.md)** — Material, Lot, Product, BOM, Component
- **[06-domain-model-environmental-and-lca.md](./06-domain-model-environmental-and-lca.md)** — CO2, LCA Project, Document, Result, Claim
- **[07-domain-model-logistics-and-transactions.md](./07-domain-model-logistics-and-transactions.md)** — Shipment, Transaction, Asset Handover
- **[08-domain-model-dpp-and-lifecycle.md](./08-domain-model-dpp-and-lifecycle.md)** — DPP, Transfer Record, Versioning, Asset, Compliance
- **[09-credential-models.md](./09-credential-models.md)** — All 7 W3C VC credential types

### Governance & Control
- **[10-verification-audit-and-access.md](./10-verification-audit-and-access.md)** — Verification, Audit, Access Grant, Wallet, Lifecycle Events
- **[11-test-and-certification.md](./11-test-and-certification.md)** — Test Lab, Request, Sample, Result

### Interaction & Implementation
- **[12-interaction-flows.md](./12-interaction-flows.md)** — 12 end-to-end interaction flows (A–L)
- **[13-ui-interfaces.md](./13-ui-interfaces.md)** — UI screens per actor (supplier, manufacturer, owner, etc.)
- **[14-api-endpoints.md](./14-api-endpoints.md)** — REST API endpoint catalogue
- **[15-credenco-wallet-integration.md](./15-credenco-wallet-integration.md)** — Credenco Business Wallet API integration

### Reference
- **[16-assumptions-and-open-questions.md](./16-assumptions-and-open-questions.md)** — Assumptions, open questions, ambiguities

## Key Structural Changes

| Issue | Resolution |
|-------|-----------|
| Single 1,431-line file | Split into 16 focused files by domain |
| Duplicated role definitions | Merged DSGO/DPP roles in 02-actors-and-roles.md |
| 900+ lines in Data Models | Split across 5 domain model files (04–08) |
| No credential type catalogue | Created 09-credential-models.md with all 7 types |
| No interaction flow index | Created 12-interaction-flows.md with flows A–L |
| No assumptions documented | Created 16-assumptions-and-open-questions.md |
| Mixed UI/data/flows/API | Separated into dedicated files (12–15) |

## Reading Guide

### For Architects
Start with **00-overview.md**, then read **01-project-context.md** and **03-standards-and-technology.md**.

### For Data Modelers
Focus on **04**–**08** (domain models) and **09** (credential schemas).

### For Developers
Read **12** (flows), **13** (UI), **14** (API), and **15** (Credenco integration).

### For Auditors & Compliance
Focus on **10** (verification/audit) and **16** (assumptions/open questions).

### For Test/QA Teams
Use **12** (flows) to understand test scenarios, and **13** (UI) for acceptance criteria.

## Credential Types Reference

| Type | Issuer | Subject | Story |
|------|--------|---------|-------|
| MaterialPassportCredential | Supplier | Material Lot | 1, 6, 14 |
| TestReportCredential | Test Lab | Lot/Sample | 3 |
| ProductEnvironmentalCredential | LCA Org | Product | 4, 5 |
| ProductCertificate | Cert Body | Product | 5 |
| DigitalProductPassport | Credenco | Product | 2, 6, 7, 8 |
| AssetHandoverCredential | Construction | Asset | 8 |
| RepairCredential | Maintenance | Product | 11 |

## Interaction Flows at a Glance

- **Flow A** — Material Delivery (Supplier → Manufacturer)
- **Flow B** — Test Lab Certification
- **Flow C** — LCA Execution
- **Flow D** — SKG-IKOB Certification
- **Flow E** — DPP Assembly (Manufacturer)
- **Flow F** — Product Transfer (Mfg → Construction)
- **Flow G** — Project Handover (Construction → Owner)
- **Flow H** — Compliance Check (Building Owner)
- **Flow I** — Repair & Update (Maintenance)
- **Flow J** — Regulatory Audit
- **Flow K** — Dismantling
- **Flow L** — Recycling

## Notes for Implementation

1. All credentials are W3C VC 2.0 compliant with BitstringStatusList revocation
2. All actors use DID for identification (did:web recommended)
3. iSHARE Trust Framework provides access control and M2M auth
4. Credenco Business Wallet is the credential issuance/verification service
5. DPP model is append-only — no overwrite permissions allowed
6. See **16-assumptions-and-open-questions.md** for unresolved items

---

**Last updated:** March 2026  
**Maintained by:** DSGO/DPP Specification Team
