# 13 — UI Interfaces per Actor

This section defines the required screens and their core functionality for each actor's frontend interface. All screens are informed by the interaction flows in **12-interaction-flows.md**.

## Supplier

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Product Manager screen | Create product and LCA information | Create product, enter product data, upload evidence, view credential |
| Passport issuance screen | Create MaterialPassportCredential | Select lot, enter claims (composition, origin, recycling), issue credential |
| Outbound shipment screen | Attach credential to shipment | Delivery note, lot IDs, attach credential, shipment status |
| Supplier Wallet UI | Manage received credentials | Credential list, detail view, document reference, share options |

## Manufacturer (Alkondor)

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Receiving screen | Process incoming deliveries | Shipment overview, lot IDs, linked credentials, Verify/Accept/Reject |
| Verification screen | Show credential verification result | Signature ✔, issuer ✔, status ✔, PASSED / FAILED |
| Product assembly screen | Assemble product from materials | Select accepted materials, create product |
| DPP overview | Show all credentials for a product | Credential list, verification status per credential, current holder |
| BOM editor screen | Manage bill of materials | Add and manage components |
| CO2 input screen | Enter/calculate environmental impact | Enter CO2e, record calculation method |
| DPP issuance screen | Request DPP credential from Credenco | Trigger credential issuance |
| DPP preview screen | View complete DPP | Full passport view |
| Transfer screen | Transfer product + DPP | Select next party, attach DPP |
| Sustainability / Recycling view | Reuse recycling data at EOL | Recycled content, recycling streams, dismantling instructions, recovery yield |

## Test Lab

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Test request overview | Manage incoming test requests | Test requests, sample registration, lot linking |
| Test results input | Record test results | Test type, values, methods |
| Certificate issuance screen | Issue TestReportCredential | "Issue Certificate" button, signed credential, certificate ID |
| Audit UI | Show verification history | Who issued what, when, credential chain |

## LCA Organisation (Alba Concepts)

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| LCA Workspace | Execute LCA and record results | Project overview, input data, assumptions, calculation status |
| Result review screen | Review LCA results | Impact indicators, review status, document generation |
| Issuance-ready marker | Approve core claims for issuance | Mark as ready, preview credential subject |

## Certification Body (SKG-IKOB)

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| LCA review screen | Review LCA report and evidence | Report details, evidence references |
| Certificate issuance screen | Approve and issue certificate | Approve + issue button |
| Certificate preview screen | Preview VC content before issuance | Full credential preview |
| Wallet credential screen | Show issued certificate in wallet | Certificate in Alkondor wallet |
| Verification / audit screen | Show approval history | Approval history, credential status |

## Construction Company

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Receiving screen | Process incoming delivery + DPP | Delivery, product details, DPP attached, "Verify DPP" button |
| Verification result screen | Show DPP verification | Signature ✔, issuer ✔, completeness ✔, ACCEPT / REJECT |
| Acceptance / receipt UI | Accept or reject delivery | Accept/reject, remarks, confirm ownership transfer |
| Handover UI | Transfer building to owner | Building/asset overview, linked DPPs, "Send to owner" |
| DPP ownership / traceability view | Show ownership history | Timeline: manufacturer → construction company → owner |

## Building Owner

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Incoming asset UI | Process received building + DPPs | Building overview, component list, DPP availability, "Verify DPPs" |
| Verification dashboard | Show DPP verification per asset | Transfer ✔, DPPs ✔, completeness ✔, ACCEPT / REJECT |
| Acceptance screen | Confirm handover | Ownership transfer, lifecycle transition to `operational` |
| Asset DPP viewer | Browse building structure + DPPs | Building components, attached DPPs, timeline |
| Portfolio dashboard | Manage all buildings and assets | Building overview, DPP coverage, compliance summary |
| Compliance rule selection UI | Select regulation | Select regulation, set scope (e.g., entire building) |
| Proof request UI | Request verifiable claims | Select property + required level, "Request proofs" button |
| Compliance results dashboard | Show total compliance result | Compliant / non-compliant, issues per asset |

## Maintenance Company

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Repair work screen (field) | Register repair in the field | Scan product ID, component, repair type, notes, submit |
| Data input / validation screen | Structured repair data | Dropdowns, credential preview, "Issue RepairCredential" |
| DPP viewer (before & after) | Show DPP evolution | Original passport + repair credential, timeline |
| Version comparison UI | Show changes | v2 vs v3, what changed |
| Trust / verification panel | Show multi-party trust | Manufacturer credential ✔, repair credential ✔, timestamps |

## Regulatory Authority

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Audit request UI | Create audit request | Select organisation + lot, required claims, legal basis |
| Manufacturer access approval UI | Process incoming audit request | Data scope, approve/restrict/reject |
| Authority verification dashboard | Review received passports | Signature ✔, issuer ✔, revocation ✔, compliance result |
| Audit trail / evidence UI | Log all audit actions | Audit requests, data reviewed, timestamps, downloadable evidence |
| Exception / non-compliance UI | Show problems | Failed verifications, missing claims, revoked credentials |

## Dismantling Company

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Intake verification screen | Receive and verify DPP | Issuer/signature/status check, product binding verification |
| Dismantling / outcome screen | Record dismantling procedure | Component list, steps performed, recovery outcome |

## Recycler

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Receiving and verification screen | Receive material + passport | Lot IDs, verification status, PO policy match, accept / quarantine |
| Sustainability / recycling view | Use recycling information | Recycled content, recycling streams, dismantling instructions, recovery yield |

## DPP Service Provider (Credenco)

| Screen | Purpose | Core Functionality |
|--------|---------|-------------------|
| Issuance-ready dossier overview | Show pending issuance requests | Overview of credentials pending issuance |
| Credential preview | Review content before issuance | Preview credential subject, select issuer, set validity |
| Issue button + status | Formally issue credential | Issue button, track issuance status |
