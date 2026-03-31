import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../shared/Layout';
import {
  Shield,
  FileCheck,
  CheckCircle,
  Flame,
  Leaf,
  ShieldCheck,
  Code2,
  Copy,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Review Queue', path: '/certification-body' },
  { label: 'Issued Credentials', path: '/certification-body/issued' },
];

// ---------------------------------------------------------------------------
// Mock pending certifications — pre-seeded for demo
// ---------------------------------------------------------------------------
const INITIAL_PENDING = [
  {
    id: 'cert-req-001',
    certificateType: 'FireResistanceCertificate',
    product: 'Aluminium Facade Panel AFP-001',
    applicant: 'BuildCorp Manufacturers',
    applicantIshareId: 'EU.EORI.DE000000002034',
    submittedAt: '2026-03-29',
    evidence: [
      { type: 'TestReportCredential', ref: 'TR-2026-001', issuer: 'EuroTest Lab', summary: 'Fire resistance test EN 13501-1 — Rating: EI60' },
      { type: 'MaterialPassportCredential', ref: 'vc-seed-001', issuer: 'Acme Aluminium Supplier', summary: 'Aluminium Facade Panel, recycled content 22%, CO₂ 2,840 kg/1000 units' },
    ],
    certDetails: {
      fireResistanceClass: 'EI60',
      testStandard: 'EN 13501-1',
      testLab: 'EuroTest Lab (EU.EORI.FR000000003045)',
      productId: 'AFP-001',
      validityYears: 5,
    },
  },
  {
    id: 'cert-req-002',
    certificateType: 'ProductEnvironmentalCertificate',
    product: 'Aluminium Facade Panel AFP-001',
    applicant: 'BuildCorp Manufacturers',
    applicantIshareId: 'EU.EORI.DE000000002034',
    submittedAt: '2026-03-30',
    evidence: [
      { type: 'ProductEnvironmentalCredential', ref: 'LCA-2026-041', issuer: 'GreenLife LCA', summary: 'LCA EN 15804+A2 — A1-A3: 2,840 kg CO₂e / 1,000 units' },
    ],
    certDetails: {
      carbonFootprintKgCO2e: 2840,
      recycledContentPercent: 22,
      lcaScope: 'A1–A3',
      standard: 'EN 15804+A2',
      lcaOrg: 'GreenLife LCA (EU.EORI.NL000000004056)',
      validityYears: 3,
    },
  },
];

// Seed of one already-issued cert to show in the issued tab on first load
const SEED_ISSUED = {
  id: 'vc-cert-seed-001',
  certificateType: 'FireResistanceCertificate',
  product: 'Steel Reinforcement Bar SRB-001',
  issuedAt: '2026-02-20T14:30:00Z',
  expiresAt: '2031-02-20T14:30:00Z',
  fireResistanceClass: 'R60',
  certId: 'CERT-EU-2026-00341',
};

// ---------------------------------------------------------------------------
// Build a W3C VC JSON preview for the modal
// ---------------------------------------------------------------------------
function buildVC(req, certId, issuedAt, expiresAt) {
  const base = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://dsgo.nl/contexts/building-products/v1',
    ],
    id: `urn:uuid:${certId}`,
    type: ['VerifiableCredential', req.certificateType],
    issuer: {
      id: 'did:web:certifyeu.be',
      name: 'CertifyEU',
      ishareId: 'EU.EORI.BE000000005067',
    },
    validFrom: issuedAt,
    validUntil: expiresAt,
    credentialStatus: {
      id: 'https://certifyeu.be/status/2026#42',
      type: 'BitstringStatusListEntry',
      statusListIndex: 42,
      statusListCredential: 'https://certifyeu.be/status/2026',
    },
    credentialSubject: {
      id: `urn:dpp:${req.certDetails.productId || 'AFP-001'}`,
      type: req.certificateType === 'FireResistanceCertificate' ? 'FireResistanceAssessment' : 'EnvironmentalAssessment',
      productName: req.product,
      certifiedBy: 'CertifyEU',
      ...(req.certificateType === 'FireResistanceCertificate'
        ? {
            fireResistanceClass: req.certDetails.fireResistanceClass,
            certificationStandard: req.certDetails.testStandard,
            testLab: req.certDetails.testLab,
            evidenceCredential: req.evidence[0].ref,
          }
        : {
            carbonFootprintKgCO2e: req.certDetails.carbonFootprintKgCO2e,
            recycledContentPercent: req.certDetails.recycledContentPercent,
            lcaScope: req.certDetails.lcaScope,
            lcaStandard: req.certDetails.standard,
            lcaOrganisation: req.certDetails.lcaOrg,
            evidenceCredential: req.evidence[0].ref,
          }),
    },
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'ecdsa-rdfc-2019',
      created: issuedAt,
      verificationMethod: 'did:web:certifyeu.be#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: 'z58DAdFf...Sj8K2p9Q',
    },
  };
  return base;
}

// ---------------------------------------------------------------------------
// VC Modal
// ---------------------------------------------------------------------------
function VCModal({ vc, onClose }) {
  const json = JSON.stringify(vc, null, 2);
  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary-600" />
            <span className="font-bold text-gray-900">Verifiable Credential (W3C VC 2.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="btn btn-outline text-xs flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" /> Copy JSON-LD
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1 p-5">
          <pre className="text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap">{json}</pre>
        </div>
        <div className="px-5 py-3 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            This credential is cryptographically signed with ECDSA · Issuer: <span className="font-mono">did:web:certifyeu.be</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Queue
// ---------------------------------------------------------------------------
function ReviewQueue({ pending, onApprove }) {
  const [selected, setSelected] = useState(pending[0] || null);
  const [submitting, setSubmitting] = useState(false);

  const isFireCert = selected?.certificateType === 'FireResistanceCertificate';

  const handleApprove = async () => {
    if (!selected) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1600));

    const now = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + (selected.certDetails.validityYears || 5));

    const certId = `CERT-EU-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const vc = buildVC(selected, certId, now.toISOString(), expiry.toISOString());

    const issued = {
      id: `vc-${certId}`,
      vc,
      certId,
      certificateType: selected.certificateType,
      product: selected.product,
      issuedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      fireResistanceClass: selected.certDetails.fireResistanceClass,
      carbonFootprint: selected.certDetails.carbonFootprintKgCO2e,
    };

    onApprove(selected.id, issued);
    setSelected(null);
    setSubmitting(false);
    toast.success('Certificate issued as Verifiable Credential!');
  };

  if (pending.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Review Queue</h2>
        <div className="card text-center py-12 text-gray-500">
          <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No pending certifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Review Queue</h2>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: list */}
        <div className="lg:col-span-2 space-y-3">
          {pending.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelected(req)}
              className={`card cursor-pointer transition-all hover:border-primary-300 ${
                selected?.id === req.id ? 'border-primary-500 bg-primary-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {req.certificateType === 'FireResistanceCertificate' ? (
                  <Flame className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                ) : (
                  <Leaf className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{req.certificateType}</p>
                  <p className="text-xs text-gray-500 truncate">{req.product}</p>
                  <p className="text-xs text-gray-400 mt-1">By {req.applicant}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{req.submittedAt}</span>
                <span className="badge badge-warning">Pending review</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="lg:col-span-3 card space-y-4">
            <div className="flex items-center gap-2">
              {isFireCert
                ? <Flame className="w-6 h-6 text-orange-500" />
                : <Leaf className="w-6 h-6 text-green-500" />}
              <div>
                <h3 className="font-bold text-gray-900">{selected.certificateType}</h3>
                <p className="text-xs text-gray-500">{selected.id}</p>
              </div>
            </div>

            {/* Applicant */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Applicant</span>
                <span className="font-medium">{selected.applicant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">iSHARE ID</span>
                <span className="font-mono text-xs text-blue-600">{selected.applicantIshareId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted</span>
                <span>{selected.submittedAt}</span>
              </div>
            </div>

            {/* Certificate details */}
            {isFireCert ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                  <Flame className="w-4 h-4" /> Fire Resistance Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-orange-400">Rating</span><p className="font-bold text-orange-700 text-lg">{selected.certDetails.fireResistanceClass}</p></div>
                  <div><span className="text-orange-400">Standard</span><p className="font-medium">{selected.certDetails.testStandard}</p></div>
                  <div className="col-span-2"><span className="text-orange-400">Test Lab</span><p className="font-medium">{selected.certDetails.testLab}</p></div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                  <Leaf className="w-4 h-4" /> Environmental Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-green-400">CO₂ Footprint</span><p className="font-bold text-red-600">{selected.certDetails.carbonFootprintKgCO2e?.toLocaleString()} kg CO₂e</p></div>
                  <div><span className="text-green-400">Recycled content</span><p className="font-bold text-green-700">{selected.certDetails.recycledContentPercent}%</p></div>
                  <div><span className="text-green-400">LCA scope</span><p className="font-medium">{selected.certDetails.lcaScope}</p></div>
                  <div><span className="text-green-400">Standard</span><p className="font-medium">{selected.certDetails.standard}</p></div>
                </div>
              </div>
            )}

            {/* Evidence */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Supporting Evidence</p>
              <div className="space-y-2">
                {selected.evidence.map((ev) => (
                  <div key={ev.ref} className="flex items-start gap-2 text-xs bg-white border rounded-lg p-2">
                    <ShieldCheck className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-primary-700">{ev.type}</span>
                      <span className="text-gray-400 ml-2 font-mono">{ev.ref}</span>
                      <p className="text-gray-500 mt-0.5">{ev.summary}</p>
                      <p className="text-gray-400">Issuer: {ev.issuer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="btn btn-success flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Issuing Verifiable Credential…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve &amp; Issue VC
                  </>
                )}
              </button>
              <button className="btn btn-outline px-4">Reject</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Issued credentials view
// ---------------------------------------------------------------------------
function IssuedView({ issued }) {
  const [vcModal, setVcModal] = useState(null);
  const all = [SEED_ISSUED, ...issued];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Issued Credentials</h2>
        <span className="text-sm text-gray-500">{all.length} certificate{all.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {all.map((cert) => (
          <div key={cert.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {cert.certificateType === 'FireResistanceCertificate'
                  ? <Flame className="w-5 h-5 text-orange-500" />
                  : <Leaf className="w-5 h-5 text-green-500" />}
                <span className="font-semibold text-sm">{cert.certificateType}</span>
              </div>
              <span className="badge badge-success flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Valid
              </span>
            </div>

            {cert.fireResistanceClass && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{cert.fireResistanceClass}</div>
                <div className="text-xs text-orange-400">Fire Resistance Class · EN 13501-1</div>
              </div>
            )}
            {cert.carbonFootprint && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                <div className="font-bold text-red-600">{cert.carbonFootprint?.toLocaleString()} kg CO₂e</div>
                <div className="text-xs text-green-500">Carbon footprint A1–A3</div>
              </div>
            )}

            <div className="text-xs text-gray-600 space-y-1">
              <div><span className="text-gray-400">Product: </span>{cert.product}</div>
              <div><span className="text-gray-400">Cert ID: </span><span className="font-mono">{cert.certId || 'CERT-EU-2026-00341'}</span></div>
              <div><span className="text-gray-400">Issued: </span>{new Date(cert.issuedAt).toLocaleDateString()}</div>
              <div><span className="text-gray-400">Expires: </span>{new Date(cert.expiresAt).toLocaleDateString()}</div>
            </div>

            {cert.vc && (
              <button
                onClick={() => setVcModal(cert.vc)}
                className="mt-3 btn btn-outline text-xs w-full flex items-center justify-center gap-1"
              >
                <Code2 className="w-3.5 h-3.5" /> View W3C Verifiable Credential
              </button>
            )}
          </div>
        ))}
      </div>

      {vcModal && <VCModal vc={vcModal} onClose={() => setVcModal(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-orange-50 rounded-lg">
        <Icon className="w-6 h-6 text-orange-600" />
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
export default function Dashboard() {
  const [pending, setPending] = useState(INITIAL_PENDING);
  const [issued, setIssued] = useState([]);
  const [newIssuedVC, setNewIssuedVC] = useState(null);

  const handleApprove = (reqId, issuedCert) => {
    setPending((prev) => prev.filter((r) => r.id !== reqId));
    setIssued((prev) => [issuedCert, ...prev]);
    setNewIssuedVC(issuedCert.vc);
  };

  return (
    <Layout title="Certification Body Dashboard" navItems={navItems}>
      {/* Auto-show VC modal after issuance */}
      {newIssuedVC && <VCModal vc={newIssuedVC} onClose={() => setNewIssuedVC(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileCheck} label="Pending Review" value={pending.length} />
        <StatCard icon={CheckCircle} label="Issued Certificates" value={issued.length + 1} />
        <StatCard icon={Shield} label="Active Certificates" value={issued.length + 1} />
      </div>

      <Routes>
        <Route path="" element={<ReviewQueue pending={pending} onApprove={handleApprove} />} />
        <Route path="issued" element={<IssuedView issued={issued} />} />
      </Routes>
    </Layout>
  );
}
