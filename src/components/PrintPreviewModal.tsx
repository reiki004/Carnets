import React, { useState, useRef } from 'react';
import { CardData, PrinterSettings } from '../types/card';
import { CardFront } from './CardFront';
import { CardBack } from './CardBack';
import { downloadCardImage, triggerBrowserPrint } from '../utils/printHelpers';
import {
  Printer,
  Download,
  Rotate3d,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrintPreviewModalProps {
  cardData: CardData;
  printerSettings: PrinterSettings;
  setPrinterSettings: React.Dispatch<React.SetStateAction<PrinterSettings>>;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  cardData,
  printerSettings,
  setPrinterSettings,
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'flipper' | 'physical-scale'>('side-by-side');
  const [isFlipped, setIsFlipped] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Handle direct print with print mode setting
  const handlePrint = (mode: 'duplex' | 'front-only' | 'back-only') => {
    setPrinterSettings((prev) => ({ ...prev, printMode: mode }));
    // Allow React state to flush before launching native print dialog
    setTimeout(() => {
      triggerBrowserPrint();
    }, 100);
  };

  // Export 300 DPI image
  const handleExportPNG = async (side: 'front' | 'back' | 'both') => {
    setIsExporting(true);
    setExportSuccess(null);
    try {
      const sanitizedName = `${cardData.surnames}_${cardData.firstNames}`
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();

      if (side === 'front' || side === 'both') {
        if (frontCardRef.current) {
          await downloadCardImage(
            frontCardRef.current,
            `carnet_frente_${sanitizedName}_300dpi.png`
          );
        }
      }

      if (side === 'back' || side === 'both') {
        if (backCardRef.current) {
          // slight delay if both
          if (side === 'both') {
            await new Promise((r) => setTimeout(r, 400));
          }
          await downloadCardImage(
            backCardRef.current,
            `carnet_dorso_${sanitizedName}_300dpi.png`
          );
        }
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      setExportSuccess(
        side === 'both'
          ? '¡Ambas caras exportadas en 300 DPI exitosamente!'
          : `¡Cara ${side === 'front' ? 'frontal' : 'posterior'} exportada en 300 DPI!`
      );
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Vista Previa de Impresión Zebra ZC300
            </h2>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              CR-80 · 54 × 85.6 mm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualización fidedigna a escala real de ambas caras con tipografía monospaced y vectores originales.
          </p>
        </div>

        {/* View mode segmented buttons */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Ambas Caras
          </button>

          <button
            onClick={() => setViewMode('flipper')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'flipper'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            Giro 3D
          </button>

          <button
            onClick={() => setViewMode('physical-scale')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'physical-scale'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Escala Física 1:1
          </button>
        </div>
      </div>

      {/* Zoom Toolbar & Feedback Notification */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Zoom de previsualización:</span>
          <button
            onClick={() => setPreviewZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Reducir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-200">
            {Math.round(previewZoom * 100)}%
          </span>
          <button
            onClick={() => setPreviewZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPreviewZoom(1)}
            className="text-[11px] text-slate-400 hover:text-white ml-1 underline"
          >
            100%
          </button>
        </div>

        {exportSuccess && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            {exportSuccess}
          </div>
        )}
      </div>

      {/* Cards Canvas Container */}
      <div className="flex-1 min-h-[540px] flex items-center justify-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-auto relative">
        {/* VIEW 1: Side by Side (Both Front and Back displayed together) */}
        {viewMode === 'side-by-side' && (
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {/* FRONT SIDE */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Frente (Frontal)
                </span>
                <button
                  onClick={() => handleExportPNG('front')}
                  disabled={isExporting}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Download className="w-3 h-3" />
                  PNG 300 DPI
                </button>
              </div>

              <div
                className="transition-transform duration-200"
                style={{ transform: `scale(${previewZoom})` }}
              >
                <CardFront ref={frontCardRef} data={cardData} scale={1} />
              </div>
            </div>

            {/* BACK SIDE */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Dorso (Posterior)
                </span>
                <button
                  onClick={() => handleExportPNG('back')}
                  disabled={isExporting}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Download className="w-3 h-3" />
                  PNG 300 DPI
                </button>
              </div>

              <div
                className="transition-transform duration-200"
                style={{ transform: `scale(${previewZoom})` }}
              >
                <CardBack ref={backCardRef} data={cardData} scale={1} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: 3D Flip Card */}
        {viewMode === 'flipper' && (
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Hacer clic en la tarjeta o en el botón para voltear</span>
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 font-medium transition-colors"
              >
                <Rotate3d className="w-3.5 h-3.5" />
                {isFlipped ? 'Voltear al Frente' : 'Voltear al Dorso'}
              </button>
            </div>

            <div
              className="perspective-1000 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ transform: `scale(${previewZoom})` }}
            >
              <div
                className={`relative transition-transform duration-700 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                style={{
                  width: `${53.98 * 6.2}px`,
                  height: `${85.6 * 6.2}px`,
                }}
              >
                {/* Front face */}
                <div className="absolute inset-0 backface-hidden">
                  <CardFront data={cardData} scale={1} />
                </div>

                {/* Back face */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                  <CardBack data={cardData} scale={1} />
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              Lado actual: {isFlipped ? 'DORSO (POSTERIOR)' : 'FRENTE (FRONTAL)'}
            </span>
          </div>
        )}

        {/* VIEW 3: Physical Scale Calibration (Place credit card on screen) */}
        {viewMode === 'physical-scale' && (
          <div className="flex flex-col items-center justify-center max-w-xl text-center space-y-4">
            <div className="bg-slate-900 border border-slate-700/80 p-4 rounded-xl text-left space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Regla de Calibración 1:1 en Pantalla (CR-80)
              </span>
              <p className="text-xs text-slate-300">
                El tamaño estándar de una tarjeta plástica PVC (Zebra ZC300) es de <strong>85.60 mm de alto por 53.98 mm de ancho</strong> (mismo tamaño que una tarjeta de crédito o DNI físico).
              </p>
              <p className="text-xs text-slate-400">
                Coloque su tarjeta física sobre la pantalla para comprobar la proporción exacta:
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2">
              <div
                className="relative border-2 border-dashed border-emerald-500/70 rounded-lg p-1 bg-emerald-950/20"
                style={{ width: '53.98mm', height: '85.6mm' }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                  <span className="text-xs font-bold text-emerald-400">
                    53.98 mm × 85.60 mm
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Tamaño Real Físico CR-80
                  </span>
                </div>
              </div>

              <div style={{ width: '53.98mm', height: '85.6mm' }}>
                <CardFront data={cardData} scale={0.7} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Zebra ZC300 Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
        {/* Left Side: Export 300 DPI buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportPNG('both')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Descargar Ambas Caras (PNG 300 DPI)
          </button>
        </div>

        {/* Right Side: Print Duplex or Single */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrint('front-only')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all"
          >
            Solo Frente
          </button>

          <button
            onClick={() => handlePrint('back-only')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all"
          >
            Solo Dorso
          </button>

          <button
            onClick={() => handlePrint('duplex')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Imprimir en Zebra ZC300 (Doble Cara)
          </button>
        </div>
      </div>
    </div>
  );
};
