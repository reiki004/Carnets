import React, { useRef } from 'react';
import { CardData, PrinterSettings } from '../types/card';
import { CLUB_PRESETS } from './ClubLogoPresets';
import {
  Upload,
  RotateCcw,
  Sparkles,
  Sliders,
  Type,
  Shield,
  Palette,
  Calendar,
  CreditCard,
  Printer,
  ChevronRight,
  Info,
} from 'lucide-react';

interface CardEditorProps {
  cardData: CardData;
  setCardData: React.Dispatch<React.SetStateAction<CardData>>;
  printerSettings: PrinterSettings;
  setPrinterSettings: React.Dispatch<React.SetStateAction<PrinterSettings>>;
  activeTab: 'front' | 'back' | 'logo-footer' | 'printer';
  setActiveTab: (tab: 'front' | 'back' | 'logo-footer' | 'printer') => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  cardData,
  setCardData,
  printerSettings,
  setPrinterSettings,
  activeTab,
  setActiveTab,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const customLogoInputRef = useRef<HTMLInputElement>(null);
  const customFooterInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCardData((prev) => ({
          ...prev,
          photoUrl: event.target?.result as string,
          photoScale: 100,
          photoOffsetX: 0,
          photoOffsetY: 0,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Custom Club Logo upload
  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCardData((prev) => ({
          ...prev,
          customLogoUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Custom Footer upload
  const handleCustomFooterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCardData((prev) => ({
          ...prev,
          footerType: 'custom-image',
          customFooterUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Editor Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 select-none overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('front')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'front'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Frente (Foto & Nombres)
        </button>

        <button
          onClick={() => setActiveTab('logo-footer')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'logo-footer'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Club & Footer
        </button>

        <button
          onClick={() => setActiveTab('back')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'back'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          Dorso (DNI, Fecha & Redes)
        </button>

        <button
          onClick={() => setActiveTab('printer')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'printer'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          Zebra ZC300 Setup
        </button>
      </div>

      {/* Editor Tab Content */}
      <div className="p-5 overflow-y-auto space-y-6 text-sm flex-1 scrollbar-thin scrollbar-thumb-slate-700">
        {/* ===================== TAB 1: FRONT (PHOTO & NAMES) ===================== */}
        {activeTab === 'front' && (
          <div className="space-y-6">
            {/* Header Title Section */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Encabezado Frontal (Exacto Imagen 1)
                </span>
                <span className="text-[11px] text-slate-400">Balón con manos entrelazadas</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Texto Rojo
                  </label>
                  <input
                    type="text"
                    value={cardData.headerTitleRed}
                    onChange={(e) =>
                      setCardData((prev) => ({
                        ...prev,
                        headerTitleRed: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                    placeholder="INTER"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Texto Blanco
                  </label>
                  <input
                    type="text"
                    value={cardData.headerTitleWhite}
                    onChange={(e) =>
                      setCardData((prev) => ({
                        ...prev,
                        headerTitleWhite: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                    placeholder="CLUBES"
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  Foto de la Persona (Desde la PC)
                </span>
                {cardData.photoUrl && (
                  <button
                    onClick={() =>
                      setCardData((prev) => ({
                        ...prev,
                        photoUrl: null,
                        photoScale: 100,
                        photoOffsetX: 0,
                        photoOffsetY: 0,
                      }))
                    }
                    className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restablecer foto muestra
                  </button>
                )}
              </div>

              {/* Upload Drop Zone / Button */}
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-red-500/80 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-900/60 hover:bg-slate-900/90 group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-red-500/10 text-slate-300 group-hover:text-red-400 flex items-center justify-center mx-auto mb-2 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-medium text-slate-200 text-xs">
                  {cardData.photoUrl
                    ? 'Hacer clic para cambiar la foto desde la PC'
                    : 'Seleccionar o arrastrar foto desde la PC'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Formatos compatibles: JPG, PNG, WebP (alta resolución)
                </p>
              </div>

              {/* Adjust Photo Controls */}
              {cardData.photoUrl && (
                <div className="pt-2 border-t border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Ajuste de Zoom de Foto
                    </span>
                    <span className="font-mono text-slate-300">
                      {cardData.photoScale}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={cardData.photoScale}
                    onChange={(e) =>
                      setCardData((prev) => ({
                        ...prev,
                        photoScale: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-red-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />

                  {/* Offset X & Y */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Mover Horizontal</span>
                        <span className="font-mono">{cardData.photoOffsetX}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={cardData.photoOffsetX}
                        onChange={(e) =>
                          setCardData((prev) => ({
                            ...prev,
                            photoOffsetX: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-slate-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Mover Vertical</span>
                        <span className="font-mono">{cardData.photoOffsetY}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={cardData.photoOffsetY}
                        onChange={(e) =>
                          setCardData((prev) => ({
                            ...prev,
                            photoOffsetY: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-slate-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Surnames & First Names Input Section */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-yellow-400" />
                Apellidos y Nombres (Tipografía Exacta Monospaced)
              </span>

              {/* Surnames (Top) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  1. Apellidos (Parte Superior)
                </label>
                <input
                  type="text"
                  value={cardData.surnames}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      surnames: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-yellow-500"
                  placeholder="FLORES VILLACRE"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  En mayúsculas, centrado y con fuente Roboto Mono / Consolas negrita
                </span>
              </div>

              {/* First Names (Below) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Nombres (Debajo de los Apellidos)
                </label>
                <input
                  type="text"
                  value={cardData.firstNames}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      firstNames: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-yellow-500"
                  placeholder="AUGUSTO SERGIO FERNANDO"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: LOGO & FOOTER ===================== */}
        {activeTab === 'logo-footer' && (
          <div className="space-y-6">
            {/* Club Selection Section */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Seleccionar Logo del Club
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {cardData.selectedClubId === 'cc-el-bosque'
                    ? 'Default: Country Club El Bosque'
                    : 'Personalizado'}
                </span>
              </div>

              {/* Club Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLUB_PRESETS.map((club) => {
                  const isSelected =
                    cardData.selectedClubId === club.id && !cardData.customLogoUrl;
                  return (
                    <button
                      key={club.id}
                      onClick={() => {
                        setCardData((prev) => ({
                          ...prev,
                          selectedClubId: club.id,
                          customLogoUrl: null,
                          clubNameText: club.defaultLabel,
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                          : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center mb-1">
                        {club.renderLogo(0.55)}
                      </div>
                      <span className="text-[11px] font-semibold truncate w-full">
                        {club.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Upload Custom Club Logo */}
              <input
                type="file"
                ref={customLogoInputRef}
                onChange={handleCustomLogoUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="pt-2">
                <button
                  onClick={() => customLogoInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Subir Logo Personalizado desde PC (PNG/SVG)
                </button>
                {cardData.customLogoUrl && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                    <span>Logo personalizado activo</span>
                    <button
                      onClick={() =>
                        setCardData((prev) => ({ ...prev, customLogoUrl: null }))
                      }
                      className="text-red-400 hover:underline"
                    >
                      Quitar y usar preset
                    </button>
                  </div>
                )}
              </div>

              {/* Club Text label below logo */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Texto debajo del Logo (Ej: CC. EL BOSQUE)
                </label>
                <input
                  type="text"
                  value={cardData.clubNameText}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      clubNameText: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="CC. EL BOSQUE"
                />
              </div>

              {/* Logo scale */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Tamaño del Logo</span>
                  <span className="font-mono text-slate-300">
                    {cardData.logoScale}%
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="140"
                  value={cardData.logoScale}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      logoScale: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Bottom Design / Footer Upload Section */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                Diseño Inferior / Footer
              </span>

              {/* Footer Type Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setCardData((prev) => ({
                      ...prev,
                      footerType: 'default-yellow-polygon',
                    }))
                  }
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    cardData.footerType === 'default-yellow-polygon'
                      ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Polígono Amarillo (Ejemplo 1)
                </button>

                <button
                  onClick={() => customFooterInputRef.current?.click()}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    cardData.footerType === 'custom-image'
                      ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  Subir Footer desde PC
                </button>
              </div>

              {/* Hidden File input for custom footer */}
              <input
                type="file"
                ref={customFooterInputRef}
                onChange={handleCustomFooterUpload}
                accept="image/*"
                className="hidden"
              />

              {cardData.footerType === 'custom-image' && cardData.customFooterUrl && (
                <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                  <span>Imagen de footer personalizada cargada</span>
                  <button
                    onClick={() =>
                      setCardData((prev) => ({
                        ...prev,
                        footerType: 'default-yellow-polygon',
                        customFooterUrl: null,
                      }))
                    }
                    className="text-red-400 hover:underline"
                  >
                    Restablecer al diseño amarillo
                  </button>
                </div>
              )}

              {/* Footer Height Slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Altura del Footer en Tarjeta</span>
                  <span className="font-mono text-slate-300">
                    {cardData.footerHeightMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={cardData.footerHeightMm}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      footerHeightMm: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: BACK (DOB, DNI, SLOGAN & SOCIAL) ===================== */}
        {activeTab === 'back' && (
          <div className="space-y-6">
            {/* Slogan at top */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Slogan Superior Cursiva (Exacto Imagen 2)
              </span>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Texto del Slogan
                </label>
                <input
                  type="text"
                  value={cardData.sloganText}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      sloganText: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Futbol con historias"
                />
              </div>

              {/* Slogan font style */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    setCardData((prev) => ({ ...prev, sloganFont: 'caveat' }))
                  }
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    cardData.sloganFont === 'caveat'
                      ? 'border-purple-500 bg-purple-950/30 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Caveat Script
                </button>
                <button
                  onClick={() =>
                    setCardData((prev) => ({ ...prev, sloganFont: 'dancing' }))
                  }
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    cardData.sloganFont === 'dancing'
                      ? 'border-purple-500 bg-purple-950/30 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  Dancing Script
                </button>
                <button
                  onClick={() =>
                    setCardData((prev) => ({ ...prev, sloganFont: 'alex' }))
                  }
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    cardData.sloganFont === 'alex'
                      ? 'border-purple-500 bg-purple-950/30 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  style={{ fontFamily: "'Alex Brush', cursive" }}
                >
                  Alex Brush
                </button>
              </div>

              {/* Slogan font size */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Tamaño del Slogan</span>
                  <span className="font-mono text-slate-300">
                    {cardData.sloganFontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="38"
                  value={cardData.sloganFontSize}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      sloganFontSize: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Date of Birth & DNI Number manual inputs */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Datos Personales Manuales (F. Nacimiento & DNI)
              </span>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fecha de Nacimiento (DD/MM/AAAA)
                </label>
                <input
                  type="text"
                  value={cardData.dateOfBirth}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-blue-500"
                  placeholder="16/09/1964"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Se imprimirá como: &quot;F. Nacimiento: {cardData.dateOfBirth}&quot;
                </span>
              </div>

              {/* DNI Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número de Documento (DNI)
                </label>
                <input
                  type="text"
                  value={cardData.dniNumber}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      dniNumber: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-blue-500"
                  placeholder="07557840"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Se imprimirá como: &quot;DNI: {cardData.dniNumber}&quot;
                </span>
              </div>
            </div>

            {/* Social Icons & Web Links */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-green-400" />
                Redes Sociales y Web (Inferior Dorso)
              </span>

              {/* Toggle Icons */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cardData.showSocialIcons}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      showSocialIcons: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
                <span className="text-xs text-slate-300">
                  Mostrar 4 Iconos Circulares (TikTok, Facebook, Instagram, YouTube)
                </span>
              </label>

              {/* Social Handle */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Usuario de Redes
                </label>
                <input
                  type="text"
                  value={cardData.socialHandle}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      socialHandle: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-sans font-bold text-xs focus:outline-none focus:border-green-500"
                  placeholder="/Interclubesperu"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Sitio Web
                </label>
                <input
                  type="text"
                  value={cardData.websiteUrl}
                  onChange={(e) =>
                    setCardData((prev) => ({
                      ...prev,
                      websiteUrl: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-sans font-black text-xs focus:outline-none focus:border-green-500"
                  placeholder="www.interclubesperu.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: ZEBRA ZC300 PRINTER SETUP ===================== */}
        {activeTab === 'printer' && (
          <div className="space-y-6">
            {/* Zebra ZC300 Info Banner */}
            <div className="bg-gradient-to-r from-red-950/40 via-slate-800 to-slate-900 p-4 rounded-xl border border-red-900/40 space-y-2">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-red-400" />
                <span className="font-bold text-white text-sm">
                  Configuración para Impresora Zebra ZC300
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta plantilla está calibrada al estándar internacional <strong>CR-80</strong> (53.98 mm × 85.60 mm) a <strong>300 DPI</strong> de resolución térmica nativa con volteo automático dúplex (doble cara).
              </p>
            </div>

            {/* Print Mode */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Modo de Impresión en Driver Zebra
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    setPrinterSettings((prev) => ({
                      ...prev,
                      printMode: 'duplex',
                    }))
                  }
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center ${
                    printerSettings.printMode === 'duplex'
                      ? 'border-red-500 bg-red-950/40 text-white'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Doble Cara (Dúplex)
                </button>

                <button
                  onClick={() =>
                    setPrinterSettings((prev) => ({
                      ...prev,
                      printMode: 'front-only',
                    }))
                  }
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center ${
                    printerSettings.printMode === 'front-only'
                      ? 'border-red-500 bg-red-950/40 text-white'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Solo Frente
                </button>

                <button
                  onClick={() =>
                    setPrinterSettings((prev) => ({
                      ...prev,
                      printMode: 'back-only',
                    }))
                  }
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center ${
                    printerSettings.printMode === 'back-only'
                      ? 'border-red-500 bg-red-950/40 text-white'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Solo Dorso
                </button>
              </div>
            </div>

            {/* Mechanical Printer Calibration (Offset X & Y) */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Calibración de Rodillos Zebra (Offset mm)
              </span>
              <p className="text-[11px] text-slate-400">
                Ajuste fino milimétrico en caso de que su rodillo de arrastre tenga un desfase mecánico.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Desfase X (Horizontal)</span>
                    <span className="font-mono">{printerSettings.offsetXmm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={printerSettings.offsetXmm}
                    onChange={(e) =>
                      setPrinterSettings((prev) => ({
                        ...prev,
                        offsetXmm: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Desfase Y (Vertical)</span>
                    <span className="font-mono">{printerSettings.offsetYmm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={printerSettings.offsetYmm}
                    onChange={(e) =>
                      setPrinterSettings((prev) => ({
                        ...prev,
                        offsetYmm: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {(printerSettings.offsetXmm !== 0 || printerSettings.offsetYmm !== 0) && (
                <button
                  onClick={() =>
                    setPrinterSettings((prev) => ({
                      ...prev,
                      offsetXmm: 0,
                      offsetYmm: 0,
                    }))
                  }
                  className="text-xs text-blue-400 hover:underline block"
                >
                  Restablecer calibración a 0 mm
                </button>
              )}
            </div>

            {/* Printing Tips Card */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Info className="w-4 h-4 text-amber-400" />
                Guía Rápida para el Operador Zebra ZC300:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>En el diálogo de impresión de Windows/Chrome, seleccione la impresora <strong>Zebra ZC300</strong>.</li>
                <li>Verifique que el tamaño de papel esté en <strong>CR-80 (54 x 86 mm)</strong>.</li>
                <li>En Márgenes, seleccione <strong>&quot;Ninguno&quot;</strong> (0 mm).</li>
                <li>Marque la casilla <strong>&quot;Gráficos de fondo&quot;</strong> para imprimir fondos negros, amarillos y fotos.</li>
                <li>Asegúrese de tener cinta YMCKO o YMCKOK cargada en la bandeja de la ZC300.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
