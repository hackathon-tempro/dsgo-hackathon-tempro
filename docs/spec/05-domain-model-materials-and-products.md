# 05 — Domain Model: Materials and Products

## Material (Material Master)

**Used in:** user stories 1, 6, 14.

The master record for a material type. Does not represent a specific batch or quantity.

```json
{
  "materialId": "MAT-AL-7075",
  "materialName": "Aluminium Alloy 7075 Sheet",
  "materialCategory": "Raw Material",
  "specificationRef": "ASTM-B209",
  "supplierPartNumber": "SUP-7075-SHEET-2MM",
  "unitOfMeasure": "kg"
}
```

## Material Lot (Material Lot / Batch)

**Used in:** user stories 1, 3, 6, 14. This is the typical subject of a MaterialPassportCredential.

```json
{
  "lotId": "LOT-2026-03-00182",
  "materialId": "MAT-AL-7075",
  "batchNumber": "BATCH-77421",
  "productionDate": "2026-03-18",
  "netMassKg": 1250.0,
  "countryOfOrigin": "DE",
  "plantId": "SUP-PLANT-01"
}
```

**Lifecycle note:** A lot is created by the supplier at production time and is the primary traceability unit through the early supply chain stages.

## Product (Product Master)

**Used in:** user stories 2, 4, 5, 6, 7.

The master record for a product type (model/SKU level), not for a specific physical unit.

```json
{
  "productId": "PROD-2026-00031",
  "productName": "Industrieel Gevelpaneel X200",
  "productCategory": "Building component",
  "material": "Aluminium",
  "modelNumber": "X200-A",
  "manufacturerId": "ALK-001",
  "version": "1.0",
  "status": "active"
}
```

## Product Instance

**Used in:** user stories 2, 5, 6, 7, 11. Represents a unique, individually identifiable physical product unit.

```json
{
  "productInstanceId": "PI-00031",
  "productId": "PROD-2026-00031",
  "serialNumber": "SN-88271",
  "productionDate": "2026-03-27",
  "did": "did:example:product:PI-00031",
  "lifecycleStage": "manufactured | delivered | repaired | operational | end-of-life",
  "currentOwnerDid": "did:web:alkondor.example.com"
}
```

**Lifecycle stages:**

| Stage | Triggered by |
|-------|--------------|
| manufactured | Manufacturer creates product instance |
| delivered | Delivery to construction company confirmed |
| repaired | RepairCredential appended to DPP |
| operational | Building handover accepted |
| end-of-life | Dismantling or recycling initiated |

## Bill of Materials (BOM)

**Used in:** user stories 2, 6.

Defines the components that make up a manufactured product, linked to a Product Master.

```json
{
  "bomId": "BOM-00031",
  "productId": "PROD-2026-00031",
  "version": "1.0",
  "items": [
    {
      "componentName": "Aluminium frame",
      "material": "Aluminium",
      "quantity": 1,
      "unitOfMeasure": "pcs",
      "weight": 12.4,
      "originCountry": "NL"
    },
    {
      "componentName": "Fasteners",
      "material": "Steel",
      "quantity": 24,
      "unitOfMeasure": "pcs",
      "weight": 0.8,
      "originCountry": "DE"
    }
  ]
}
```

## Product Structure / Component Detail

**Used in:** user stories 11 (repair) and 13 (dismantling). Extends the BOM with component-level identity for repair and recovery tracking.

```json
{
  "productId": "FRAME-88321",
  "components": [
    {
      "componentId": "COMP-01",
      "name": "Outer aluminium housing",
      "massKg": 8.5,
      "removable": true
    },
    {
      "componentId": "COMP-02",
      "name": "Battery cells",
      "massKg": 42.0,
      "hazardous": true,
      "requiresSpecialHandling": true
    }
  ]
}
```
