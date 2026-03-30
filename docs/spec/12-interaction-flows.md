# 12 — Interaction Flows

These flows describe the data exchange through the full chain. Common sub-flows (credential issuance, verification, transfer) are described once and referenced by user story.

## Overview: All Interactions

| From | To | Interaction | User Story |
|------|----|------------|------------|
| Supplier | Manufacturer | Shipment + MaterialPassportCredential | 1, 6, 14 |
| Manufacturer | Credenco | DPP issuance request | 2, 6 |
| Credenco | Manufacturer wallet | DPP Credential issued | 2, 5, 6 |
| Manufacturer | Test Lab | Test request + sample | 3 |
| Test Lab | Manufacturer | TestReportCredential | 3 |
| Supplier | Alba Concepts | Product data for LCA | 4 |
| Alba Concepts | Issuer | LCA core claims approved | 4 |
| Issuer | Supplier wallet | ProductEnvironmentalCredential | 4 |
| Supplier wallet | Manufacturer | LCA Credential shared | 4, 5 |
| SKG-IKOB | Alkondor wallet | ProductCertificate after LCA review | 5 |
| Manufacturer | Construction company | Product + DPP + VerifiablePresentation | 7 |
| Construction company | Building owner | Asset + DPP bundle + AssetHandoverCredential | 8 |
| Building owner | DPP platform | Compliance proof request | 10 |
| Maintenance company | DPP platform | RepairCredential (append-only) | 11 |
| Authority | Manufacturer/Supplier | Audit request + access grant | 12 |
| Manufacturer | Dismantling company | Product + DismantlingPassportCredential | 13 |
| Supplier | Manufacturer | MaterialPassport with recycling info | 14 |

## Flow A — Material Delivery (User Stories 1, 14)

1. Manufacturer sends Purchase Order with required claims (recycled content, composition, origin)
2. Supplier creates Material Lot record
3. Supplier issues `MaterialPassportCredential` (signed with DID)
4. Supplier sends shipment + credential
5. Manufacturer verifies: signature, issuer DID, revocation status, schema, lot binding
6. Manufacturer accepts or rejects delivery

## Flow B — Test Lab Certification (User Story 3)

1. Manufacturer sends test request to lab (lot reference + required tests)
2. Lab receives sample, registers specimen (GS1 Digital Link optional)
3. Lab performs tests, records results
4. Lab issues `TestReportCredential`
5. Lab shares credential with manufacturer (REST API or OID4VP)
6. Manufacturer verifies both credentials (`MaterialPassportCredential` + `TestReportCredential`) together
7. Manufacturer makes quality decision: approved / rejected

## Flow C — LCA Execution and Credential Issuance (User Story 4)

1. Supplier registers product and provides source data to Alba Concepts
2. Alba Concepts executes LCA, records results
3. Issuer creates `ProductEnvironmentalCredential` from core claims
4. Credential issued to Supplier wallet
5. Supplier shares credential + linked PDF document with manufacturer
6. Procurement officer verifies: credential validity, issuer, document hash

## Flow D — Certification by SKG-IKOB (User Story 5)

1. Cert manager opens LCA report in review screen
2. Cert manager validates LCA claims and evidence
3. Cert manager clicks "Issue Certificate" — Credenco receives issuance request
4. Credenco issues `ProductCertificate` to Alkondor wallet
5. Issuance record stored

## Flow E — DPP Assembly by Manufacturer (User Stories 2, 6)

1. Manufacturer creates product and adds BOM
2. Manufacturer adds CO2 data
3. Manufacturer receives incoming credentials (material, test, LCA) and verifies them
4. Manufacturer requests DPP issuance from Credenco
5. Credenco validates and issues `DigitalProductPassport` credential
6. DPP credential stored in wallet; lifecycle event recorded (`created`)

## Flow F — Transfer: Manufacturer → Construction Company (User Story 7)

1. Construction company orders product + DPP from manufacturer
2. Manufacturer creates transaction record and bundles DPP
3. Manufacturer sends product + `VerifiablePresentation` (credentials)
4. Construction company verifies DPP: signatures, issuer, completeness
5. Construction company accepts delivery + sends receipt confirmation
6. System updates `DPP.currentHolder`; transfer record created

## Flow G — Project Handover: Construction Company → Building Owner (User Story 8)

1. Construction company aggregates all DPPs for the building
2. Construction company creates `AssetHandoverCredential`
3. Construction company sends asset bundle: metadata + DPPs + `VerifiablePresentation`
4. Building owner verifies: signatures, issuer, DPP completeness
5. Building owner accepts handover
6. System updates owner; lifecycle stage transitions to `operation`

## Flow H — Portfolio Compliance Check by Building Owner (User Story 10)

1. Compliance officer opens portfolio dashboard (all DPPs for building)
2. Select compliance requirement (e.g., fire resistance ≥ A2)
3. System sends proof request to all DPP holders
4. System collects `VerifiablePresentations` with relevant claims
5. Verification of signatures and revocation status per credential
6. Compliance result generated: compliant / non-compliant per asset component

## Flow I — Repair and DPP Update (User Story 11)

1. Maintenance company requests access to DPP (append permission only)
2. Manufacturer/holder grants limited access via `AccessGrant`
3. Maintenance company retrieves current DPP and verifies existing credentials
4. Repair is performed; `repairEvent` created
5. `RepairCredential` created and signed by maintenance company
6. DPP receives new version (append) — original credentials remain intact and unmodified

## Flow J — Regulatory Audit (User Story 12)

1. Authority sends audit request with legal basis and scope
2. Manufacturer evaluates and grants time-bounded access (`AccessGrant`)
3. Authority sends presentation request (OID4VP) with required claims
4. Manufacturer sends `VerifiablePresentation` with relevant credentials
5. Authority verifies: signature, issuer, revocation status, completeness
6. Audit record created; optional escalation if non-compliant

## Flow K — Dismantling (User Story 13)

1. Dismantling company receives product + DPP
2. Dismantling company verifies DPP: issuer, signature, product binding
3. Dismantling company executes dismantling procedure
4. Dismantling outcome recorded (component list, recovery result)
5. Lifecycle event `dismantled` appended to DPP

## Flow L — Recycling (User Story 14)

1. Recycler receives material lot from dismantling company
2. Lot includes `MaterialPassportCredential` with recycling information
3. Recycler verifies credential and checks against purchase order policy
4. Recycler uses recycled content, recycling stream, and recovery yield data for processing
5. Optional: GS1 EPCIS 2.0 event recorded for lot traceability
