# 11 — Test and Certification Models

**Used in:** user story 3 (physical testing), user story 5 (LCA certification).

## Test Lab Organisation

The accredited testing laboratory that performs physical tests on material samples.

```json
{
  "labId": "LAB-001",
  "name": "Eurofins Materials Testing",
  "accreditation": "ISO/IEC 17025",
  "did": "did:web:lab.example.com"
}
```

The lab's DID is the issuer on any TestReportCredential it produces.

## Test Request

Submitted by the manufacturer to initiate testing of a specific lot.

```json
{
  "testRequestId": "TR-77821",
  "requestedBy": "MFG-001",
  "labId": "LAB-001",
  "lotId": "LOT-2026-03-00182",
  "testsRequired": ["tensile_strength", "chemical_composition", "hardness"],
  "status": "requested | in-progress | completed"
}
```

## Sample / Specimen

Represents the physical sample taken from the lot by the lab. Creates the physical-to-digital binding.

```json
{
  "sampleId": "SAMPLE-991",
  "lotId": "LOT-2026-03-00182",
  "collectedBy": "LAB-001",
  "collectionDate": "2026-03-28",
  "sealed": true
}
```

**Note:** GS1 Digital Link may optionally be used to link the physical sample label to the sampleId in this model.

## Test Result

The raw test result, recorded per test type, before being packaged into a TestReportCredential.

```json
{
  "testResultId": "TR-RESULT-001",
  "sampleId": "SAMPLE-991",
  "testType": "tensile_strength",
  "value": 540,
  "unit": "MPa",
  "method": "ISO 6892-1",
  "testDate": "2026-03-29"
}
```

## Certification Flow Summary (User Story 5)

```
LCA Result (Alba Concepts)
  → LCA Claim submitted for review
  → Cert Manager (SKG-IKOB) reviews claim + LCA document
  → Cert Manager approves
  → Issuance request sent to Credenco
  → ProductCertificate issued to Alkondor wallet
```

See the full flow in **12-interaction-flows.md** (Flow D).
