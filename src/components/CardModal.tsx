import React from 'react';
import { CardPreview, CardState } from './CardPreview';
import { Printer, X } from 'lucide-react';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardState;
  onUpdateCard?: React.Dispatch<React.SetStateAction<CardState>> | ((updater: (prev: CardState) => CardState) => void);
  onPrint?: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  card,
  onUpdateCard,
  onPrint,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-[#f4f4f2] border border-[#dcdcd8] rounded-2xl max-w-5xl w-full p-6 shadow-2xl relative space-y-4 my-auto animate-in fade-in zoom-in-95">
        {/* Cabecera del Modal (Div encabezado con texto blanco o rojo) */}
        <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#e11d2e]" />
            <h2 className="text-base font-bold text-[#1a1a1a]">
              Vista Previa e Impresión de Carnet (Zebra ZC300)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#555552] hover:text-[#1a1a1a] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con la vista previa y niveladores */}
        <div className="py-2">
          <CardPreview
            card={card}
            onPrint={onPrint}
            showPrintButton={true}
            onUpdateCard={onUpdateCard}
            showControls={true}
          />
        </div>
      </div>
    </div>
  );
};
