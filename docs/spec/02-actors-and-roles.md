# 02 — Actors and Roles

Each actor in the platform holds one or more roles within two complementary frameworks: the DSGO data-sharing framework and the DPP ecosystem. A single legal entity may hold multiple roles simultaneously.

## Actor Overview

| Actor | Example Organisation | DSGO Role | DPP Role |
|-------|---------------------|-----------|----------|
| Aluminium supplier | Arconic | Data service rightsholder | Economic operator, supply chain actor |
| Manufacturer | Alkondor | Data service rightsholder, Data service provider | Economic operator, supply chain actor |
| Certification body | SKG-IKOB | Data service provider, Authorized data provider | Market surveillance authority |
| LCA organisation | Alba Concepts | Authorized data provider | Market surveillance authority, Independent operator |
| Construction company | Heijmans | Data service consumer | Economic operator, supply chain actor |
| Building owner | — | Data service rightsholder, Data service consumer | Independent operator |
| Maintenance company | DSG-gevelmontage | Data service consumer | Economic operator, supply chain actor |
| Regulatory authority | — | Authorized data provider | Market surveillance authority |
| Dismantling company | Lagemaat | Data service consumer | Independent operator |
| Recycler | — | Data service consumer | Recycler |
| DPP service provider | Credenco (Quintessence Research) | Data service provider, Authorized data provider | DPP service provider |

## DSGO Role Definitions

The DSGO (Digitaal Stelsel Gebouwde Omgeving) is the Dutch federated agreement framework for data sharing in the built environment. It defines four roles for data service participants:

| DSGO Role | Definition |
|-----------|-----------|
| **Data service rightsholder** | Party that holds sovereignty over the data |
| **Data service provider** | Party that makes data technically available via an API |
| **Authorized data service provider** | Recognised or trusted intermediary |
| **Data service consumer** | Party that consumes the data |

Participants register in the DSGO via the Participant Registry, which is used to verify whether a counterparty is an active, admitted member of the framework before a data exchange is initiated. Access control and delegation use the iSHARE Trust Framework (see **03-standards-and-technology.md**).

## DPP Role Definitions

| DPP Role | Definition |
|----------|-----------|
| **Economic operator** | Market party with commercial responsibility for the product |
| **Supply chain actor** | Party active in the production/delivery chain |
| **DPP service provider** | Technical provider of the DPP platform and credential issuance service |
| **Independent operator** | Third party not in the direct supply chain |
| **Recycler** | End-of-life material processor |
| **Market surveillance authority** | Supervisory or regulatory authority |

## Human Roles (Within Organisations)

These are the named human-facing roles referenced in user stories and UI interfaces:

- **ProductManager** — Creates products, manages product data
- **ProcurementOfficer** — Receives and evaluates incoming deliveries and credentials
- **CertManager** — Reviews LCA reports and approves certificate issuance
- **LabTechnician** — Records test results and issues test report credentials
- **ComplianceOfficer** — Runs portfolio compliance checks
- **RepairTechnician** — Registers repair events and issues RepairCredentials
- **AuthorityInspector** — Initiates audit requests and reviews presentations

See **04-domain-model-organizations.md** for the data models.
