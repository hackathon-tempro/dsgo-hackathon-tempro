import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Layout } from "../shared/Layout";
import {
  Package,
  FileText,
  Leaf,
  Plus,
  CheckCircle,
  ArrowRight,
  Info,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { issueFlowCredential } from "../../demo/sequentialFlow";

// ---------------------------------------------------------------------------
// Mock product catalogue with CO₂ lifecycle data
// ---------------------------------------------------------------------------
const MOCK_PRODUCTS = [
  {
    id: "AFP-001",
    name: "Aluminium Facade Panel",
    gtin: "08712345670012",
    category: "Facade Systems",
    status: "active",
    recycledContent: 22,
    co2Total: 2840,
    co2PerUnit: 2.84,
    unit: "panel",
    lifecycle: [
      { stage: "A1 · Raw material extraction", value: 1840, color: "#ef4444", pct: 65 },
      { stage: "A2 · Transport to factory",     value: 180,  color: "#f97316", pct: 6 },
      { stage: "A3 · Manufacturing",            value: 820,  color: "#eab308", pct: 29 },
      { stage: "D  · Recycled content credit",  value: -340, color: "#22c55e", pct: -12 },
    ],
    credentials: [],
  },
  {
    id: "INS-002",
    name: "Mineral Wool Insulation Panel",
    gtin: "08712345670029",
    category: "Insulation",
    status: "active",
    recycledContent: 8,
    co2Total: 4210,
    co2PerUnit: 4.21,
    unit: "m²",
    lifecycle: [
      { stage: "A1 · Raw material extraction", value: 2900, color: "#ef4444", pct: 69 },
      { stage: "A2 · Transport to factory",     value: 210,  color: "#f97316", pct: 5 },
      { stage: "A3 · Manufacturing",            value: 1100, color: "#eab308", pct: 26 },
      { stage: "D  · Recycled content credit",  value: -80,  color: "#22c55e", pct: -2 },
    ],
    credentials: [],
  },
];

// Static seed credential already in wallet before demo starts
const SEED_CREDENTIAL = {
  id: "vc-seed-001",
  type: "MaterialPassportCredential",
  productId: "AFP-001",
  productName: "Aluminium Facade Panel",
  issuedAt: "2026-03-20T09:15:00Z",
  lotId: "urn:lot:LOT-2026-03-00451",
  batchNumber: "BATCH-AL-2026-0451",
  recycledContent: 22,
  carbonFootprint: 2840,
  countryOfOrigin: "DE",
  verified: true,
};

// ---------------------------------------------------------------------------
// CO₂ bar (positive = emission, negative = credit)
// ---------------------------------------------------------------------------
function Co2Bar({ stage, value, color, pct, maxPct }) {
  const isCredit = value < 0;
  const barWidth = `${Math.abs(pct) / maxPct * 100}%`;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-48 text-gray-600 shrink-0 text-xs leading-tight">{stage}</div>
      <div className="flex-1 flex items-center gap-2">
        {isCredit ? (
          <div className="flex-1 flex justify-end">
            <div
              className="h-5 rounded"
              style={{ width: barWidth, backgroundColor: color, marginLeft: 'auto' }}
            />
          </div>
        ) : (
          <div className="flex-1">
            <div className="h-5 rounded" style={{ width: barWidth, backgroundColor: color }} />
          </div>
        )}
        <span className={`text-xs font-mono font-medium w-20 shrink-0 ${isCredit ? 'text-green-600' : 'text-gray-700'}`}>
          {isCredit ? `−${Math.abs(value)}` : `+${value}`} kg
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Products Overview — CO₂ storyline
// ---------------------------------------------------------------------------
function ProductsOverview({ onSelectProduct }) {
  const [expanded, setExpanded] = useState("AFP-001");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Products &amp; CO₂ Footprint</h2>
        <button className="btn btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {MOCK_PRODUCTS.map((product) => {
        const maxPct = Math.max(...product.lifecycle.map((l) => Math.abs(l.pct)));
        const isOpen = expanded === product.id;
        return (
          <div key={product.id} className="card border border-gray-200 overflow-hidden">
            {/* Product header row */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : product.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.id} · GTIN {product.gtin} · {product.category}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* CO₂ summary pill */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Leaf className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-gray-900">
                      {product.co2PerUnit.toFixed(2)} kg CO₂e
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">per {product.unit}</div>
                </div>
                <span className="badge badge-success">{product.status}</span>
              </div>
            </div>

            {/* Expanded CO₂ details */}
            {isOpen && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-red-600">{product.co2Total.toLocaleString()}</div>
                    <div className="text-xs text-red-400">kg CO₂e / 1,000 units</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{product.recycledContent}%</div>
                    <div className="text-xs text-green-400">Recycled content</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">A1–A3</div>
                    <div className="text-xs text-blue-400">Lifecycle scope</div>
                  </div>
                </div>

                {/* CO₂ breakdown chart */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Lifecycle CO₂ Breakdown</h4>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                    {product.lifecycle.map((l) => (
                      <Co2Bar key={l.stage} {...l} maxPct={maxPct} />
                    ))}
                    <div className="border-t border-gray-300 pt-2 flex items-center justify-between text-sm font-semibold">
                      <span className="text-gray-700">Net total (cradle-to-gate)</span>
                      <span className="text-gray-900 font-mono">{product.co2Total.toLocaleString()} kg CO₂e</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Source: Alba Concepts · EN 15804+A2 · Verification pending
                  </p>
                </div>

                {/* CTA */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectProduct?.(product)}
                    className="btn btn-primary flex items-center gap-2 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Issue MaterialPassportCredential
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passport Issuance — pre-filled from product, issues to wallet
// ---------------------------------------------------------------------------
function PassportIssuance({ selectedProduct, onIssued }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    lotId: selectedProduct ? `urn:lot:LOT-2026-03-${String(Math.floor(Math.random() * 90000) + 10000)}` : "",
    materialId: selectedProduct ? selectedProduct.id : "",
    batchNumber: selectedProduct ? `BATCH-AL-2026-${String(Math.floor(Math.random() * 9000) + 1000)}` : "",
    recycledContent: selectedProduct ? String(selectedProduct.recycledContent) : "",
    countryOfOrigin: "DE",
    carbonFootprint: selectedProduct ? String(selectedProduct.co2Total) : "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate network delay — no real backend needed
    await new Promise((r) => setTimeout(r, 1400));
    const credential = {
      id: `vc-${Date.now()}`,
      type: "MaterialPassportCredential",
      productId: formData.materialId,
      productName: selectedProduct?.name || formData.materialId,
      issuedAt: new Date().toISOString(),
      lotId: formData.lotId,
      batchNumber: formData.batchNumber,
      recycledContent: parseFloat(formData.recycledContent),
      carbonFootprint: parseFloat(formData.carbonFootprint),
      countryOfOrigin: formData.countryOfOrigin,
      verified: true,
    };
    setIssued(credential);
    onIssued?.(credential);
    issueFlowCredential({
      type: "MaterialPassport",
      issuerRole: "supplier",
      issuerOrg: user?.org || "Supplier",
      recipientRole: "manufacturer",
      recipientOrg: "Alkondor",
      payload: {
        productId: formData.materialId,
        productName: selectedProduct?.name || formData.materialId,
        gtin: selectedProduct?.gtin || "",
        lotId: formData.lotId,
        batchNumber: formData.batchNumber,
        recycledContent: parseFloat(formData.recycledContent),
        carbonFootprint: parseFloat(formData.carbonFootprint),
      },
    });
    setSubmitting(false);
    toast.success("MaterialPassport issued and sent to Manufacturer.");
  };

  if (issued) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="card border-2 border-green-300 bg-green-50">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="font-bold text-green-800">Credential Issued Successfully</h3>
              <p className="text-sm text-green-600">Stored in Credential Wallet</p>
            </div>
          </div>
          <CredentialCard cred={issued} />
          <button
            className="btn btn-outline mt-4 w-full"
            onClick={() => { setIssued(null); }}
          >
            Issue Another Credential
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl">
      <h2 className="text-lg font-semibold mb-1">Issue MaterialPassportCredential</h2>
      {selectedProduct && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          <Leaf className="w-4 h-4 text-green-500" />
          Pre-filled from <strong>{selectedProduct.name}</strong> ·
          CO₂: <strong>{selectedProduct.co2Total.toLocaleString()} kg CO₂e</strong> ·
          Recycled: <strong>{selectedProduct.recycledContent}%</strong>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Lot ID</label>
          <input type="text" className="input" value={formData.lotId}
            onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
            placeholder="urn:lot:LOT-2026-03-XXXXX" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Material ID</label>
            <input type="text" className="input" value={formData.materialId}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              placeholder="AFP-001" required />
          </div>
          <div>
            <label className="label">Batch Number</label>
            <input type="text" className="input" value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="BATCH-AL-2026-XXXX" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Country of Origin</label>
            <input type="text" className="input" value={formData.countryOfOrigin}
              onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
              placeholder="DE" required />
          </div>
          <div>
            <label className="label">Recycled Content (%)</label>
            <input type="number" step="0.1" className="input" value={formData.recycledContent}
              onChange={(e) => setFormData({ ...formData, recycledContent: e.target.value })}
              placeholder="22.0" required />
          </div>
        </div>
        <div>
          <label className="label">Carbon Footprint (kg CO₂e / 1,000 units)</label>
          <input type="number" step="0.1" className="input" value={formData.carbonFootprint}
            onChange={(e) => setFormData({ ...formData, carbonFootprint: e.target.value })}
            placeholder="2840" required />
        </div>
        <button type="submit" disabled={submitting} className="btn btn-primary w-full flex items-center justify-center gap-2">
          {submitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Issuing Verifiable Credential…
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Issue Credential
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shipments view (unchanged, minimal)
// ---------------------------------------------------------------------------
function ShipmentsView() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Outbound Shipments</h2>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>
      <div className="text-center py-12 text-gray-500 card">
        No shipments yet. Create a shipment to send materials with credentials.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credential card component
// ---------------------------------------------------------------------------
function CredentialCard({ cred }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-sm">{cred.type}</span>
        </div>
        <span className="badge badge-success flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Verified
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
        <div><span className="text-gray-400">Product</span><p className="font-medium text-gray-800">{cred.productName}</p></div>
        <div><span className="text-gray-400">Lot ID</span><p className="font-mono text-gray-800 truncate">{cred.lotId}</p></div>
        <div><span className="text-gray-400">CO₂ Footprint</span>
          <p className="font-bold text-red-600">{Number(cred.carbonFootprint).toLocaleString()} kg CO₂e</p>
        </div>
        <div><span className="text-gray-400">Recycled Content</span>
          <p className="font-bold text-green-600">{cred.recycledContent}%</p>
        </div>
        <div><span className="text-gray-400">Origin</span><p className="font-medium">{cred.countryOfOrigin}</p></div>
        <div><span className="text-gray-400">Issued</span><p className="font-medium">{new Date(cred.issuedAt).toLocaleDateString()}</p></div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs font-mono text-gray-400 truncate">
        {cred.id}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wallet View
// ---------------------------------------------------------------------------
function WalletView({ extraCredentials }) {
  const allCreds = [SEED_CREDENTIAL, ...extraCredentials];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Credential Wallet</h2>
        <span className="text-sm text-gray-500">{allCreds.length} credential{allCreds.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allCreds.map((cred) => (
          <CredentialCard key={cred.id} cred={cred} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, color = "primary" }) {
  const colors = {
    primary: "bg-primary-50 text-primary-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colors[color] || colors.primary}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root dashboard
// ---------------------------------------------------------------------------
const navItems = [
  { label: "Products & CO₂", path: "/supplier" },
  { label: "Passport Issuance", path: "/supplier/passport-issuance" },
  { label: "Shipments", path: "/supplier/shipments" },
  { label: "Credential Wallet", path: "/supplier/wallet" },
];

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [issuedCredentials, setIssuedCredentials] = useState([]);
  const [prefillProduct, setPrefillProduct] = useState(MOCK_PRODUCTS[0]);

  const handleIssued = (cred) => {
    setIssuedCredentials((prev) => [cred, ...prev]);
  };

  const totalCreds = issuedCredentials.length + 1; // +1 for seed

  return (
    <Layout title="Supplier Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Package} label="Active Products" value={MOCK_PRODUCTS.length} />
        <StatCard icon={FileText} label="Credentials in Wallet" value={totalCreds} color="blue" />
        <StatCard icon={Leaf} label="Avg CO₂ (kg/unit)" value="3.5" color="green" />
      </div>

      <Routes>
        <Route
          path=""
          element={
            <ProductsOverview
              onSelectProduct={(p) => {
                setPrefillProduct(p);
                navigate("/supplier/passport-issuance");
              }}
            />
          }
        />
        <Route
          path="passport-issuance"
          element={
            <PassportIssuance
              selectedProduct={prefillProduct || MOCK_PRODUCTS[0]}
              onIssued={handleIssued}
            />
          }
        />
        <Route path="shipments" element={<ShipmentsView />} />
        <Route
          path="wallet"
          element={<WalletView extraCredentials={issuedCredentials} />}
        />
      </Routes>
    </Layout>
  );
}
