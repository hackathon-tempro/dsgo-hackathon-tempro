# 14 — API Endpoints

This section provides an indicative catalogue of the REST API endpoints required to support all interaction flows. All endpoints follow REST conventions and return/accept JSON.

For credential issuance and verification, the Credenco Wallet API is used — see **15-credenco-wallet-integration.md** for the specific API calls.

## Material and Lot Management

```
POST   /materials               # Create material master
POST   /lots                    # Create material lot
GET    /lots/{id}               # Retrieve lot detail
```

## Shipment and Transactions

```
POST   /shipments               # Create shipment
GET    /shipments/{id}          # Retrieve shipment detail
POST   /transactions            # Create product transaction
GET    /transactions/{id}       # Retrieve transaction detail
```

## Credentials

```
POST   /credentials/material-passport   # Issue MaterialPassportCredential
POST   /credentials/test-report         # Issue TestReportCredential
POST   /credentials/lca                 # Issue ProductEnvironmentalCredential
POST   /credentials/certificate         # Issue ProductCertificate
POST   /credentials/dpp                 # Issue DigitalProductPassport
POST   /credentials/repair              # Issue RepairCredential
```

> These endpoints trigger issuance via the Credenco Wallet API. See **15-credenco-wallet-integration.md**.

## Verification

```
POST   /verifications           # Verify a credential or presentation
GET    /verifications/{id}      # Retrieve verification result
```

## DPP Management

```
GET    /dpp/{productId}         # Retrieve DPP for a product
POST   /dpp/{productId}/append  # Append credential to DPP (append-only)
POST   /dpp/transfer            # Transfer DPP ownership
GET    /assets/{id}/dpps        # Retrieve all DPPs for a building/asset
```

## Access Control and Audit

```
POST   /access-requests         # Create access request
POST   /access-grants           # Grant access
GET    /audit-records/{id}      # Retrieve audit record
```

## Verifiable Presentations (OID4VP)

```
POST   /presentations/request   # Create presentation request
POST   /presentations/submit    # Submit presentation
POST   /presentations/collect   # Collect presentations (portfolio compliance)
```

## Compliance

```
POST   /proof-requests          # Initiate proof request
POST   /compliance-checks       # Execute compliance check
GET    /compliance-results/{id} # Retrieve compliance result
```
