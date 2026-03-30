# 06 — Domain Model: Environmental and LCA

## CO2 / Environmental Model

**Used in:** user stories 2, 4, 5. Internal model for storing calculated CO2 emissions at the product level before they are embedded in a credential.

```json
{
  "co2Id": "CO2-00031",
  "productId": "PROD-2026-00031",
  "calculationMethod": "internal-estimation-v1",
  "calculationDate": "2026-03-27",
  "totalKgCO2e": 84.6,
  "scope": "cradle-to-gate"
}
```

## LCA Project

**Used in:** user stories 4, 5. The project record for a Life Cycle Assessment study.

```json
{
  "lcaProjectId": "LCA-001",
  "productId": "PROD-AL-001",
  "supplierId": "SUP-001",
  "lcaExecutor": "Alba Concepts",
  "goal": "determine environmental impact",
  "systemBoundary": "cradle-to-gate",
  "methodology": ["ISO 14040", "ISO 14044", "EN 15804"],
  "status": "completed"
}
```

## LCA Document

**Used in:** user stories 4, 5. The generated PDF report, referenced by hash in the credential.

```json
{
  "documentId": "DOC-001",
  "lcaProjectId": "LCA-001",
  "title": "LCA Report Aluminium Profile X",
  "issuedBy": "Alba Concepts",
  "issueDate": "2026-03-27",
  "validUntil": "2031-03-27",
  "fileUri": "https://example.com/documents/lca-report.pdf",
  "fileHash": "sha256-abcdef1234567890",
  "status": "issued"
}
```

**Important:** The fileHash is embedded in the ProductEnvironmentalCredential (see **09-credential-models.md**), enabling recipients to verify the integrity of the linked PDF.

## LCA Result

**Used in:** user stories 4, 5. The structured impact indicator results from the LCA.

```json
{
  "resultId": "RES-001",
  "lcaProjectId": "LCA-001",
  "declaredUnit": "1 kg",
  "systemBoundary": "cradle-to-gate",
  "impactIndicators": [
    { "indicator": "GWP-total", "value": 8.4, "unit": "kg CO2-eq" },
    { "indicator": "AP",        "value": 0.03, "unit": "mol H+ eq" }
  ],
  "reviewStatus": "approved"
}
```

## LCA Claim (for certification review)

**Used in:** user story 5. A single verifiable claim extracted from an LCA result, submitted to the certification body (SKG-IKOB) for review.

```json
{
  "lcaClaimId": "CLAIM-0001",
  "lcaReportId": "LCA-00031",
  "claimType": "carbonFootprint",
  "claimValue": 84.6,
  "unit": "kgCO2e",
  "evidenceRef": "https://example.com/evidence/lca-00031.pdf"
}
```
