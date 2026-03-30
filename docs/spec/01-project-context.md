# 01 — Project Context

## What the Platform Demonstrates

The platform demonstrates end-to-end Digital Product Passport transfer through the full lifecycle of a building product (in the reference implementation: an aluminium facade panel). The following capabilities are shown across 14 user stories:

| # | Actor(s) | What is demonstrated |
|---|----------|----------------------|
| 1 | Supplier → Manufacturer | Material delivery with a MaterialPassportCredential |
| 2 | Manufacturer → DPP Service | Creating a product and requesting a DPP |
| 3 | Test Lab → Manufacturer | Physical testing and TestReportCredential issuance |
| 4 | LCA Organisation → Supplier/Manufacturer | LCA execution and ProductEnvironmentalCredential |
| 5 | Certification Body → Manufacturer | LCA review and ProductCertificate issuance |
| 6 | Manufacturer | Assembling a composite DPP from incoming credentials |
| 7 | Manufacturer → Construction Company | DPP transfer with product delivery |
| 8 | Construction Company → Building Owner | Project handover with asset-level DPP bundle |
| 10 | Building Owner | Portfolio-level compliance verification |
| 11 | Maintenance Company | Controlled, append-only DPP update after repair |
| 12 | Regulatory Authority | Audit access — time-bounded, traceable, evidenced |
| 13 | Dismantling Company | Receiving DPP and recording dismantling outcome |
| 14 | Recycler | Receiving material lot with recycling information |

**Note:** User story 9 is not included in this version of the specification.

## Scope Boundaries

- The platform covers data exchange and credential lifecycle — it does not implement a BIM viewer or spatial data platform.
- All credential issuance in the reference implementation is performed via the Credenco Business Wallet (see **15-credenco-wallet-integration.md**).
- Data sharing governance follows the DSGO Afsprakenstelsel and uses iSHARE as the B2B inter-organisational trust framework for M2M participant verification and delegation evidence between organisations. iSHARE is not used for human session authentication — UI login is a separate, simple flow (see **03-standards-and-technology.md** and **AUTH_ARCHITECTURE.md**).
- The system operates on a federated model: data stays at the source; only verifiable credentials and presentations are exchanged.
