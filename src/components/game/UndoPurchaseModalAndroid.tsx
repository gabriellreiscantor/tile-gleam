import React from 'react';
import { X, Undo2, CreditCard, Shield } from 'lucide-react';

interface UndoPurchaseModalAndroidProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const UndoPurchaseModalAndroid: React.FC<UndoPurchaseModalAndroidProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-200 p-4">
      {/* Android Material Design style modal */}
      <div className="w-full max-w-sm bg-[#1e1e1e] rounded-3xl animate-in zoom-in-95 duration-200 overflow-hidden shadow-2xl">
        {/* Close button */}
        <div className="flex justify-end p-3">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 flex flex-col items-center gap-4">
          {/* Icon/Product */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Undo2 className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-white text-2xl font-bold text-center">
            Undo x3
          </h2>

          {/* Description */}
          <p className="text-white/60 text-sm text-center max-w-[260px]">
            Desfaça suas jogadas e tente novamente! 
            Pacote com 3 undos para usar quando quiser.
          </p>

          {/* Price card */}
          <div className="w-full bg-white/5 rounded-2xl p-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Preço</span>
              <span className="text-white text-2xl font-bold">US$ 0,99</span>
            </div>
          </div>

          {/* Stripe payment button */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 transition-all mt-2 shadow-lg shadow-indigo-500/30"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5 text-white" />
                <span className="text-white text-lg font-semibold">Comprar agora</span>
              </>
            )}
          </button>

          {/* Security badge */}
          <div className="flex items-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-white/40 text-xs">Pagamento seguro via Stripe</span>
          </div>

          {/* Terms */}
          <p className="text-white/30 text-[10px] text-center px-4">
            Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UndoPurchaseModalAndroid;
