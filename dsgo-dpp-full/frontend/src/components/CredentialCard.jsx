import React from 'react';
import { CredentialTypeBadge, StatusBadge, VerificationBadge } from './VerificationBadge';
import { format } from 'date-fns';
import clsx from 'clsx';

export function CredentialCard({ credential, onClick, expanded = false }) {
  const { type, status, issued_at, expires_at, credential_id, subject_did } = credential;

  return (
    <div
      className={clsx(
        'card cursor-pointer hover:shadow-md transition-shadow',
        onClick && 'hover:border-primary-300'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <CredentialTypeBadge type={type} />
        <StatusBadge status={status} />
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-500">ID:</span>{' '}
          <span className="font-mono text-xs">{credential_id || credential.id}</span>
        </div>
        <div>
          <span className="text-gray-500">Subject:</span>{' '}
          <span className="font-mono text-xs">{subject_did}</span>
        </div>
        <div className="flex gap-4">
          <div>
            <span className="text-gray-500">Issued:</span>{' '}
            {issued_at ? format(new Date(issued_at), 'MMM d, yyyy') : '-'}
          </div>
          <div>
            <span className="text-gray-500">Expires:</span>{' '}
            {expires_at ? format(new Date(expires_at), 'MMM d, yyyy') : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CredentialDetail({ credential, verification }) {
  const { type, status, issuer, issued_at, expires_at, subject_data, metadata } = credential;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{type}</h3>
        <StatusBadge status={status} />
      </div>

      {verification && (
        <div className="card bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Verification Results</h4>
          <div className="space-y-2">
            {Object.entries(verification).map(([key, value]) => (
              <VerificationBadge
                key={key}
                verified={typeof value === 'boolean' ? value : undefined}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="label">Issuer</label>
          <p className="font-mono">{issuer || 'N/A'}</p>
        </div>
        <div>
          <label className="label">Issued</label>
          <p>{issued_at ? format(new Date(issued_at), 'PPpp') : 'N/A'}</p>
        </div>
        <div>
          <label className="label">Expires</label>
          <p>{expires_at ? format(new Date(expires_at), 'PPpp') : 'Never'}</p>
        </div>
      </div>

      {subject_data && (
        <div>
          <label className="label">Credential Subject</label>
          <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-auto">
            {JSON.stringify(subject_data, null, 2)}
          </pre>
        </div>
      )}

      {metadata?.authorisedBy && (
        <div>
          <label className="label">Authorised By</label>
          <p>
            {metadata.authorisedBy.name} ({metadata.authorisedBy.role})
          </p>
        </div>
      )}
    </div>
  );
}

export default CredentialCard;
