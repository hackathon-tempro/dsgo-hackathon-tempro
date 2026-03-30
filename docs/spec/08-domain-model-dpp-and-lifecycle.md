# 08 — Domain Model: DPP and Lifecycle

## Digital Product Passport (DPP)

**Used in:** all user stories from story 2 onward. The DPP is the central record that bundles all credentials for a product instance and tracks ownership through the chain.

```json
{
  "dppId": "DPP-001",
  "productId": "PROD-001",
  "assetId": "ASSET-001",
  "credentials": [
    "VC-MATERIAL-001",
    "VC-TEST-001",
    "VC-LCA-001",
    "VC-CERT-001"
  ],
  "currentHolder": "ALK-001",
  "currentVersion": "v3",
  "lifecycleStage": "manufactured | construction | operation | end-of-life",
  "createdAt": "2026-04-01T10:00:00Z"
}
```

**Fields:**

| Field | Description |
|-------|-------------|
| dppId | Unique passport identifier |
| productId | Link to Product Master |
| assetId | Populated after the DPP is linked to a building/asset (user story 8) |
| credentials | Ordered list of credential IDs that form the DPP |
| currentHolder | Current holder — updated on each transfer |
| currentVersion | Incremented on each append (repair, update) |
| lifecycleStage | Current stage of the product's lifecycle |

**Lifecycle stages:**

| Stage | Transition trigger |
|-------|-------------------|
| manufactured | DPP created by manufacturer |
| construction | DPP transferred to construction company (user story 7) |
| operation | Building handover accepted (user story 8) |
| end-of-life | Dismantling or recycling initiated (user stories 13, 14) |

## DPP Transfer Record

**Used in:** user stories 7, 8. Records each ownership change for auditability.

```json
{
  "transferId": "TR-001",
  "dppId": "DPP-7788",
  "from": "PRODUCER-001",
  "to": "CONST-001",
  "transferredAt": "2026-04-10T09:00:00Z"
}
```

## DPP Versioning

**Used in:** user story 11. Records changes to the DPP after repair or other post-manufacture events. The DPP uses an append-only model — original credentials are never overwritten.

```json
{
  "version": "v3",
  "previousVersion": "v2",
  "updatedBy": "RMC-001",
  "updateType": "repair",
  "timestamp": "2026-05-02T10:10:00Z"
}
```

**Key principle:** Appending a new credential (e.g., RepairCredential) creates a new version. The original credential remains in the DPP and retains its original signature. This ensures the full history is preserved and auditable.

## Building / Asset Model

**Used in:** user stories 8, 10. A building or asset to which one or more DPPs are linked after construction handover.

```json
{
  "assetId": "ASSET-001",
  "assetType": "Office Building",
  "name": "Main Office Utrecht",
  "location": "Utrecht",
  "ownerId": "OWNER-001",
  "components": [
    { "productId": "BEAM-001", "dppId": "DPP-7788" }
  ]
}
```

## Compliance Requirement

**Used in:** user story 10. Defines a regulatory requirement against which DPPs are checked during portfolio compliance verification.

```json
{
  "requirementId": "REQ-FIRE-001",
  "regulation": "EU Construction Products Regulation",
  "property": "fireResistance",
  "requiredLevel": "A2",
  "appliesTo": ["Wall Panel", "Structural Beam"]
}
```
