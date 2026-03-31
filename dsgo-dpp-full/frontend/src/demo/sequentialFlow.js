import { useSyncExternalStore } from "react";

const FLOW_STORAGE_KEY = "demo_sequential_credential_flow_v2";
const FLOW_STORAGE_EVENT = "demo-sequential-flow-updated";

const REQUIRED_MANUFACTURER_TYPES = [
  "MaterialPassport",
  "EnvironmentalFootprintTestPassport",
  "CEMArkingTestREport",
];

const DOWNSTREAM_LINKED_TYPES = [
  "MaterialPassport",
  "CEMArkingTestREport",
  "EnvironmentalFootprintTestPassport",
];

let cachedRawState = null;
let cachedParsedState = null;

const CONSTRUCTION_VERIFY_ORDER = [
  "MaterialPassport",
  "CEMArkingTestREport",
  "EnvironmentalFootprintTestPassport",
];

const DEFAULT_STATE = {
  asset: {
    id: "ASSET-AFP-001",
    productId: "AFP-001",
    productName: "Aluminium Facade Panel",
    gtin: "08712345670012",
    manufacturer: "BuildCorp Manufacturers",
  },
  credentials: [],
  events: [],
};

function cloneDefaultState() {
  return {
    asset: { ...DEFAULT_STATE.asset },
    credentials: [],
    events: [],
  };
}

function normalizeState(parsed) {
  return {
    asset: parsed.asset || { ...DEFAULT_STATE.asset },
    credentials: Array.isArray(parsed.credentials) ? parsed.credentials : [],
    events: Array.isArray(parsed.events) ? parsed.events : [],
  };
}

function createCredential({
  type,
  issuerRole,
  issuerOrg,
  recipientRole,
  recipientOrg,
  payload = {},
  flowKey,
}) {
  const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    id,
    flowKey: flowKey || `${type}:${issuerRole}:${recipientRole}`,
    type,
    issuerRole,
    issuerOrg,
    recipientRole,
    recipientOrg,
    issuanceChannel: "Credenco Business Wallet",
    issuerWallet: {
      provider: "Credenco Business Wallet",
      ownerRole: issuerRole,
      ownerOrg: issuerOrg,
    },
    holderWallet: {
      provider: "Credenco Business Wallet",
      ownerRole: recipientRole,
      ownerOrg: recipientOrg,
    },
    issuedAt: new Date().toISOString(),
    payload,
    verifications: [],
  };
}

function safeReadState() {
  try {
    const raw = localStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) {
      if (cachedRawState === null && cachedParsedState) {
        return cachedParsedState;
      }
      cachedRawState = null;
      cachedParsedState = cloneDefaultState();
      return cachedParsedState;
    }
    if (raw === cachedRawState && cachedParsedState) {
      return cachedParsedState;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      cachedRawState = null;
      cachedParsedState = cloneDefaultState();
      return cachedParsedState;
    }
    cachedRawState = raw;
    cachedParsedState = normalizeState(parsed);
    return cachedParsedState;
  } catch {
    cachedRawState = null;
    cachedParsedState = cloneDefaultState();
    return cachedParsedState;
  }
}

function writeState(state) {
  const raw = JSON.stringify(state);
  const nextSnapshot = normalizeState(JSON.parse(raw));
  localStorage.setItem(FLOW_STORAGE_KEY, raw);
  cachedRawState = raw;
  cachedParsedState = nextSnapshot;
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    const event =
      typeof CustomEvent === "function"
        ? new CustomEvent(FLOW_STORAGE_EVENT)
        : { type: FLOW_STORAGE_EVENT };
    window.dispatchEvent(event);
  }
  return state;
}

function upsertCredential(state, nextCred) {
  const idx = state.credentials.findIndex((c) => c.flowKey === nextCred.flowKey);
  if (idx === -1) {
    state.credentials = [nextCred, ...state.credentials];
    return;
  }
  state.credentials[idx] = nextCred;
}

function recordEvent(state, event) {
  state.events = [
    ...state.events,
    {
      id: `${event.kind}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      at: new Date().toISOString(),
      ...event,
    },
  ];
}

function mergeAssetFromPayload(state, payload) {
  state.asset = {
    ...state.asset,
    productId: payload.productId || state.asset.productId,
    productName: payload.productName || payload.assetName || state.asset.productName,
    gtin: payload.gtin || state.asset.gtin,
  };
}

export function getFlowState() {
  return safeReadState();
}

export function getCredentialsForRecipient(recipientRole) {
  const state = safeReadState();
  return state.credentials.filter((c) => c.recipientRole === recipientRole);
}

export function getCredentialsByTypes(types) {
  const state = safeReadState();
  return state.credentials.filter((c) => types.includes(c.type));
}

export function issueFlowCredential(params) {
  const state = safeReadState();
  const credential = createCredential(params);
  mergeAssetFromPayload(state, params.payload || {});
  upsertCredential(state, credential);
  recordEvent(state, {
    kind: "issued",
    credentialId: credential.id,
    credentialType: credential.type,
    issuerOrg: credential.issuerOrg,
    recipientOrg: credential.recipientOrg,
  });
  writeState(state);
  return credential;
}

export function verifyCredential(credentialId, verifierRole, verifierOrg) {
  const state = safeReadState();
  const idx = state.credentials.findIndex((c) => c.id === credentialId);
  if (idx === -1) {
    return { ok: false, reason: "Credential not found" };
  }

  const cred = state.credentials[idx];
  const already = cred.verifications.some((v) => v.role === verifierRole);
  if (!already) {
    cred.verifications.push({
      role: verifierRole,
      org: verifierOrg,
      verifiedAt: new Date().toISOString(),
    });
    state.credentials[idx] = cred;
    recordEvent(state, {
      kind: "verified",
      credentialId: cred.id,
      credentialType: cred.type,
      verifierOrg,
      verifierRole,
    });
    writeState(state);
  }

  return { ok: true, credential: cred };
}

export function hasRoleVerified(credential, role) {
  return credential.verifications?.some((v) => v.role === role);
}

export function canManufacturerHandover() {
  const state = safeReadState();
  return REQUIRED_MANUFACTURER_TYPES.every((type) => {
    const cred = state.credentials.find((c) => c.type === type);
    return !!cred;
  });
}

export function getConstructionPackage() {
  const state = safeReadState();
  const handover = state.credentials.find(
    (c) => c.type === "AssetHandoverCredential" && c.issuerRole === "manufacturer" && c.recipientRole === "construction_company",
  );
  if (!handover) return null;

  const linked = handover.payload?.linkedCredentialIds || [];
  return {
    asset: state.asset,
    handover,
    linkedCredentials: state.credentials.filter((c) => linked.includes(c.id)),
  };
}

export function getBuildingOwnerPackage() {
  const state = safeReadState();
  const handover = state.credentials.find(
    (c) => c.type === "AssetHandoverCredential" && c.issuerRole === "construction_company" && c.recipientRole === "building_owner",
  );
  if (!handover) return null;

  const linked = handover.payload?.linkedCredentialIds || [];
  return {
    asset: state.asset,
    handover,
    linkedCredentials: state.credentials.filter((c) => linked.includes(c.id)),
  };
}

export function getConstructionNextTypeToVerify() {
  return null;
}

export function canConstructionHandoverToOwner() {
  const pkg = getConstructionPackage();
  if (!pkg) return false;

  return CONSTRUCTION_VERIFY_ORDER.every((type) => {
    const cred = pkg.linkedCredentials.find((c) => c.type === type);
    return !!cred;
  });
}

export function getCredentialById(id) {
  const state = safeReadState();
  return state.credentials.find((c) => c.id === id) || null;
}

export function getFlowEvents() {
  const state = safeReadState();
  return state.events;
}

export function getAsset() {
  const state = safeReadState();
  return state.asset;
}

export function getWalletViewForRole(role) {
  const state = safeReadState();
  const received = state.credentials.filter((credential) => credential.recipientRole === role);
  const issued = state.credentials.filter((credential) => credential.issuerRole === role);
  return { received, issued };
}

export function getRequiredManufacturerTypes() {
  return [...REQUIRED_MANUFACTURER_TYPES];
}

export function getConstructionVerificationOrder() {
  return [...CONSTRUCTION_VERIFY_ORDER];
}

export function getDownstreamLinkedTypes() {
  return [...DOWNSTREAM_LINKED_TYPES];
}

function findCredential(state, matcher) {
  return state.credentials.find(matcher) || null;
}

export function isDemoStageReady(stageId) {
  const state = safeReadState();

  if (stageId === "supplier") {
    return !!findCredential(
      state,
      (credential) =>
        credential.type === "MaterialPassport" &&
        credential.issuerRole === "supplier" &&
        credential.recipientRole === "manufacturer",
    );
  }

  if (stageId === "manufacturer") {
    return REQUIRED_MANUFACTURER_TYPES.every((type) =>
      state.credentials.some(
        (credential) => credential.type === type && credential.recipientRole === "manufacturer",
      ),
    );
  }

  if (stageId === "issuer_lca") {
    return !!findCredential(
      state,
      (credential) =>
        credential.type === "EnvironmentalFootprintTestPassport" &&
        credential.issuerRole === "lca_org" &&
        credential.recipientRole === "manufacturer",
    );
  }

  if (stageId === "issuer_ce") {
    return !!findCredential(
      state,
      (credential) =>
        credential.type === "CEMArkingTestREport" &&
        credential.issuerRole === "certification_body" &&
        credential.recipientRole === "manufacturer",
    );
  }

  if (stageId === "construction") {
    const handover = findCredential(
      state,
      (credential) =>
        credential.type === "AssetHandoverCredential" &&
        credential.issuerRole === "manufacturer" &&
        credential.recipientRole === "construction_company",
    );
    if (!handover) return false;
    const linkedIds = handover.payload?.linkedCredentialIds || [];
    return DOWNSTREAM_LINKED_TYPES.every((type) =>
      state.credentials.some(
        (credential) => credential.type === type && linkedIds.includes(credential.id),
      ),
    );
  }

  if (stageId === "owner") {
    const handover = findCredential(
      state,
      (credential) =>
        credential.type === "AssetHandoverCredential" &&
        credential.issuerRole === "construction_company" &&
        credential.recipientRole === "building_owner",
    );
    if (!handover) return false;
    const linkedIds = handover.payload?.linkedCredentialIds || [];
    const linked = state.credentials.filter((credential) => linkedIds.includes(credential.id));
    return linked.length > 0;
  }

  return false;
}

export function resetFlowState() {
  writeState(cloneDefaultState());
}

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(FLOW_STORAGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(FLOW_STORAGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useFlowSnapshot() {
  return useSyncExternalStore(subscribe, safeReadState, safeReadState);
}
