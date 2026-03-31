A few flows are important for a sequential flow in the frontend.


- Supplier -> Manufacturer -> MaterialPassport
- LCA -> Manufacturer -> EnvironmentalFootprintTestPassport
- Testlab -> Manufacturer -> TestReport
- SKG IKOB -> Manufacturer -> CEMArkingTestREport
- Manufactuer -> Construction Company -> AssetHandoverCredential
- Cons. Comp. -> Building owner -> AssetHandoverCredential

Each step leads to the next except the 3 certification flows which are in parallel.
Supplier screen with product moves to the Manufacturer
Test results move to the manufacturer and so on.

At the ending, the building owner is able to verify the various linked credentials.

The builder should see the Aseet product and the linked (test and CE marking and LCA report) credentials, and should be able to click a verify button on each of them in order.