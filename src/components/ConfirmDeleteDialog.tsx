import React from "react";
import ReactDOM from "react-dom";

interface ConfirmDeleteDialogProps {
  open: boolean;
  billName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteDialog = ({ open, billName, onConfirm, onCancel }: ConfirmDeleteDialogProps) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-100">¿Eliminar registro?</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6 pl-12">
          Estás a punto de eliminar{" "}
          <span className="font-medium text-slate-200">"{billName}"</span>. Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDeleteDialog;
