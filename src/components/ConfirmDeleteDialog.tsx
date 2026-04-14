import React from "react";
import ReactDOM from "react-dom";

interface ConfirmDeleteDialogProps {
  open: boolean;
  billName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteDialog = ({
  open,
  billName,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) => {
  if (!open) return null;

  // Portal para escapar el overflow/transform del DataGrid
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          ¿Eliminar registro?
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Estás a punto de eliminar{" "}
          <span className="font-medium text-gray-900">"{billName}"</span>. Esta
          acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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
