import React, { useRef, useState } from 'react';
import { DEFAULTS } from '../assets/cardAssets';
import { toPng } from 'html-to-image';
import { Printer, Download, Sliders, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { printCardDirectly } from '../utils/printHelpers';

export interface CardState {
  tipo: 'socio' | 'admin';
  apellidos: string;
  nombres: string;
  clubname: string;
  photoUrl: string;
  photoScale?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  logoUrl: string;
  logoScale?: number;
  headerUrl: string;
  footerUrl: string;
  footerHeight?: number;
  fnac: string;
  dni: string;
  backTopUrl: string;
  backBottomUrl: string;
}

export const DEFAULT_CARD_STATE: CardState = {
  tipo: 'socio',
  apellidos: 'APELLIDO',
  nombres: 'NOMBRE',
  clubname: 'NOMBRE DEL CLUB',
  photoUrl: DEFAULTS.photo,
  photoScale: 100,
  photoOffsetX: 0,
  photoOffsetY: 0,
  logoUrl: DEFAULTS.logo,
  logoScale: 100,
  headerUrl: DEFAULTS.header,
  footerUrl: DEFAULTS.footer,
  footerHeight: 20,
  fnac: 'dd/mm/aaaa',
  dni: '00000000',
  backTopUrl: DEFAULTS.backtop,
  backBottomUrl: DEFAULTS.backbottom,
};

interface CardPreviewProps {
  card: CardState;
  onPrint?: () => void;
  showPrintButton?: boolean;
  onUpdateCard?: React.Dispatch<React.SetStateAction<CardState>> | ((updater: (prev: CardState) => CardState) => void);
  showControls?: boolean;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  onPrint,
  showPrintButton = true,
  onUpdateCard,
  showControls = true,
}) => {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // Selector de tamaño de vista previa (por defecto: grande)
  const [cardScale, setCardScale] = React.useState<'normal' | 'grande' | 'xl'>('grande');

  const cardDimensions = {
    normal: { w: '280px', h: '440px' },
    grande: { w: '330px', h: '519px' },
    xl: { w: '380px', h: '597px' },
  }[cardScale];

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (isPrinting) return;
    try {
      setIsPrinting(true);
      await printCardDirectly(card, frontRef.current, backRef.current);
    } catch (err) {
      console.error('Error al imprimir directamente:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportPng = async () => {
    try {
      const sanitized = `${card.apellidos}_${card.nombres}`
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase() || 'carnet';

      if (frontRef.current) {
        const dataUrl = await toPng(frontRef.current, {
          pixelRatio: 4,
          quality: 1,
          backgroundColor: '#ffffff',
          skipFonts: true,
          fontEmbedCSS: '',
        });
        const link = document.createElement('a');
        link.download = `carnet_frente_${sanitized}.png`;
        link.href = dataUrl;
        link.click();
      }

      if (backRef.current) {
        await new Promise((r) => setTimeout(r, 250));
        const dataUrl2 = await toPng(backRef.current, {
          pixelRatio: 4,
          quality: 1,
          backgroundColor: '#ffffff',
          skipFonts: true,
          fontEmbedCSS: '',
        });
        const link2 = document.createElement('a');
        link2.download = `carnet_dorso_${sanitized}.png`;
        link2.href = dataUrl2;
        link2.click();
      }

      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      console.error('Error al exportar PNG:', err);
    }
  };

  const isAdmin = card.tipo === 'admin';

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Barra superior de la vista previa con selector de tamaño */}
      <div className="w-full max-w-3xl flex items-center justify-between no-print px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <span className="text-[11px] font-bold uppercase tracking-wider bg-black/10 dark:bg-white/10 text-[#1a1a1a] dark:text-white border border-black/20 dark:border-white/20 px-2.5 py-0.5 rounded-full">
              Árbitro
            </span>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#e11d2e]/10 text-[#e11d2e] border border-[#e11d2e]/30 px-2.5 py-0.5 rounded-full">
              Jugador / Socio
            </span>
          )}
          <span className="text-xs font-bold text-[#555552] dark:text-slate-400">
            CR-80 · 55 × 86.5 mm
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de tamaño de tarjeta en pantalla */}
          <div className="flex items-center bg-[#f4f4f2] p-0.5 rounded-lg border border-[#dcdcd8] text-xs font-bold">
            <button
              onClick={() => setCardScale('normal')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                cardScale === 'normal'
                  ? 'bg-white text-[#1a1a1a] shadow-xs font-black'
                  : 'text-[#555552] hover:text-[#1a1a1a]'
              }`}
              title="Tamaño estándar (280px)"
            >
              Mediano
            </button>
            <button
              onClick={() => setCardScale('grande')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                cardScale === 'grande'
                  ? 'bg-white text-[#1a1a1a] shadow-xs font-black'
                  : 'text-[#555552] hover:text-[#1a1a1a]'
              }`}
              title="Tamaño grande (330px)"
            >
              Grande
            </button>
            <button
              onClick={() => setCardScale('xl')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                cardScale === 'xl'
                  ? 'bg-white text-[#1a1a1a] shadow-xs font-black'
                  : 'text-[#555552] hover:text-[#1a1a1a]'
              }`}
              title="Tamaño extra grande (380px)"
            >
              Extra Grande
            </button>
          </div>

          <button
            onClick={handleExportPng}
            className="text-xs font-bold text-[#1a1a1a] hover:bg-[#f4f4f2] flex items-center gap-1.5 bg-white border border-[#dcdcd8] px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
            title="Descargar imagen en 300 DPI"
          >
            <Download className="w-3.5 h-3.5 text-[#e11d2e]" />
            Descargar PNG (300 DPI)
          </button>
        </div>
      </div>

      {/* Tarjetas lado a lado (Frente y Dorso) */}
      <div className="flex gap-8 flex-wrap justify-center items-start print-area select-none">
        {/* CARA FRONTAL - MODELO EXACTO IMAGEN 2 */}
        <div className="card-block flex flex-col items-center gap-1.5">
          <span className="lbl no-print text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Frente
          </span>
          <div
            ref={frontRef}
            className="card card-front"
            id="cardFront"
            style={{ width: cardDimensions.w, height: cardDimensions.h }}
          >
            {/* 1. Encabezado ENCABEZADO.jpg */}
            <img
              className="f-header"
              id="imgHeader"
              src={card.headerUrl || DEFAULTS.header}
              alt="Encabezado"
            />

            {/* 2. Cuerpo interior con distribución pareja, centrada y sin sobreposiciones */}
            <div className="f-body">
              {/* Foto centrada arriba */}
              <div className="f-photo-box">
                <img
                  id="imgPhoto"
                  src={card.photoUrl || DEFAULTS.photo}
                  alt="Foto"
                  className="f-photo-img"
                  style={{
                    transform: `scale(${(card.photoScale ?? 100) / 100}) translate(${card.photoOffsetX ?? 0}px, ${card.photoOffsetY ?? 0}px)`,
                  }}
                />
              </div>

              {/* Apellido y Nombre centrados en letras negras */}
              <div className="f-names-box">
                <div className="f-apellidos" id="txtApellidos">
                  {card.apellidos ? card.apellidos.toUpperCase() : 'APELLIDO'}
                </div>
                <div className="f-nombres" id="txtNombres">
                  {card.nombres ? card.nombres.toUpperCase() : 'NOMBRE'}
                </div>
              </div>

              {/* Escudo / Logo del Club centrado */}
              {!isAdmin && (
                <div className="f-logo-box">
                  <img
                    id="imgLogo"
                    src={card.logoUrl || DEFAULTS.logo}
                    alt="Logo Club"
                    className="f-logo-img"
                    style={{
                      transform: `scale(${(card.logoScale ?? 100) / 100})`,
                    }}
                  />
                </div>
              )}

              {/* Nombre del Club o Cargo en letras negras */}
              <div className="f-club-box">
                <div className="f-clubname" id="txtClubname">
                  {card.clubname
                    ? card.clubname.toUpperCase()
                    : isAdmin
                    ? 'ÁRBITRO'
                    : 'NOMBRE DEL CLUB'}
                </div>
              </div>
            </div>

            {/* 3. Pie de diseño inferior facetado */}
            <img
              className="f-footer"
              id="imgFooter"
              src={card.footerUrl || DEFAULTS.footer}
              alt="Diseño Inferior"
              style={{
                height: `${card.footerHeight ?? 20}%`,
              }}
            />
          </div>
        </div>

        {/* CARA POSTERIOR (DORSO) */}
        <div className="card-block flex flex-col items-center gap-1.5">
          <span className="lbl no-print text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Dorso
          </span>
          <div
            ref={backRef}
            className="card card-back"
            id="cardBack"
            style={{ width: cardDimensions.w, height: cardDimensions.h }}
          >
            {/* Slogan superior "Futbol con historias" */}
            <img
              className="b-top"
              id="imgBackTop"
              src={card.backTopUrl || DEFAULTS.backtop}
              alt="Slogan"
            />

            {/* Datos centrales: Fecha de nacimiento y DNI en letras negras */}
            <div className="b-mid">
              <div className="b-field b-nac" id="txtNac">
                F. Nacimiento: {card.fnac || 'dd/mm/aaaa'}
              </div>
              <div className="b-field b-dni" id="txtDni">
                DNI: {card.dni || '00000000'}
              </div>
            </div>

            {/* Redes sociales y web */}
            <img
              className="b-bottom"
              id="imgBackBottom"
              src={card.backBottomUrl || DEFAULTS.backbottom}
              alt="Redes y Web"
            />
          </div>
        </div>
      </div>

      {/* Niveladores de Tamaño para Foto y Logo (Sliders) */}
      {showControls && onUpdateCard && (
        <div className="w-full max-w-lg bg-white border border-[#dcdcd8] p-4 rounded-xl shadow-xs text-xs space-y-3 no-print">
          <div className="flex items-center justify-between font-bold text-[#1a1a1a]">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#e11d2e]" />
              Niveladores de Tamaño y Encuadre
            </span>
            <button
              onClick={() => {
                onUpdateCard((prev) => ({
                  ...prev,
                  photoScale: 100,
                  photoOffsetX: 0,
                  photoOffsetY: 0,
                  logoScale: 100,
                  footerHeight: 20,
                }));
              }}
              className="text-[11px] font-bold text-[#555552] hover:text-[#e11d2e] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Restablecer 100%
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Zoom Foto */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-[#1a1a1a] mb-1">
                <span>Zoom Foto</span>
                <span className="font-mono text-[#e11d2e] font-bold">{card.photoScale ?? 100}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={card.photoScale ?? 100}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateCard((prev) => ({ ...prev, photoScale: val }));
                }}
                className="w-full accent-[#e11d2e] cursor-pointer h-1.5 bg-[#e9e9e6] rounded-lg"
              />
            </div>

            {/* Escala Logo */}
            {!isAdmin ? (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-[#1a1a1a] mb-1">
                  <span>Tamaño Escudo</span>
                  <span className="font-mono text-[#1a1a1a] font-bold">{card.logoScale ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="150"
                  value={card.logoScale ?? 100}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateCard((prev) => ({ ...prev, logoScale: val }));
                  }}
                  className="w-full accent-[#1a1a1a] cursor-pointer h-1.5 bg-[#e9e9e6] rounded-lg"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-[#1a1a1a] mb-1">
                  <span>Altura Pie Inferior</span>
                  <span className="font-mono text-[#e11d2e] font-bold">{card.footerHeight ?? 20}%</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="28"
                  value={card.footerHeight ?? 20}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateCard((prev) => ({ ...prev, footerHeight: val }));
                  }}
                  className="w-full accent-[#e11d2e] cursor-pointer h-1.5 bg-[#e9e9e6] rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Desplazamiento X / Y Foto */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px] font-bold text-[#1a1a1a] mb-1">
                <span>Mover Foto H.</span>
                <span className="font-mono text-[#555552]">{card.photoOffsetX ?? 0}px</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={card.photoOffsetX ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateCard((prev) => ({ ...prev, photoOffsetX: val }));
                }}
                className="w-full accent-[#555552] cursor-pointer h-1 bg-[#e9e9e6] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-[#1a1a1a] mb-1">
                <span>Mover Foto V.</span>
                <span className="font-mono text-[#555552]">{card.photoOffsetY ?? 0}px</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={card.photoOffsetY ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateCard((prev) => ({ ...prev, photoOffsetY: val }));
                }}
                className="w-full accent-[#555552] cursor-pointer h-1 bg-[#e9e9e6] rounded-lg"
              />
            </div>
          </div>

          {/* Control de altura del pie inferior para jugador */}
          {!isAdmin && (
            <div className="pt-1">
              <div className="flex justify-between text-[11px] font-bold text-[#1a1a1a] mb-1">
                <span>Espacio / Altura Pie Inferior</span>
                <span className="font-mono text-[#e11d2e] font-bold">{card.footerHeight ?? 20}%</span>
              </div>
              <input
                type="range"
                min="16"
                max="28"
                value={card.footerHeight ?? 20}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateCard((prev) => ({ ...prev, footerHeight: val }));
                }}
                className="w-full accent-[#e11d2e] cursor-pointer h-1.5 bg-[#e9e9e6] rounded-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Botón directo de impresión */}
      {showPrintButton && (
        <div className="actions no-print w-full max-w-md text-center">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="print-btn w-full flex items-center justify-center gap-2 shadow-md hover:shadow-red-600/25 active:scale-98 transition-all font-bold disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            {isPrinting
              ? 'Preparando carnet en 300 DPI...'
              : 'Imprimir carnet en Zebra ZC300 (Doble Cara)'}
          </button>
        </div>
      )}
    </div>
  );
};
