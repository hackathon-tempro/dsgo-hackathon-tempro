export const DEMO_RETURN_PATH = "/demo-workflow";
export const DEMO_PROGRESS_KEY = "demo_workflow_completed";

export const DEMO_STAGES = [
  {
    id: "supplier",
    title: "Arconic",
    role: "supplier",
    companyId: "acme-supplier",
    interfacePath: "/supplier/passport-issuance",
    objective: "Issue MaterialPassport and send it to Manufacturer.",
    outcome: "Manufacturer receives product material passport credential.",
    useCases: ["material"],
  },
  {
    id: "issuer_lca",
    title: "Alba Concepts -> Alkondor",
    role: "lca_org",
    companyId: "greenlife",
    interfacePath: "/lca-org",
    objective: "Issue EnvironmentalFootprintTestPassport to Manufacturer.",
    outcome: "Environmental footprint credential becomes linked to the asset.",
    useCases: ["certification"],
  },
  {
    id: "issuer_ce",
    title: "SKG IKOB -> Alkondor",
    role: "certification_body",
    companyId: "certifyeu",
    interfacePath: "/certification-body",
    objective: "Issue CEMArkingTestREport to Manufacturer.",
    outcome: "CE marking evidence is linked with the asset package.",
    useCases: ["certification"],
  },
  {
    id: "manufacturer",
    title: "Alkondor",
    role: "manufacturer",
    companyId: "buildcorp",
    interfacePath: "/manufacturer",
    objective: "Receive incoming credentials for the product asset and issue handover package.",
    outcome: "Manufacturer acts as the credential aggregation point.",
    useCases: ["material", "certification"],
  },
  {
    id: "construction",
    title: "Alkondor -> Heijmans",
    role: "construction_company",
    companyId: "constructa",
    interfacePath: "/construction-company",
    objective: "Receive AssetHandoverCredential package and issue handover to owner.",
    outcome: "Construction company can forward verified package to owner.",
    useCases: ["handover"],
  },
  {
    id: "owner",
    title: "Heijmans -> VvE",
    role: "building_owner",
    companyId: "propinvest",
    interfacePath: "/building-owner",
    objective: "Receive final handover package with linked credentials.",
    outcome: "Building owner validates complete chain.",
    useCases: ["handover"],
  },
];

const STAGE_MAP = Object.fromEntries(DEMO_STAGES.map((s) => [s.id, s]));
const ROLE_STAGE_MAP = Object.fromEntries(DEMO_STAGES.map((s) => [s.role, s]));

export function getDemoStageById(stageId) {
  return STAGE_MAP[stageId] || null;
}

export function getDemoStageByRole(role) {
  return ROLE_STAGE_MAP[role] || null;
}

export function readDemoProgress() {
  try {
    const raw = localStorage.getItem(DEMO_PROGRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDemoProgress(progressIds) {
  localStorage.setItem(DEMO_PROGRESS_KEY, JSON.stringify(progressIds));
}

export function resetDemoProgress() {
  writeDemoProgress([]);
}

export function markDemoStageComplete(stageId) {
  const current = new Set(readDemoProgress());
  current.add(stageId);
  const next = Array.from(current);
  writeDemoProgress(next);
  return next;
}

function hasAll(completedSet, stageIds) {
  return stageIds.every((id) => completedSet.has(id));
}

export function isStageUnlocked(stageId, completedSet) {
  if (stageId === "supplier") return true;
  if (stageId === "issuer_lca") return completedSet.has("supplier");
  if (stageId === "issuer_ce") return completedSet.has("issuer_lca");
  if (stageId === "manufacturer") return completedSet.has("issuer_ce");
  if (stageId === "construction") return completedSet.has("manufacturer");
  if (stageId === "owner") return completedSet.has("construction");
  return false;
}

export function getUseCaseStatus(completedSet) {
  return {
    material: hasAll(completedSet, ["supplier", "manufacturer"]),
    certification: hasAll(completedSet, ["issuer_lca", "issuer_ce"]),
    handover: hasAll(completedSet, ["construction", "owner"]),
  };
}

export function getNextSuggestedStage(completedSet) {
  return DEMO_STAGES.find((stage) => !completedSet.has(stage.id) && isStageUnlocked(stage.id, completedSet)) || null;
}
