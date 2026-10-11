import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342F27]/60 backdrop-blur-xs">
      <div className="bg-[#FAEDCD] rounded-2xl shadow-2xl border border-[#DCD5BC] w-full max-w-md p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${isDangerous ? 'bg-[#B83A32]/15 text-[#B83A32]' : 'bg-[#986515]/15 text-[#986515]'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#342F27]">{title}</h3>
            <p className="text-xs text-[#6B6255] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCD5BC]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              isDangerous
                ? 'bg-[#B83A32] hover:bg-[#8B5E34] text-white'
                : 'bg-[#D4A373] hover:bg-[#8B5E34] text-[#342F27] hover:text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
