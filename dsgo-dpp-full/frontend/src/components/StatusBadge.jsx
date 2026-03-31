import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const statusConfig = {
  active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: null },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  verified: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle },
  unverified: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: AlertCircle },
  success: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertCircle },
  error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Info },
  draft: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: null },
  approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  expired: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
};

export function StatusBadge({
  status,
  size = 'md',
  variant = 'solid',
  showIcon = true,
  className,
  children,
}) {
  const config = statusConfig[status] || statusConfig.info;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const baseClasses = clsx(
    'inline-flex items-center gap-2 rounded-full font-medium transition-colors',
    sizeClasses[size],
    variant === 'solid' && clsx(config.bg, config.text),
    variant === 'outline' && clsx(config.text, 'border', config.border, 'bg-white'),
    variant === 'ghost' && clsx(config.text, 'hover:bg-gray-100'),
    className
  );

  return (
    <span className={baseClasses}>
      {showIcon && Icon && <Icon className="w-4 h-4" />}
      {children || status}
    </span>
  );
}

export default StatusBadge;
