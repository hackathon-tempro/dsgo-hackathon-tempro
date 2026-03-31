import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "../shared/Layout";
import {
  Package,
  FileText,
  Truck,
  Wallet,
  Plus,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { credentialsService, shipmentsService } from "../../services/api";

const navItems = [
  { label: "Products", path: "/supplier" },
  { label: "Passport Issuance", path: "/supplier/passport-issuance" },
  { label: "Outbound Shipments", path: "/supplier/shipments" },
  { label: "Wallet", path: "/supplier/wallet" },
];

function ProductsOverview() {
  const [products, setProducts] = useState([
    {
      id: "1",
      name: "Aluminium Facade Panel",
      category: "Construction Materials",
      status: "active",
    },
    {
      id: "2",
      name: "Steel Reinforcement Bar",
      category: "Steel Products",
      status: "active",
    },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Products</h2>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{product.name}</h3>
              <span className="badge badge-success">{product.status}</span>
            </div>
            <p className="text-sm text-gray-500">{product.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PassportIssuance({ onComplete }) {
  const [formData, setFormData] = useState({
    lotId: "",
    materialId: "",
    batchNumber: "",
    recycledContent: "",
    countryOfOrigin: "DE",
    carbonFootprint: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await credentialsService.issueMaterialPassport({
        lotId: formData.lotId,
        materialData: {
          materialId: formData.materialId,
          batchNumber: formData.batchNumber,
          recycledContentPercent: parseFloat(formData.recycledContent),
          countryOfOrigin: formData.countryOfOrigin,
          carbonFootprintKgCO2e: parseFloat(formData.carbonFootprint),
        },
      });
      toast.success("MaterialPassportCredential issued successfully!");
      setFormData({
        lotId: "",
        materialId: "",
        batchNumber: "",
        recycledContent: "",
        countryOfOrigin: "DE",
        carbonFootprint: "",
      });
      onComplete?.();
    } catch (error) {
      console.error("Failed to issue credential:", error);
      toast.error("Failed to issue credential");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">
        Create MaterialPassportCredential
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Lot ID</label>
          <input
            type="text"
            className="input"
            value={formData.lotId}
            onChange={(e) =>
              setFormData({ ...formData, lotId: e.target.value })
            }
            placeholder="urn:lot:LOT-2026-03-XXXXX"
            required
          />
        </div>
        <div>
          <label className="label">Material ID</label>
          <input
            type="text"
            className="input"
            value={formData.materialId}
            onChange={(e) =>
              setFormData({ ...formData, materialId: e.target.value })
            }
            placeholder="MAT-AL-7075"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Batch Number</label>
            <input
              type="text"
              className="input"
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              placeholder="BATCH-XXXXX"
              required
            />
          </div>
          <div>
            <label className="label">Country of Origin</label>
            <input
              type="text"
              className="input"
              value={formData.countryOfOrigin}
              onChange={(e) =>
                setFormData({ ...formData, countryOfOrigin: e.target.value })
              }
              placeholder="DE"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Recycled Content (%)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              value={formData.recycledContent}
              onChange={(e) =>
                setFormData({ ...formData, recycledContent: e.target.value })
              }
              placeholder="22.0"
              required
            />
          </div>
          <div>
            <label className="label">Carbon Footprint (kg CO2e)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              value={formData.carbonFootprint}
              onChange={(e) =>
                setFormData({ ...formData, carbonFootprint: e.target.value })
              }
              placeholder="3100.0"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? "Issuing..." : "Issue Credential"}
        </button>
      </form>
    </div>
  );
}

function ShipmentsView() {
  const [shipments, setShipments] = useState([]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Outbound Shipments</h2>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>
      {shipments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No shipments yet. Create a shipment to send materials with
          credentials.
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{shipment.shipment_id}</h3>
                  <p className="text-sm text-gray-500">
                    To: {shipment.to_organization_id}
                  </p>
                </div>
                <span className="badge badge-gray">{shipment.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletView() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await credentialsService.list().catch(() => ({ data: [] }));
      setCredentials(data.data || []);
    } catch (error) {
      console.error("Failed to load credentials:", error);
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Credential Wallet</h2>
      {credentials.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No credentials in wallet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => (
            <div key={cred.id} className="card">
              <h3 className="font-medium mb-2">{cred.type}</h3>
              <p className="text-xs text-gray-500 font-mono">
                {cred.credential_id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-primary-50 rounded-lg">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function SupplierDashboard() {
  const [products, setProducts] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [credsData] = await Promise.all([
        credentialsService.list().catch(() => ({ data: [] })),
      ]);
      setCredentials(credsData.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Supplier Dashboard" navItems={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Package}
          label="Products"
          value={products.length || 3}
        />
        <StatCard
          icon={FileText}
          label="Credentials"
          value={credentials.length}
        />
        <StatCard icon={Truck} label="Shipments" value={shipments.length} />
        <StatCard icon={Wallet} label="Wallet Balance" value="-" />
      </div>

      <Routes>
        <Route path="" element={<ProductsOverview />} />
        <Route
          path="passport-issuance"
          element={<PassportIssuance onComplete={loadData} />}
        />
        <Route path="shipments" element={<ShipmentsView />} />
        <Route path="wallet" element={<WalletView />} />
      </Routes>
    </Layout>
  );
}
