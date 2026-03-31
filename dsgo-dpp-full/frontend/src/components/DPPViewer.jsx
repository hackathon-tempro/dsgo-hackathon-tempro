import React, { useState } from 'react';
import { CredentialCard, CredentialDetail } from './CredentialCard';
import { Timeline, SupplyChainTimeline } from './Timeline';
import { VerificationBadge, CheckItem } from './VerificationBadge';
import clsx from 'clsx';

export function DPPViewer({ dpp, credentials, history, onVerify }) {
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  if (!dpp) {
    return (
      <div className="text-center py-12 text-gray-500">
        No Digital Product Passport available
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'credentials', label: `Credentials (${credentials?.length || 0})` },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{dpp.product_name}</h2>
            <p className="text-sm text-gray-500">ID: {dpp.dpp_id || dpp.id}</p>
          </div>
          <VerificationBadge verified={dpp.is_immutable} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Product Type</span>
            <p className="font-medium">{dpp.product_type}</p>
          </div>
          <div>
            <span className="text-gray-500">Batch ID</span>
            <p className="font-medium">{dpp.batch_id}</p>
          </div>
          <div>
            <span className="text-gray-500">Manufacturer</span>
            <p className="font-medium">{dpp.organization_id}</p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p className="font-medium">
              {dpp.created_at
                ? new Date(dpp.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dpp.product_data && (
              <div className="card">
                <h3 className="font-semibold mb-3">Product Data</h3>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                  {typeof dpp.product_data === 'string'
                    ? dpp.product_data
                    : JSON.stringify(dpp.product_data, null, 2)}
                </pre>
              </div>
            )}

            {dpp.material_composition && (
              <div className="card">
                <h3 className="font-semibold mb-3">Material Composition</h3>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                  {typeof dpp.material_composition === 'string'
                    ? dpp.material_composition
                    : JSON.stringify(dpp.material_composition, null, 2)}
                </pre>
              </div>
            )}

            {dpp.hash && (
              <div className="card">
                <h3 className="font-semibold mb-3">Integrity Hash</h3>
                <p className="font-mono text-xs break-all">{dpp.hash}</p>
                <p className="text-xs text-gray-500 mt-2">
                  SHA-256 hash of DPP contents for integrity verification
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {credentials?.map((cred) => (
              <CredentialCard
                key={cred.id}
                credential={cred}
                onClick={() => setSelectedCredential(cred)}
              />
            ))}
            {(!credentials || credentials.length === 0) && (
              <p className="text-gray-500 col-span-full text-center py-8">
                No credentials attached to this DPP
              </p>
            )}
          </div>
        )}

        {activeTab === 'history' && <Timeline events={history} />}
      </div>

      {selectedCredential && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Credential Details</h3>
                <button
                  onClick={() => setSelectedCredential(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <CredentialDetail credential={selectedCredential} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DPPViewer;
