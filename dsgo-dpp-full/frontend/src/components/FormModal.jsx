import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  submitting = false,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && closeOnEsc && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          'bg-white rounded-lg shadow-xl w-full mx-4 overflow-hidden',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="btn btn-outline"
          >
            {cancelLabel}
          </button>
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Loading...' : submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Convenience component for form-based modals
export function FormModalField({
  label,
  name,
  type = 'text',
  required = false,
  error,
  help,
  children,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children ? (
        children
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          className={clsx('input', error && 'border-red-500')}
          {...props}
        />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {help && <p className="text-gray-500 text-xs mt-1">{help}</p>}
    </div>
  );
}

export default FormModal;
