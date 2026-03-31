import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

export function VerificationBadge({ verified, size = 'md', showLabel = true }) {
  const Icon = verified ? CheckCircle : XCircle;
  const color = verified ? 'text-green-600' : 'text-red-600';
  const bgColor = verified ? 'bg-green-50' : 'bg-red-50';
  const label = verified ? 'Verified' : 'Invalid';

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
        bgColor,
        showLabel ? '' : 'px-1'
      )}
    >
      <Icon className={clsx(sizes[size], color)} />
      {showLabel && <span className={clsx('text-sm font-medium', color)}>{label}</span>}
    </span>
  );
}

export function StatusBadge({ status, size = 'md' }) {
  const config = {
    active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    revoked: { color: 'bg-red-100 text-red-800', icon: XCircle },
  };

  const { color, icon: Icon } = config[status] || config.pending;

  return (
    <span className={clsx('badge', color)}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
}

export function CredentialTypeBadge({ type }) {
  const typeConfig = {
    MaterialPassportCredential: { color: 'bg-blue-100 text-blue-800', short: 'Material' },
    TestReportCredential: { color: 'bg-purple-100 text-purple-800', short: 'Test' },
    ProductEnvironmentalCredential: { color: 'bg-green-100 text-green-800', short: 'LCA' },
    ProductCertificate: { color: 'bg-orange-100 text-orange-800', short: 'Cert' },
    DigitalProductPassport: { color: 'bg-indigo-100 text-indigo-800', short: 'DPP' },
    AssetHandoverCredential: { color: 'bg-teal-100 text-teal-800', short: 'Handover' },
    RepairCredential: { color: 'bg-pink-100 text-pink-800', short: 'Repair' },
  };

  const { color, short } = typeConfig[type] || { color: 'bg-gray-100 text-gray-800', short: type };

  return <span className={clsx('badge', color)}>{short || type}</span>;
}

export function CheckItem({ label, passed, details }) {
  return (
    <div className={clsx('verification-check', passed ? 'pass' : 'fail')}>
      {passed ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      <span>{label}</span>
      {details && <span className="text-gray-500 text-xs ml-1">({details})</span>}
    </div>
  );
}

export default VerificationBadge;
