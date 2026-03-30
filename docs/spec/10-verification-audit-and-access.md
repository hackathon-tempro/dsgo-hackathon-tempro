# 10 — Verification, Audit, and Access Control

## Verification Record

**Used in:** all user stories. Created whenever a party verifies one or more credentials. The model is extended depending on context (material receipt, DPP transfer, audit).

```json
{
  "verificationId": "VER-2026-03-27-001",
  "credentialId": "urn:vc:material-passport:001",
  "credentialsChecked": ["MaterialPassport", "TestReport"],
  "verifiedBy": "MFG-001",
  "verifiedAt": "2026-03-27T10:14:00Z",
  "signatureValid": true,
  "issuerTrusted": true,
  "statusValid": true,
  "schemaValid": true,
  "bindingMatchedToLot": true,
  "overallResult": "passed | failed"
}
```

**Verification checks performed:**

| Check | Description |
|-------|-------------|
| signatureValid | Cryptographic signature of issuer DID verifies correctly |
| issuerTrusted | Issuer DID is in the trusted issuer registry |
| statusValid | Credential is not revoked (BitstringStatusList check) |
| schemaValid | Credential structure matches expected schema |
| bindingMatchedToLot | Credential subject ID matches the physical lot or product |

## Audit Request

**Used in:** user story 12. Created by a regulatory authority to formally request access to specific data held by a manufacturer.

```json
{
  "auditRequestId": "AUD-2026-00421",
  "authorityId": "AUTH-ENV-001",
  "targetOrganizationId": "MFG-001",
  "reason": "Regulatory compliance check",
  "scope": {
    "materialIds": ["MAT-AL-7075"],
    "lotIds": ["LOT-2026-03-00182"]
  },
  "requiredClaims": ["composition", "countryOfOrigin", "recycledContentPercent"],
  "legalBasis": "EU Battery Regulation Article X",
  "status": "pending | approved | rejected"
}
```

## Audit Record

**Used in:** user story 12. Records the outcome of the authority's audit — what credentials were checked and what was found.

```json
{
  "auditRecordId": "AR-2026-991",
  "auditRequestId": "AUD-2026-00421",
  "authorityId": "AUTH-ENV-001",
  "checkedCredentials": ["VC-001"],
  "verificationResults": {
    "signatureValid": true,
    "issuerTrusted": true,
    "statusValid": true
  },
  "findings": "Compliant",
  "checkedAt": "2026-04-02T10:20:00Z"
}
```

## Access Grant

**Used in:** user stories 11, 12. Controls which party may read, verify, or append to which data. Permission overwrite is never granted — the DPP is append-only.

```json
{
  "accessGrantId": "AGR-88291",
  "grantedBy": "MFG-001",
  "grantedTo": "RMC-001",
  "scope": {
    "lotIds": ["LOT-2026-03-00182"],
    "productId": "FRAME-88321",
    "credentialTypes": ["MaterialPassportCredential"]
  },
  "permissions": ["read", "verify", "append"],
  "validFrom": "2026-04-02T10:00:00Z",
  "validUntil": "2026-04-30T23:59:00Z"
}
```

**Important:** Permissions are always time-bounded. The permission overwrite does not exist in this system — the DPP append-only model must be enforced at the platform level.

## Wallet Record

**Used in:** user stories 2, 4, 5. Tracks credentials stored in a party's credential wallet (Credenco Business Wallet).

```json
{
  "walletRecordId": "WR-001",
  "walletId": "wallet-supplier-001",
  "credentialId": "urn:uuid:vc-001",
  "holderDid": "did:web:supplier.example.com",
  "storedAt": "2026-03-27T12:01:00Z",
  "status": "active | revoked | expired"
}
```

## Lifecycle Event (Custody Event)

**Used in:** user stories 2, 7, 8, 11. Records significant events in the custody/lifecycle of a product instance. Forms the auditable history of the DPP.

```json
{
  "eventId": "EVT-00031",
  "productInstanceId": "PI-00031",
  "eventType": "created | delivered | transferred | repaired | dismantled | recycled",
  "fromDid": null,
  "toDid": "did:web:alkondor.example.com",
  "timestamp": "2026-03-27T10:00:00Z",
  "relatedCredentialId": "urn:vc:dpp:00031"
}
```
