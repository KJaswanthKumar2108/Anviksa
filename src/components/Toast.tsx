import React from 'react';
import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Toast as ToastType } from '../hooks/useResearchStore';

interface ToastProps {
  toast: ToastType | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#287A50]" />,
    info: <Info className="w-4 h-4 text-[#8B5E34]" />,
    error: <AlertCircle className="w-4 h-4 text-[#B83A32]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#986515]" />
  };

  const bgColors = {
    success: 'bg-[#CCD5AE]/40 border-[#287A50]/30 text-[#342F27]',
    info: 'bg-[#FAEDCD] border-[#D4A373] text-[#342F27]',
    error: 'bg-[#B83A32]/10 border-[#B83A32]/30 text-[#342F27]',
    warning: 'bg-[#986515]/10 border-[#986515]/30 text-[#342F27]'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold max-w-md ${bgColors[toast.type]}`}>
        {icons[toast.type]}
        <span>{toast.message}</span>
        {onClose && (
          <button onClick={onClose} className="p-1 text-[#6B6255] hover:text-[#342F27] rounded-md transition-colors ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
