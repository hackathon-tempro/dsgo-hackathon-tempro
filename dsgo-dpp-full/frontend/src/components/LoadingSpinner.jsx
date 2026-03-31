import React from 'react';
import clsx from 'clsx';

export function LoadingSpinner({ size = 'md', message = 'Loading...', overlay = false }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={clsx(
          'rounded-full border-primary-600 border-t-transparent animate-spin',
          sizeClasses[size]
        )}
      />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
