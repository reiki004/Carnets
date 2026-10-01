import React, { useState, useEffect } from 'react';
import {
  sb,
  Club,
  Jugador,
  Administrativo,
  EstadoPie,
  CargoPie,
  clubRowToJs,
} from './services/supabaseService';
import { DEFAULTS } from './assets/cardAssets';
import { CardState, DEFAULT_CARD_STATE } from './components/CardPreview';
import { CardModal } from './components/CardModal';
import { PrintContainer } from './components/PrintContainer';
import { printCardDirectly } from './utils/printHelpers';
import { ScreenInicio } from './components/ScreenInicio';
import { ScreenBuscar } from './components/ScreenBuscar';
import { ScreenClub } from './components/ScreenClub';
import { ScreenAdmin } from './components/ScreenAdmin';
import { ScreenConfig } from './components/ScreenConfig';
import { Printer, HelpCircle, Sun, Moon, Sparkles, Layers } from 'lucide-react';

export default function App() {
  // Pestañas activas: exactamente 5 pantallas
  const [activeScreen, setActiveScreen] = useState<'inicio' | 'buscar' | 'club' | 'admin' | 'config'>('inicio');

  // Modo Claro / Oscuro (predeterminado Claro como solicitado por el usuario)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interclubes_theme');
      if (saved) return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('interclubes_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('interclubes_theme', 'light');
    }
  }, [isDarkMode]);

  // Estados cargados desde Supabase
  const [clubes, setClubes] = useState<Club[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [estadosCache, setEstadosCache] = useState<EstadoPie[]>([]);
  const [cargosCache, setCargosCache] = useState<CargoPie[]>([]);

  // Club seleccionado para la pantalla 'club'
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  // Estado del carnet para modal emergente y para impresión
  const [modalCard, setModalCard] = useState<CardState>(DEFAULT_CARD_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Guía Zebra ZC300
  const [showZebraModal, setShowZebraModal] = useState(false);

  // Carga de datos de Supabase
  const refreshClubes = async () => {
    try {
      const { data, error } = await sb.from('clubes').select('*').order('nombre_club');
      if (!error && data) {
        const list = data.map(clubRowToJs);
        setClubes(list);
        if (!selectedClubId && list.length > 0) {
          setSelectedClubId(list[0].ClubID);
        }
      }
    } catch (err) {
      console.warn('Error al cargar clubes:', err);
    }
  };

  const loadCategorias = async () => {
    try {
      const { data, error } = await sb.from('categorias').select('*').order('categoria');
      if (!error && data) {
        setCategorias(data.map((r: any) => r.categoria));
      }
    } catch (err) {
      console.warn('Error al cargar categorías:', err);
    }
  };

  const loadEstadosCargos = async () => {
    try {
      const [estRes, carRes] = await Promise.all([
        sb.from('estados').select('*').order('estado'),
        sb.from('cargos').select('*').order('cargo'),
      ]);

      if (!estRes.error && estRes.data) {
        setEstadosCache(estRes.data);
      }
      if (!carRes.error && carRes.data) {
        setCargosCache(carRes.data);
      }
    } catch (err) {
      console.warn('Error al cargar estados y cargos:', err);
    }
  };

  useEffect(() => {
    refreshClubes();
    loadCategorias();
    loadEstadosCargos();
  }, []);

  // Navegación entre pantallas
  const irAPantalla = (screenName: string, focusSection?: string) => {
    setActiveScreen(screenName as any);
    if (focusSection) {
      setTimeout(() => {
        const el = document.getElementById(focusSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  // Abrir modal con carnet específico
  const handleOpenCardModal = (card: CardState) => {
    setModalCard(card);
    setIsModalOpen(true);
  };

  const handlePrintCard = () => {
    printCardDirectly(modalCard);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN COMPACTA Y MODERNA */}
      <header className="screen-nav no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo en la parte superior izquierda de la aplicación: Imagen del Encabezado */}
          <div
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
            onClick={() => irAPantalla('inicio')}
            title="Ir al Inicio"
          >
            <img
              src={DEFAULTS.header}
              alt="INTER CLUBES"
              className="h-10 w-auto rounded object-contain shadow-xs border border-black/30"
            />
            <span className="hidden md:inline-block ml-1 text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
              Zebra ZC300 CR-80
            </span>
          </div>

          {/* Menú de 5 Pestañas con alto contraste */}
          <div className="hidden sm:flex items-center gap-1 ml-3 bg-slate-200/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeScreen === 'inicio'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => irAPantalla('inicio')}
            >
              🏠 Inicio
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeScreen === 'buscar'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => irAPantalla('buscar')}
            >
              🔍 Buscar
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeScreen === 'club'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => irAPantalla('club')}
            >
              ⚽ Club
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeScreen === 'admin'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => irAPantalla('admin')}
            >
              🧑‍💼 Admin.
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeScreen === 'config'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => irAPantalla('config')}
            >
              ⚙️ Config
            </button>
          </div>
        </div>

        {/* Acciones Rápidas del Encabezado */}
        <div className="flex items-center gap-2">
          {/* Botón de Modelo Predeterminado */}
          <button
            onClick={() => handleOpenCardModal(DEFAULT_CARD_STATE)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="Ver o editar el modelo base de carnet"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Modelo Base</span>
          </button>

          {/* Botón Guía Zebra ZC300 */}
          <button
            onClick={() => setShowZebraModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Guía Zebra ZC300</span>
          </button>

          {/* Conmutador Modo Claro / Modo Oscuro */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-1.5 p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </header>

      {/* Menú móvil */}
      <div className="sm:hidden flex items-center justify-around bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-1.5 no-print">
        <button
          className={`px-2 py-1 text-xs font-bold ${activeScreen === 'inicio' ? 'text-red-600 font-extrabold' : 'text-slate-500'}`}
          onClick={() => irAPantalla('inicio')}
        >
          Inicio
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold ${activeScreen === 'buscar' ? 'text-red-600 font-extrabold' : 'text-slate-500'}`}
          onClick={() => irAPantalla('buscar')}
        >
          Buscar
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold ${activeScreen === 'club' ? 'text-red-600 font-extrabold' : 'text-slate-500'}`}
          onClick={() => irAPantalla('club')}
        >
          Club
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold ${activeScreen === 'admin' ? 'text-red-600 font-extrabold' : 'text-slate-500'}`}
          onClick={() => irAPantalla('admin')}
        >
          Admin.
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold ${activeScreen === 'config' ? 'text-red-600 font-extrabold' : 'text-slate-500'}`}
          onClick={() => irAPantalla('config')}
        >
          Config
        </button>
      </div>

      {/* 2. CUERPO PRINCIPAL ESPACIOSO Y ÁGIL (SIN PANEL LATERAL PERMANENTE QUE RECORTE LA PANTALLA) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 no-print">
        {/* PANTALLA 1: INICIO */}
        {activeScreen === 'inicio' && (
          <ScreenInicio
            irAPantalla={irAPantalla}
            onOpenCardModal={() => handleOpenCardModal(DEFAULT_CARD_STATE)}
          />
        )}

        {/* PANTALLA 2: BUSCAR (CON VISTA PREVIA INTEGRADA EN LA MISMA PANTALLA) */}
        {activeScreen === 'buscar' && (
          <ScreenBuscar
            clubes={clubes}
            cargosCache={cargosCache}
            estadosCache={estadosCache}
            onOpenCardModal={handleOpenCardModal}
            onSelectCard={setModalCard}
          />
        )}

        {/* PANTALLA 3: CLUB (NÓMINA, IMPORTAR EXCEL, FOTOS MASIVAS) */}
        {activeScreen === 'club' && (
          <ScreenClub
            clubes={clubes}
            categorias={categorias}
            estadosCache={estadosCache}
            refreshClubes={refreshClubes}
            selectedClubId={selectedClubId}
            setSelectedClubId={setSelectedClubId}
            onOpenCardModal={handleOpenCardModal}
          />
        )}

        {/* PANTALLA 4: ADMIN (DIRECTIVOS Y ADMINISTRATIVOS) */}
        {activeScreen === 'admin' && (
          <ScreenAdmin
            cargosCache={cargosCache}
            onOpenCardModal={handleOpenCardModal}
          />
        )}

        {/* PANTALLA 5: CONFIG (CON GESTIÓN DE CLUBES INTEGRADA ADENTRO) */}
        {activeScreen === 'config' && (
          <ScreenConfig
            clubes={clubes}
            categorias={categorias}
            estadosCache={estadosCache}
            cargosCache={cargosCache}
            refreshClubes={refreshClubes}
            loadCategorias={loadCategorias}
            loadEstadosCargos={loadEstadosCargos}
            cardState={modalCard}
            setCardState={setModalCard}
          />
        )}
      </main>

      {/* 3. PANTALLA EMERGENTE (MODAL) DE VISTA PREVIA Y NIVELADORES DE TAMAÑO */}
      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={modalCard}
        onUpdateCard={setModalCard}
        onPrint={handlePrintCard}
      />

      {/* 4. MODAL GUÍA ZEBRA ZC300 */}
      {showZebraModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Impresión en Zebra ZC300 a Doble Cara
                </h3>
              </div>
              <button
                onClick={() => setShowZebraModal(false)}
                className="text-slate-400 hover:text-black dark:hover:text-white font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-red-600 dark:text-red-400 block mb-1">
                  1. Medidas exactas CR-80
                </span>
                El tamaño de la tarjeta está calibrado a <strong>55 × 86.5 mm</strong>.
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">
                  2. Configuración en el diálogo del navegador:
                </span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Selecciona la impresora <strong>Zebra ZC300</strong>.</li>
                  <li>Tamaño de papel: <strong>CR-80 (55 × 86.5 mm)</strong> o tarjeta estándar.</li>
                  <li>Márgenes: <strong>Ninguno (0 mm)</strong>.</li>
                  <li>Activa <strong>Impresión a doble cara</strong> (volteo automático de la impresora).</li>
                  <li>Marca la casilla <strong>Gráficos de fondo</strong> para imprimir todos los fondos y fotos.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowZebraModal(false)}
                className="file-btn text-xs font-bold px-4 py-2"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONTENEDOR EXCLUSIVO PARA IMPRESIÓN (SOLO VISIBLE EN @media print) */}
      <PrintContainer card={modalCard} />
    </div>
  );
}
