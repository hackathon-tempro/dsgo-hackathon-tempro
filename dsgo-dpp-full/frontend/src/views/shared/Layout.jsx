import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Building2, User, Menu, X, Shield } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";

const ROLE_LABELS = {
  supplier: "Supplier",
  manufacturer: "Manufacturer",
  test_lab: "Test Lab",
  lca_org: "LCA Organisation",
  certification_body: "Certification Body",
  construction_company: "Construction Company",
  building_owner: "Building Owner",
  maintenance_company: "Maintenance Company",
  regulatory_authority: "Regulatory Authority",
  dismantling_company: "Dismantling Company",
  recycler: "Recycler",
};

export function Layout({ children, title, actions, navItems = [] }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname === "/" && user?.role) {
      const rolePath = `/${user.role.replace(/_/g, "-")}`;
      navigate(rolePath, { replace: true });
    }
  }, [location.pathname, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: logo + org name */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 leading-tight">
                    {title || ROLE_LABELS[user?.role]}
                  </h1>
                  <p className="text-xs text-gray-500 leading-tight">{user?.org}</p>
                </div>
              </div>
            </div>

            {/* Right: iSHARE ID + user + logout */}
            <div className="flex items-center gap-3">
              {/* iSHARE ID badge */}
              {user?.ishareId && (
                <div className="hidden md:flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div>
                    <div className="text-xs text-blue-400 leading-none">iSHARE ID</div>
                    <div className="text-xs font-mono font-semibold text-blue-700 leading-tight">
                      {user.ishareId}
                    </div>
                  </div>
                </div>
              )}

              {/* User name + title */}
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{user?.name}</span>
                </div>
                {user?.jobTitle && (
                  <span className="text-xs text-gray-400">{user.jobTitle}</span>
                )}
              </div>

              {actions}

              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-700"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        {navItems.length > 0 && (
          <div className="border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex gap-6 overflow-x-auto py-3">
                {navItems.map((item) => {
                  const normalize = (p = "") => p.replace(/\/+$/, "");
                  const current = normalize(location.pathname);
                  const target = normalize(item.path);
                  const roleRoot = `/${user?.role?.replace(/_/g, "-")}`;
                  const isActive =
                    current === target ||
                    (target && current.startsWith(target + "/")) ||
                    (target === "" && current === roleRoot) ||
                    current === roleRoot;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        "text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors",
                        isActive
                          ? "border-primary-500 text-primary-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="p-4 border-b">
              <div className="font-semibold">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.jobTitle}</div>
              <div className="text-xs text-gray-400">{user?.org}</div>
              {user?.ishareId && (
                <div className="mt-2 flex items-center gap-1 text-xs font-mono text-blue-600 bg-blue-50 rounded px-2 py-1">
                  <Shield className="w-3 h-3" />
                  {user.ishareId}
                </div>
              )}
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const normalize = (p = "") => p.replace(/\/+$/, "");
                const current = normalize(location.pathname);
                const target = normalize(item.path);
                const roleRoot = `/${user?.role?.replace(/_/g, "-")}`;
                const isActive =
                  current === target ||
                  (target && current.startsWith(target + "/")) ||
                  (target === "" && current === roleRoot) ||
                  current === roleRoot;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "block px-3 py-2 rounded-lg text-sm",
                      isActive ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
