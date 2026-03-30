# 15 — Credenco Business Wallet Integration

The Credenco Business Wallet is the credential issuance and verification platform used by all parties in the DPP chain. This section describes how to integrate with the Credenco API for the operations required by this platform.

**Base URL (acceptance):** https://wallet.acc.credenco.com  
**Swagger UI:** https://wallet.acc.credenco.com/api/public/swagger-ui/index.html  
**Documentation:** https://docs.acc.credenco.com

## Authentication

Two authentication methods are available. Both are configured per organisation in the Business Wallet UI under Profile → API Access.

### Option 1: OAuth 2.0 Client Credentials Flow

Enable OAuth2 in the wallet UI. A client_id and client_secret are generated. Use these to obtain a bearer token:

```
POST https://wallet.acc.credenco.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>
```

Use the returned access_token as a Bearer token on all subsequent requests:

```
Authorization: Bearer <access_token>
```

### Option 2: API Key

Enable API Key authentication in the wallet UI. Include the key as an HTTP header on every request:

```
x-api-key: <API-KEY>
```

To rotate the API key: disable and re-enable API Key authentication in the UI.

## Credential Issuance Workflow

Issuing a credential via the Credenco API requires three one-time setup steps and one runtime call.

### Step 1: Create an Issuer Template (one-time)

The issuer template defines the general issuer configuration (name, logo) for a set of credentials. Configured via the Business Wallet UI or the Wallet Management API.

### Step 2: Create a Credential Template (one-time per credential type)

A credential template defines the credential type, attribute schema, and display configuration.

The following credential templates must be created for this platform:

| Template Name | Credential Type |
|---------------|-----------------|
| MaterialPassportCredential | MaterialPassportCredential |
| TestReportCredential | TestReportCredential |
| ProductEnvironmentalCredential | ProductEnvironmentalCredential |
| ProductCertificate | ProductCertificate |
| DigitalProductPassport | DigitalProductPassport |
| AssetHandoverCredential | AssetHandoverCredential |
| RepairCredential | RepairCredential |

### Step 3: Issue a Credential (runtime — Issue Credential API V2)

```
POST /api/v2/credentials/issue
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "templateId": "<credential-template-id>",
  "holderDid": "did:web:recipient.example.com",
  "claims": {
    "id": "urn:lot:LOT-2026-03-00182",
    "materialId": "MAT-AL-7075",
    "batchNumber": "BATCH-77421",
    "recycledContentPercent": 22.0
  },
  "validFrom": "2026-03-25T09:00:00Z",
  "validUntil": "2031-03-25T09:00:00Z"
}
```

The response contains the issued Verifiable Credential (W3C VC 2.0 JSON-LD format) and the credential ID for storage in the platform's WalletRecord.

## Credential Verification

Use the Verify a Credential API to verify a received credential:

```
POST /api/v1/credentials/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "credential": { /* W3C VC JSON object */ }
}
```

Response includes: signatureValid, issuerTrusted, statusValid, schemaValid.

Map the response to the platform's VerificationRecord model (see **10-verification-audit-and-access.md**).

## Credential Revocation

Use the Credential Revocation API to revoke an issued credential by ID:

```
POST /api/v1/credentials/{credentialId}/revoke
Authorization: Bearer <access_token>
```

Revocation is propagated via the BitstringStatusList endpoint embedded in the credential's credentialStatus.

## Verifiable Presentation Exchange (OID4VP)

Use the Universal OIDC4VP API to request and receive verifiable presentations:

```
POST /api/v1/oidc4vp/start
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "presentationDefinition": {
    "input_descriptors": [
      {
        "id": "dpp-check",
        "constraints": {
          "fields": [
            { "path": ["$.type"], "filter": { "const": "DigitalProductPassport" } }
          ]
        }
      }
    ]
  },
  "redirectUri": "https://platform.example.com/presentations/callback"
}
```

This starts the OID4VP flow used in user stories 7, 8, 10, and 12 for presentation request and collection.

## Trusted Contacts

The TrustedContact API manages the list of organisations the wallet trusts as issuers. Register the DID of every issuer that this organisation will accept credentials from:

```
POST /api/v1/trusted-contacts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "did": "did:web:supplier.example.com",
  "name": "Arconic (aluminium supplier)"
}
```

This is used in the issuerTrusted check of the VerificationRecord.

## Public Profile API

Each organisation's wallet publishes a public DID document and public profile:

```
GET /api/v1/public-profile/{walletId}
```

This endpoint allows other parties to resolve an organisation's DID before initiating a credential exchange.

## Deployment Options

- **SaaS (recommended):** Fully managed by Credenco. No infrastructure required. Ready within minutes.
- **On-premise:** Self-hosted deployment for organisations with strict data residency requirements. See Credenco on-premise installation docs.
