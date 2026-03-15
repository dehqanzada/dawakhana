import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading = false, confirmText = 'Sil', cancelText = 'İptal' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500 animate-bounce-subtle">
            <AlertTriangle size={40} />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-5 text-slate-500 font-bold hover:bg-slate-50 transition-colors border-r border-slate-100 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-6 py-5 text-rose-600 font-black hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
