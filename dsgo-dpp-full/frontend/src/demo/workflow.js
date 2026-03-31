export const DEMO_RETURN_PATH = "/demo-workflow";
export const DEMO_PROGRESS_KEY = "demo_workflow_completed";

export const DEMO_STAGES = [
  {
    id: "supplier",
    title: "Supplier",
    role: "supplier",
    companyId: "acme-supplier",
    interfacePath: "/supplier/passport-issuance",
    objective: "Issue MaterialPassport and send it to Manufacturer.",
    outcome: "Manufacturer receives product material passport credential.",
    useCases: ["material"],
  },
  {
    id: "manufacturer",
    title: "Manufacturer",
    role: "manufacturer",
    companyId: "buildcorp",
    interfacePath: "/manufacturer",
    objective: "Receive incoming credentials for the product asset and issue handover package.",
    outcome: "Manufacturer acts as the credential aggregation point.",
    useCases: ["material", "certification"],
  },
  {
    id: "issuer_lca",
    title: "LCA -> Manufacturer",
    role: "lca_org",
    companyId: "greenlife",
    interfacePath: "/lca-org",
    objective: "Issue EnvironmentalFootprintTestPassport to Manufacturer.",
    outcome: "Environmental footprint credential becomes linked to the asset.",
    useCases: ["certification"],
  },
  {
    id: "tester",
    title: "Test Lab -> Manufacturer",
    role: "test_lab",
    companyId: "eurotest",
    interfacePath: "/test-lab",
    objective: "Issue TestReport credential to Manufacturer.",
    outcome: "Test results are attached to the manufacturer package.",
    useCases: ["certification"],
  },
  {
    id: "issuer_ce",
    title: "SKG IKOB -> Manufacturer",
    role: "certification_body",
    companyId: "certifyeu",
    interfacePath: "/certification-body",
    objective: "Issue CEMArkingTestREport to Manufacturer.",
    outcome: "CE marking evidence is linked with the asset package.",
    useCases: ["certification"],
  },
  {
    id: "construction",
    title: "Manufacturer -> Construction Company",
    role: "construction_company",
    companyId: "constructa",
    interfacePath: "/construction-company",
    objective: "Receive AssetHandoverCredential package and issue handover to owner.",
    outcome: "Construction company can forward verified package to owner.",
    useCases: ["handover"],
  },
  {
    id: "owner",
    title: "Construction Company -> Building Owner",
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
  if (stageId === "manufacturer") return completedSet.has("supplier");
  if (["issuer_lca", "tester", "issuer_ce"].includes(stageId)) {
    return completedSet.has("manufacturer");
  }
  if (stageId === "construction") {
    return hasAll(completedSet, ["manufacturer", "issuer_lca", "tester", "issuer_ce"]);
  }
  if (stageId === "owner") return completedSet.has("construction");
  return false;
}

export function getUseCaseStatus(completedSet) {
  return {
    material: hasAll(completedSet, ["supplier", "manufacturer"]),
    certification: hasAll(completedSet, ["issuer_lca", "tester", "issuer_ce"]),
    handover: hasAll(completedSet, ["construction", "owner"]),
  };
}

export function getNextSuggestedStage(completedSet) {
  return DEMO_STAGES.find((stage) => !completedSet.has(stage.id) && isStageUnlocked(stage.id, completedSet)) || null;
}
