# DSGO / DPP Platform — Specification Overview

**Version:** 1.0 | March 2026  
**Status:** Draft — Distilled from all user stories; duplicates removed, shared models consolidated  
**Confidentiality:** Confidential — DSGO/DPP Consortium

## Purpose

This documentation set defines the data models, credential schemas, interaction flows, and API interfaces for the **DSGO / DPP** (Digitaal Stelsel Gebouwde Omgeving / Digital Product Passport) platform.

The platform demonstrates that a Digital Product Passport (DPP) travels with a product through its full lifecycle — from raw material supplier to manufacturer, construction company, building owner, maintenance contractor, and ultimately to dismantler and recycler — and that its authenticity and integrity can be verified at every point of transfer.

The DPP is not merely a transaction record. It is a long-term, cryptographically verifiable asset record, ultimately owned by the building owner.

## Specification Index

| File | Contents |
|------|----------|
| **01-project-context.md** | User stories, scope, what is demonstrated |
| **02-actors-and-roles.md** | All actors, DSGO roles, DPP roles |
| **03-standards-and-technology.md** | W3C VC, DID, OID4VP, iSHARE, GS1 EPCIS |
| **04-domain-model-organizations.md** | Organization and User/Human Role models |
| **05-domain-model-materials-and-products.md** | Material, Lot, Product, BOM, Component models |
| **06-domain-model-environmental-and-lca.md** | CO2/Environmental, LCA Project, Document, Result, Claim |
| **07-domain-model-logistics-and-transactions.md** | Shipment, Transaction, Asset Handover models |
| **08-domain-model-dpp-and-lifecycle.md** | DPP, Transfer Record, Versioning, Building/Asset, Compliance Requirement |
| **09-credential-models.md** | All W3C VC credential schemas |
| **10-verification-audit-and-access.md** | Verification Record, Audit Request/Record, Access Grant, Wallet, Lifecycle Events |
| **11-test-and-certification.md** | Test Lab, Test Request, Sample, Test Result |
| **12-interaction-flows.md** | All chain interaction flows (A–L) |
| **13-ui-interfaces.md** | UI screens per actor |
| **14-api-endpoints.md** | Indicative REST API endpoint catalogue |
| **15-credenco-wallet-integration.md** | Credenco Business Wallet API integration guide |
| **16-assumptions-and-open-questions.md** | Assumptions, open questions, ambiguities |
