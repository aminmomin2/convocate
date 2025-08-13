/**
 * Modal Component
 * 
 * A reusable modal component for dialogs, confirmations, and overlays.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({
  isOpen,
  title,
  children,
  actions,
  size = 'md',
  className = ""
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 w-full shadow-2xl ${sizeClasses[size]} ${className}`}>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="text-muted-foreground mb-6">
          {children}
        </div>
        {actions && (
          <div className="flex gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  size = 'md'
}: ConfirmationModalProps) {
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      size={size}
      actions={
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 ${variantClasses[variant]}`}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
