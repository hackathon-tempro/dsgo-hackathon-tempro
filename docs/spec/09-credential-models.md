# 09 — Credential Models

All credentials in this platform conform to the W3C Verifiable Credentials Data Model 2.0. Each credential is signed by the issuer's DID, and includes a credentialStatus entry for revocation via BitstringStatusList.

The Credenco Business Wallet is used for issuance (see **15-credenco-wallet-integration.md**).

## MaterialPassportCredential

**Issued by:** Supplier  
**Credential subject:** Material Lot (urn:lot:<lotId>)  
**Used in:** User stories 1, 6, 14

This is the first verifiable credential in the chain. It attests to the composition, origin, and recycling properties of a material lot.

```json
{
  "type": ["VerifiableCredential", "MaterialPassportCredential"],
  "issuer": "did:web:supplier.example.com",
  "validFrom": "2026-03-25T09:00:00Z",
  "credentialSubject": {
    "id": "urn:lot:LOT-2026-03-00182",
    "materialId": "MAT-AL-7075",
    "batchNumber": "BATCH-77421",
    "composition": [
      { "substance": "Aluminium", "percent": 89.5 },
      { "substance": "Zinc",      "percent": 5.6  }
    ],
    "recycledContentPercent": 22.0,
    "countryOfOrigin": "DE",
    "carbonFootprintKgCO2e": 3100.0,
    "complianceClaims": [
      { "scheme": "REACH", "status": "compliant" }
    ],
    "recyclability": {
      "class": "high",
      "streams": ["aluminium recycling"],
      "expectedRecoveryYieldPercent": 92
    },
    "endOfLife": {
      "preferredRoute": "closed-loop remelting",
      "takeBackAvailable": true
    }
  },
  "credentialStatus": {
    "id": "https://supplier.example.com/status/123#945",
    "type": "BitstringStatusListEntry",
    "statusPurpose": "revocation"
  }
}
```

## TestReportCredential

**Issued by:** Test laboratory (e.g., Eurofins)  
**Credential subject:** Material Lot or Product Instance  
**Used in:** User story 3

Attests to the results of physical laboratory tests conducted on a sample from the lot.

```json
{
  "type": ["VerifiableCredential", "TestReportCredential"],
  "issuer": "did:web:lab.example.com",
  "validFrom": "2026-03-29",
  "credentialSubject": {
    "id": "urn:lot:LOT-2026-03-00182",
    "sampleId": "SAMPLE-991",
    "tests": [
      {
        "type": "tensile_strength",
        "value": 540,
        "unit": "MPa",
        "method": "ISO 6892-1"
      }
    ],
    "conclusion": "compliant",
    "accreditation": "ISO/IEC 17025"
  }
}
```

## ProductEnvironmentalCredential

**Issued by:** LCA organisation (Alba Concepts) or authorised issuer  
**Credential subject:** Product (urn:product:<productId>)  
**Used in:** User stories 4, 5

Attests to the environmental impact of a product based on a completed LCA. Contains a hash-linked reference to the full LCA report PDF.

```json
{
  "type": ["VerifiableCredential", "ProductEnvironmentalCredential"],
  "issuer": "did:web:issuer.example.com",
  "issuanceDate": "2026-03-27T12:00:00Z",
  "expirationDate": "2031-03-27T12:00:00Z",
  "credentialSubject": {
    "id": "urn:product:PROD-AL-001",
    "productName": "Aluminium Profile X",
    "declaredUnit": "1 kg",
    "methodology": ["ISO 14040", "ISO 14044", "EN 15804"],
    "systemBoundary": "cradle-to-gate",
    "impactIndicators": [
      { "indicator": "GWP-total", "value": 8.4, "unit": "kg CO2-eq" }
    ],
    "documentReference": {
      "documentId": "DOC-001",
      "fileHash": "sha256-abcdef1234567890",
      "uri": "https://example.com/documents/lca-report.pdf"
    }
  }
}
```

## ProductCertificate

**Issued by:** Certification body (SKG-IKOB)  
**Holder:** Manufacturer (Alkondor)  
**Used in:** User story 5

Issued after the certification body reviews and approves the LCA claims.

```json
{
  "type": ["VerifiableCredential", "ProductCertificate"],
  "issuer": "did:web:skg-ikob.example.com",
  "holder": "did:web:alkondor.example.com",
  "subjectId": "did:example:product:PI-00031",
  "validFrom": "2026-03-27T11:00:00Z",
  "claims": {
    "productName": "Industrial Panel X200",
    "lcaApproved": true,
    "carbonFootprintKgCO2e": 84.6
  }
}
```

## DigitalProductPassport (DPP Credential)

**Issued by:** DPP service provider (Credenco)  
**Credential subject:** Product Instance  
**Used in:** User stories 2, 6, 7, 8

The overarching verifiable credential that bundles all product data into a single, transferable DPP. Issued by Credenco on behalf of the manufacturer.

```json
{
  "type": ["VerifiableCredential", "DigitalProductPassport"],
  "issuer": "did:web:credenco.example.com",
  "validFrom": "2026-03-27T10:00:00Z",
  "credentialSubject": {
    "id": "did:example:product:PI-00031",
    "productName": "Industrial Panel X200",
    "serialNumber": "SN-88271",
    "manufacturer": "Alkondor B.V.",
    "material": "Aluminium",
    "bom": [
      { "componentName": "Aluminium frame", "originCountry": "NL" }
    ],
    "carbonFootprintKgCO2e": 84.6
  }
}
```

## AssetHandoverCredential

**Issued by:** Construction company  
**Used in:** User story 8

Records the formal transfer of a building and its associated DPPs from construction company to building owner.

```json
{
  "type": ["VerifiableCredential", "AssetHandoverCredential"],
  "issuer": "did:web:construction.example.com",
  "credentialSubject": {
    "assetId": "ASSET-001",
    "from": "CONST-001",
    "to": "OWNER-001",
    "includedDPPs": ["DPP-7788"],
    "handoverDate": "2026-06-01"
  }
}
```

## RepairCredential

**Issued by:** Maintenance/repair company  
**Used in:** User story 11

**Critical constraint:** This credential is appended to the DPP. It does NOT overwrite or replace any existing credential. The DPP version is incremented; the original DigitalProductPassport credential remains intact and verifiable.

```json
{
  "type": ["VerifiableCredential", "RepairCredential"],
  "issuer": "did:web:repairco.example.com",
  "credentialSubject": {
    "productId": "FRAME-88321",
    "componentId": "COMP-ALLOY-FRAME",
    "repairEventId": "REP-2026-00421",
    "repairType": "welding",
    "updatedProperties": {
      "structuralIntegrity": "restored",
      "lifecycleStatus": "repaired"
    }
  }
}
```

## Credential Summary Table

| Credential Type | Issuer | Subject | Used In |
|-----------------|--------|---------|---------|
| MaterialPassportCredential | Supplier | Material Lot | US 1, 6, 14 |
| TestReportCredential | Test Lab | Lot / Sample | US 3 |
| ProductEnvironmentalCredential | LCA Organisation | Product | US 4, 5 |
| ProductCertificate | Certification Body | Product Instance | US 5 |
| DigitalProductPassport | Credenco (DPP provider) | Product Instance | US 2, 6, 7, 8 |
| AssetHandoverCredential | Construction Company | Asset / Building | US 8 |
| RepairCredential | Maintenance Company | Product / Component | US 11 |
