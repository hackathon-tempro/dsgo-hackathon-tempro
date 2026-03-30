# 16 — Assumptions and Open Questions

This section documents assumptions made during specification consolidation and open questions that require resolution before or during implementation.

## Assumptions

### A1 — Append-only DPP is enforced at platform level

The specification states that RepairCredential is "appended" and that the permission overwrite does not exist. It is assumed that the platform enforces this constraint at the API level (i.e., `POST /dpp/{productId}/append` does not accept a payload that modifies existing credentials, only adds new ones).

### A2 — Credenco is the sole DPP credential issuer

The DigitalProductPassport credential is always issued by Credenco on behalf of the manufacturer. Other credential types (TestReport, LCA, etc.) are issued by their respective actors. It is assumed that all parties have or will create a Credenco Business Wallet account.

### A3 — DID method is did:web

All organisations use `did:web` as their DID method. No `did:key`, `did:ion`, or other methods are referenced in the examples. This should be explicitly confirmed.

### A4 — iSHARE is the underlying trust/authorisation framework for DSGO

The DSGO Afsprakenstelsel uses the iSHARE Trust Framework for M2M identification, authentication, and authorisation. It is assumed that all participants are registered in the iSHARE/DSGO Participant Registry and that access tokens are obtained via the iSHARE OAuth 2.0 flow before calling platform APIs.

### A5 — BitstringStatusList endpoint is hosted by each issuer

Each issuing organisation hosts a BitstringStatusList endpoint at the URL specified in the `credentialStatus.id` field of issued credentials. Implementors must ensure this endpoint is publicly accessible and responds correctly to revocation checks.

### A6 — User story 9 is out of scope

User story 9 is not present in the source specification. It is assumed this was intentionally omitted or deferred. The gap in numbering should be documented for stakeholders.

### A7 — DismantlingPassportCredential exists but is not specified

The interaction table in Flow K references a DismantlingPassportCredential as being sent from manufacturer to dismantling company (user story 13), but no credential model is defined for this type. It is assumed this credential type needs to be defined.

## Open Questions

### Q1 — Credential schema registry

Where are the JSON-LD contexts / credential schemas hosted? Each credential type should reference a `@context` URL pointing to a published schema. No schema registry URL is defined in the source specification.

### Q2 — Key management for on-premise deployments

For parties running their own wallet infrastructure, what key management system (KMS) is required or recommended? The Credenco on-premise documentation references PKCS#12 key import — are hardware security modules (HSMs) in scope?

### Q3 — Revocation latency

The specification uses BitstringStatusList for revocation. What is the acceptable maximum latency between a revocation event and the credential being considered revoked by verifiers? Is there a caching/TTL policy?

### Q4 — GS1 EPCIS 2.0 scope

GS1 EPCIS 2.0 is listed as a standard for user story 14 (recycler) and optionally for user story 3 (test lab sample tracking). No EPCIS event model is defined. Is EPCIS in scope for the reference implementation, or only for future extension?

### Q5 — DismantlingPassportCredential definition

As noted in Assumption A7, the dismantling credential type is referenced but not defined. What claims does it contain? Who issues it? Is it the manufacturer (pre-issuing dismantling instructions) or the dismantling company (recording the outcome)?

### Q6 — Compliance proof request targeting

In Flow H, the system sends proof requests "to all DPP holders". How are these holders resolved? Does the Building Owner need to maintain a registry of all DPP holder DIDs and wallet endpoints for their building? This dependency should be made explicit.

### Q7 — DSGO Participant Registry integration

How does the platform verify that a counterparty is an active DSGO/iSHARE participant before accepting a credential or presentation? Is this check integrated into the platform API layer, or is it the responsibility of each implementing party?

### Q8 — Credential validity periods

The ProductEnvironmentalCredential example has a 5-year validity (`validUntil: 2031-03-27`). No validity period policy is defined for other credential types. Should validity periods be standardised across credential types, or left to issuer discretion?

## Sources Used

- **Source specification:** DSGO__DPP_Platform.md (version 1.0, March 2026) — provided as uploaded document
- **Credenco Business Wallet documentation:** docs.acc.credenco.com
- **Credenco API authentication:** docs.acc.credenco.com/docs/api/authentication
- **Credenco credential issuance guide:** docs.acc.credenco.com/docs/guide/credential-issue/intro
- **iSHARE Trust Framework — introduction and roles:** framework.ishare.eu
- **iSHARE technical overview:** framework.ishare.eu — technical overview
- **iSHARE Trust Body of Knowledge — authorisation:** trustbok.ishare.eu
- **DSGO programme information:** digigo.nu — afsprakenstelsel and veelgestelde-vragen-dsgo
- **DSGO richtinggevende principes:** docs.geostandaarden.nl/dsgo
