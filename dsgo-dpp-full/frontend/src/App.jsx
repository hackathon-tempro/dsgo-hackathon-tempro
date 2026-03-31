import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./views/Login";

import SupplierDashboard from "./views/supplier/Dashboard";
import ManufacturerDashboard from "./views/manufacturer/Dashboard";
import TestLabDashboard from "./views/test-lab/Dashboard";
import LCAOrgDashboard from "./views/lca-org/Dashboard";
import CertificationBodyDashboard from "./views/certification-body/Dashboard";
import ConstructionCompanyDashboard from "./views/construction-company/Dashboard";
import BuildingOwnerDashboard from "./views/building-owner/Dashboard";
import MaintenanceCompanyDashboard from "./views/maintenance-company/Dashboard";
import RegulatoryAuthorityDashboard from "./views/regulatory-authority/Dashboard";
import DismantlingCompanyDashboard from "./views/dismantling-company/Dashboard";
import RecyclerDashboard from "./views/recycler/Dashboard";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleBasedRouter() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route
        path="/supplier/*"
        element={
          <ProtectedRoute allowedRoles={["supplier"]}>
            <SupplierDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/*"
        element={
          <ProtectedRoute allowedRoles={["manufacturer"]}>
            <ManufacturerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-lab/*"
        element={
          <ProtectedRoute allowedRoles={["test_lab"]}>
            <TestLabDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lca-org/*"
        element={
          <ProtectedRoute allowedRoles={["lca_org"]}>
            <LCAOrgDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certification-body/*"
        element={
          <ProtectedRoute allowedRoles={["certification_body"]}>
            <CertificationBodyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/construction-company/*"
        element={
          <ProtectedRoute allowedRoles={["construction_company"]}>
            <ConstructionCompanyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/building-owner/*"
        element={
          <ProtectedRoute allowedRoles={["building_owner"]}>
            <BuildingOwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance-company/*"
        element={
          <ProtectedRoute allowedRoles={["maintenance_company"]}>
            <MaintenanceCompanyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/regulatory-authority/*"
        element={
          <ProtectedRoute allowedRoles={["regulatory_authority"]}>
            <RegulatoryAuthorityDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dismantling-company/*"
        element={
          <ProtectedRoute allowedRoles={["dismantling_company"]}>
            <DismantlingCompanyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recycler/*"
        element={
          <ProtectedRoute allowedRoles={["recycler"]}>
            <RecyclerDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={`/${user.role}`} replace />} />
    </Routes>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/*" element={<RoleBasedRouter />} />
    </Routes>
  );
}
