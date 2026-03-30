# 07 — Domain Model: Logistics and Transactions

## Shipment (Delivery)

**Used in:** user stories 1, 6, 7, 14. Represents a physical delivery of material or product between two parties. The accompanying MaterialPassportCredential references the lotId within the shipment items.

```json
{
  "shipmentId": "SHIP-009912",
  "deliveryNoteNumber": "DN-440219",
  "purchaseOrderNumber": "PO-88271",
  "supplierId": "SUP-001",
  "manufacturerId": "MFG-001",
  "shipDate": "2026-03-25",
  "expectedArrivalDate": "2026-03-27",
  "items": [
    {
      "lineId": "10",
      "materialId": "MAT-AL-7075",
      "lotId": "LOT-2026-03-00182",
      "quantity": 1250.0,
      "uom": "kg"
    }
  ]
}
```

## Transaction (Product Transfer)

**Used in:** user stories 7, 8. Records the commercial transfer of a finished product from one party to another. The associated DPP is transferred together with the product.

```json
{
  "transactionId": "TX-99221",
  "seller": "PRODUCER-001",
  "buyer": "CONST-001",
  "productId": "BEAM-001",
  "dppId": "DPP-7788",
  "quantity": 50,
  "deliveryDate": "2026-04-10",
  "status": "pending | accepted | rejected"
}
```

## Asset Handover (Building Handover)

**Used in:** user story 8. Records the formal handover of a completed building (asset) from the construction company to the building owner, including the bundle of all associated DPPs.

```json
{
  "handoverId": "HO-001",
  "from": "CONST-001",
  "to": "OWNER-001",
  "assetId": "ASSET-001",
  "includedDPPs": ["DPP-7788"],
  "handoverDate": "2026-06-01",
  "status": "pending | accepted | rejected"
}
```

**Note:** On acceptance, the lifecycle stage of all included DPPs transitions to operation.
