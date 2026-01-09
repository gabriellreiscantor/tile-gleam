import React from 'react';
import { X, Undo2 } from 'lucide-react';

interface UndoPurchaseModalIOSProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const UndoPurchaseModalIOS: React.FC<UndoPurchaseModalIOSProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-in fade-in duration-200">
      {/* iOS-style bottom sheet */}
      <div className="w-full max-w-md bg-[#2c2c2e] rounded-t-3xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button 
            onClick={onClose}
            className="text-blue-500 text-base font-normal"
          >
            Cancelar
          </button>
          <span className="text-white/60 text-sm">Compra no app</span>
          <div className="w-16" /> {/* Spacer for alignment */}
        </div>

        {/* Content */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          {/* Icon/Product */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Undo2 className="w-9 h-9 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-white text-xl font-semibold text-center">
            Undo x3
          </h2>

          {/* Description */}
          <p className="text-white/60 text-sm text-center max-w-[280px]">
            Desfaça suas jogadas e tente novamente! 
            Pacote com 3 undos.
          </p>

          {/* Price */}
          <div className="text-white text-3xl font-bold mt-2">
            US$ 0,99
          </div>
        </div>

        {/* Payment button - Apple Pay style */}
        <div className="px-6 pb-8">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full h-14 bg-white rounded-xl flex items-center justify-center gap-3 active:bg-white/90 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {/* Apple logo */}
                <svg 
                  className="w-6 h-6" 
                  viewBox="0 0 24 24" 
                  fill="black"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-black text-lg font-semibold">Pay</span>
              </>
            )}
          </button>

          {/* Terms */}
          <p className="text-white/40 text-[10px] text-center mt-4 px-4">
            Pagamento será cobrado na sua conta Apple ID. 
            Ao continuar, você concorda com os Termos de Uso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UndoPurchaseModalIOS;
