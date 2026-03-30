# 04 — Domain Model: Organizations and Users

Used in: all user stories.

## Organization

The base model for every participating legal entity. One organisation may hold multiple roles (see **02-actors-and-roles.md**).

```json
{
  "organizationId": "ORG-001",
  "legalName": "Example B.V.",
  "tradeName": "Example",
  "organizationIdentifier": "KVK-12345678",
  "did": "did:web:example.com",
  "walletId": "wallet-001",
  "siteId": "PLANT-01",
  "roleSet": ["supplier", "data_service_rightsholder"],
  "status": "active"
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| organizationId | string | Internal platform ID |
| legalName | string | Registered legal name |
| tradeName | string | Trading name |
| organizationIdentifier | string | KVK number or other official identifier |
| did | DID URI | Decentralized Identifier — used as issuer/holder in VCs |
| walletId | string | Reference to the organisation's credential wallet |
| siteId | string | Production site or facility identifier |
| roleSet | string[] | Set of DSGO/DPP roles held by this organisation |
| status | enum | active \| inactive \| suspended |

## User / Human Role

Represents an individual person within an organisation with a specific functional responsibility.

```json
{
  "personId": "HUM-001",
  "name": "Product Manager",
  "role": "ProductManager | ProcurementOfficer | CertManager | LabTechnician | ...",
  "organizationId": "ORG-001",
  "responsibilities": ["..."]
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| personId | string | Internal person ID |
| name | string | Display name or role label |
| role | enum | Functional role — see **02-actors-and-roles.md** for full list |
| organizationId | string | Reference to parent organisation |
| responsibilities | string[] | Free-text list of responsibilities |
