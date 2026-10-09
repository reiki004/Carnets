import React, { useState, useEffect } from 'react';
import {
  sb,
  Club,
  Jugador,
  Administrativo,
  EstadoPie,
  CargoPie,
  clubRowToJs,
  fetchTernasSupabase,
} from './services/supabaseService';
import { DEFAULTS } from './assets/cardAssets';
import { CardState, DEFAULT_CARD_STATE } from './components/CardPreview';
import { CardModal } from './components/CardModal';
import { PrintContainer } from './components/PrintContainer';
import { printCardDirectly, printMultipleCardsDirectly } from './utils/printHelpers';
import { ScreenInicio } from './components/ScreenInicio';
import { ScreenBuscar } from './components/ScreenBuscar';
import { ScreenClub } from './components/ScreenClub';
import { ScreenAdmin } from './components/ScreenAdmin';
import { ScreenConfig } from './components/ScreenConfig';
import { HelpCircle, Layers, Printer } from 'lucide-react';

export default function App() {
  // Pestañas activas: exactamente 5 pantallas
  const [activeScreen, setActiveScreen] = useState<'inicio' | 'buscar' | 'club' | 'admin' | 'config'>('inicio');

  // Asegurar tema de colores claro en toda la aplicación, con encabezado y menú en tema oscuro
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.removeItem('interclubes_theme');
  }, []);

  // Estados cargados desde Supabase
  const [clubes, setClubes] = useState<Club[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [ternas, setTernas] = useState<string[]>([]);
  const [estadosCache, setEstadosCache] = useState<EstadoPie[]>([]);
  const [cargosCache, setCargosCache] = useState<CargoPie[]>([]);

  // Club seleccionado para la pantalla 'club'
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  // Estado del carnet para modal emergente y para impresión
  const [modalCard, setModalCard] = useState<CardState>(DEFAULT_CARD_STATE);
  const [batchPrintCards, setBatchPrintCards] = useState<CardState[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Guía Zebra ZC300
  const [showZebraModal, setShowZebraModal] = useState(false);

  const handleBatchPrint = async (cards: CardState[]) => {
    setBatchPrintCards(cards);
    await printMultipleCardsDirectly(cards);
  };

  // Carga de datos de Supabase
  const refreshClubes = async () => {
    try {
      const { data, error } = await sb.from('clubes').select('*').order('nombre_club');
      if (!error && data) {
        const list = data.map(clubRowToJs);
        setClubes(list);
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

  const loadTernas = async () => {
    try {
      const list = await fetchTernasSupabase();
      setTernas(list);
    } catch (err) {
      console.warn('Error al cargar ternas:', err);
    }
  };

  useEffect(() => {
    refreshClubes();
    loadCategorias();
    loadEstadosCargos();
    loadTernas();
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
    const frontEl = document.getElementById('cardFront');
    const backEl = document.getElementById('cardBack');
    printCardDirectly(modalCard, frontEl, backEl);
  };

  return (
    <div className="min-h-screen bg-[#e9e9e6] text-[#1a1a1a] flex flex-col font-sans transition-colors duration-200">
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN (DIV ENCABEZADO CON TEMA OSCURO Y MENÚ) */}
      <header
        style={{ backgroundColor: '#000000' }}
        className="screen-nav no-print sticky top-0 z-40 bg-[#000000] border-b border-[#27272a] shadow-md px-4 py-2.5 flex items-center justify-between text-white"
      >
        <div className="flex items-center gap-3">
          {/* Logo en la parte superior izquierda de la aplicación */}
          <div
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
            onClick={() => irAPantalla('inicio')}
            title="Ir al Inicio"
          >
            <img
              src={DEFAULTS.header}
              alt="INTER CLUBES"
              style={{ borderColor: '#000000', borderWidth: '1px' }}
              className="h-10 w-auto rounded object-contain shadow-xs border border-[#000000] bg-white"
            />
            <span className="hidden md:inline-block ml-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full border border-white/15">
              Zebra ZC300 CR-80
            </span>
          </div>

          {/* Menú de 5 Pestañas en tema oscuro */}
          <div className="hidden sm:flex items-center gap-1.5 ml-3 bg-[#09090b]/80 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeScreen === 'inicio'
                  ? 'bg-[#e11d2e] text-white shadow-sm font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 font-bold'
              }`}
              onClick={() => irAPantalla('inicio')}
            >
              🏠 Inicio
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeScreen === 'buscar'
                  ? 'bg-[#e11d2e] text-white shadow-sm font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 font-bold'
              }`}
              onClick={() => irAPantalla('buscar')}
            >
              🔍 Buscar
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeScreen === 'club'
                  ? 'bg-[#e11d2e] text-white shadow-sm font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 font-bold'
              }`}
              onClick={() => irAPantalla('club')}
            >
              ⚽ Club
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeScreen === 'admin'
                  ? 'bg-[#e11d2e] text-white shadow-sm font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 font-bold'
              }`}
              onClick={() => irAPantalla('admin')}
            >
              ⚖️ Árbitros
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeScreen === 'config'
                  ? 'bg-[#e11d2e] text-white shadow-sm font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 font-bold'
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
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-200 bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
            title="Ver o editar el modelo base de carnet"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-300" />
            <span>Modelo Base</span>
          </button>

          {/* Botón Guía Zebra ZC300 */}
          <button
            onClick={() => setShowZebraModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-200 bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Guía Zebra ZC300</span>
          </button>
        </div>
      </header>

      {/* Menú móvil en tema oscuro */}
      <div className="sm:hidden flex items-center justify-around bg-[#18181b] border-b border-[#27272a] py-2 no-print px-2 gap-1 text-white">
        <button
          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${activeScreen === 'inicio' ? 'bg-[#e11d2e] text-white font-extrabold' : 'text-zinc-300 hover:text-white'}`}
          onClick={() => irAPantalla('inicio')}
        >
          Inicio
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${activeScreen === 'buscar' ? 'bg-[#e11d2e] text-white font-extrabold' : 'text-zinc-300 hover:text-white'}`}
          onClick={() => irAPantalla('buscar')}
        >
          Buscar
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${activeScreen === 'club' ? 'bg-[#e11d2e] text-white font-extrabold' : 'text-zinc-300 hover:text-white'}`}
          onClick={() => irAPantalla('club')}
        >
          Club
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${activeScreen === 'admin' ? 'bg-[#e11d2e] text-white font-extrabold' : 'text-zinc-300 hover:text-white'}`}
          onClick={() => irAPantalla('admin')}
        >
          Árbitros
        </button>
        <button
          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${activeScreen === 'config' ? 'bg-[#e11d2e] text-white font-extrabold' : 'text-zinc-300 hover:text-white'}`}
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
            onBatchPrint={handleBatchPrint}
          />
        )}

        {/* PANTALLA 4: ADMIN (ÁRBITROS Y DIRECTIVOS) */}
        {activeScreen === 'admin' && (
          <ScreenAdmin
            cargosCache={cargosCache}
            ternas={ternas}
            onOpenCardModal={handleOpenCardModal}
          />
        )}

        {/* PANTALLA 5: CONFIG (CON GESTIÓN DE CLUBES INTEGRADA ADENTRO) */}
        {activeScreen === 'config' && (
          <ScreenConfig
            clubes={clubes}
            categorias={categorias}
            ternas={ternas}
            loadTernas={loadTernas}
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
      />

      {/* 4. MODAL GUÍA ZEBRA ZC300 */}
      {showZebraModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(233, 233, 230, 0.75)' }}
        >
          <div className="bg-[#f4f4f2] border border-[#dcdcd8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#e11d2e]" />
                <h3 className="font-extrabold text-[#1a1a1a] text-base">
                  Impresión en Zebra ZC300 a Doble Cara
                </h3>
              </div>
              <button
                onClick={() => setShowZebraModal(false)}
                className="text-[#555552] hover:text-[#1a1a1a] font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#1a1a1a] space-y-3 leading-relaxed">
              <div className="bg-white p-3 rounded-lg border border-[#dcdcd8]">
                <span className="font-bold text-[#e11d2e] block mb-1">
                  1. Medidas exactas CR-80
                </span>
                El tamaño de la tarjeta está calibrado a <strong>55 × 86.5 mm</strong>.
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#dcdcd8] space-y-1">
                <span className="font-bold text-[#1a1a1a] block mb-1">
                  2. Configuración en el diálogo del navegador:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[#555552]">
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
                className="bg-[#e11d2e] hover:bg-[#c81926] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONTENEDOR EXCLUSIVO PARA IMPRESIÓN (SOLO VISIBLE EN @media print) */}
      <PrintContainer card={modalCard} cards={batchPrintCards} />
    </div>
  );
}
