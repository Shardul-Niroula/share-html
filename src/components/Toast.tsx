import React from 'react';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={16} className="toast-icon success" />}
          {toast.type === 'info' && <Info size={16} className="toast-icon info" />}
          {toast.type === 'error' && <AlertCircle size={16} className="toast-icon error" />}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
