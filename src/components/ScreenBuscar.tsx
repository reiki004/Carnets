import React, { useState } from 'react';
import {
  sb,
  Club,
  Jugador,
  Administrativo,
  jugadorRowToJs,
  adminRowToJs,
  normalizarEstado,
} from '../services/supabaseService';
import { DEFAULTS } from '../assets/cardAssets';
import { CardPreview, CardState } from './CardPreview';
import { Search, Loader2, UserCheck, Eye, Printer, Download } from 'lucide-react';

interface ScreenBuscarProps {
  clubes: Club[];
  cargosCache: any[];
  estadosCache: any[];
  onOpenCardModal: (card: CardState) => void;
}

export const ScreenBuscar: React.FC<ScreenBuscarProps> = ({
  clubes,
  cargosCache,
  estadosCache,
  onOpenCardModal,
}) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });
  const [results, setResults] = useState<(Jugador | Administrativo)[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Jugador | Administrativo | null>(null);

  // Carnet visual en la misma pantalla Buscar
  const [previewCard, setPreviewCard] = useState<CardState>({
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
    footerHeight: 21,
    fnac: 'dd/mm/aaaa',
    dni: '00000000',
    backTopUrl: DEFAULTS.backtop,
    backBottomUrl: DEFAULTS.backbottom,
  });

  function normalizarTexto(s: string): string {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  function isoADmy(iso: string | null): string {
    if (!iso) return '';
    const s = String(iso).slice(0, 10);
    const parts = s.split('-');
    if (parts.length !== 3) return '';
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  const handleBuscar = async () => {
    const qRaw = query.trim();
    setResults([]);
    if (!qRaw) {
      setStatus({ msg: 'Escribe un documento (DNI), apellido o nombre.', kind: 'err' });
      return;
    }
    const qNorm = normalizarTexto(qRaw);
    setStatus({ msg: 'Buscando en jugadores y administrativos…', kind: 'loading' });

    try {
      const [jugRes, admRes] = await Promise.all([
        sb.from('jugadores').select('*'),
        sb.from('administrativos').select('*'),
      ]);

      if (jugRes.error) throw jugRes.error;
      if (admRes.error) throw admRes.error;

      const jugadores: Jugador[] = (jugRes.data || []).map(jugadorRowToJs).map((r) => ({
        ...r,
        __tipo: 'jugador',
      }));

      const administradores: Administrativo[] = (admRes.data || []).map(adminRowToJs).map((r) => ({
        ...r,
        __tipo: 'admin',
      }));

      const coincide = (r: Jugador | Administrativo) => {
        const texto = normalizarTexto(`${r.Apellidos || ''} ${r.Nombres || ''} ${r.NumeroDocumento || ''}`);
        return texto.includes(qNorm);
      };

      const todos = [...jugadores, ...administradores].filter(coincide).slice(0, 40);

      if (!todos.length) {
        setStatus({ msg: 'Sin resultados encontrados.', kind: 'err' });
        return;
      }

      setStatus({ msg: `${todos.length} resultado(s) encontrado(s). Haz clic en uno para ver su carnet.`, kind: 'ok' });
      setResults(todos);

      // Cargar el primer resultado en la vista previa in situ sin navegar
      if (todos.length > 0) {
        handleCargarEnPreview(todos[0]);
      }
    } catch (err: any) {
      setStatus({ msg: 'Error al buscar: ' + (err.message || String(err)), kind: 'err' });
    }
  };

  const handleCargarEnPreview = (item: Jugador | Administrativo) => {
    setSelectedRecord(item);

    if (item.__tipo === 'jugador') {
      const j = item as Jugador;
      const club = clubes.find((c) => c.ClubID === j.ClubID);
      const estNombre = normalizarEstado(j.Estado);
      const estObj = estadosCache.find(
        (e) => String(e.estado).toUpperCase() === estNombre.toUpperCase()
      );

      setPreviewCard({
        tipo: 'socio',
        apellidos: j.Apellidos || 'APELLIDO',
        nombres: j.Nombres || 'NOMBRE',
        clubname: club ? club.NombreClub : 'NOMBRE DEL CLUB',
        photoUrl: j.FotoArchivo || DEFAULTS.photo,
        photoScale: 100,
        photoOffsetX: 0,
        photoOffsetY: 0,
        logoUrl: club && club.LogoArchivo ? club.LogoArchivo : DEFAULTS.logo,
        logoScale: 100,
        headerUrl: DEFAULTS.header,
        footerUrl: estObj && estObj.pie_url ? estObj.pie_url : DEFAULTS.footer,
        footerHeight: 21,
        fnac: isoADmy(j.FechaNacimiento) || 'dd/mm/aaaa',
        dni: j.NumeroDocumento || '00000000',
        backTopUrl: DEFAULTS.backtop,
        backBottomUrl: DEFAULTS.backbottom,
      });
    } else {
      const a = item as Administrativo;
      const cargoObj = cargosCache.find((c) => c.cargo === a.ClubCargo);

      setPreviewCard({
        tipo: 'admin',
        apellidos: a.Apellidos || 'APELLIDO',
        nombres: a.Nombres || 'NOMBRE',
        clubname: a.ClubCargo || 'DIRECTIVO',
        photoUrl: a.FotoArchivo || DEFAULTS.photo,
        photoScale: 100,
        photoOffsetX: 0,
        photoOffsetY: 0,
        logoUrl: '',
        logoScale: 100,
        headerUrl: DEFAULTS.header,
        footerUrl: cargoObj && cargoObj.pie_url ? cargoObj.pie_url : DEFAULTS.footer,
        footerHeight: 21,
        fnac: isoADmy(a.FechaNacimiento) || 'dd/mm/aaaa',
        dni: a.NumeroDocumento || '00000000',
        backTopUrl: DEFAULTS.backtop,
        backBottomUrl: DEFAULTS.backbottom,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Buscador superior */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
          Documento (DNI/CE), Apellidos o Nombres
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="Ej. 07557840 o Flores..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
            />
          </div>
          <button
            onClick={handleBuscar}
            className="file-btn text-xs font-bold px-4 py-2"
          >
            Buscar
          </button>
        </div>

        {status.msg && (
          <div className={`db-status ${status.kind} mt-2 text-xs`}>
            {status.kind === 'loading' && (
              <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-1" />
            )}
            {status.msg}
          </div>
        )}
      </div>

      {/* Área dividida: Resultados a la izquierda y Vista Previa en vivo a la derecha (SIN cambiar de pantalla) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Resultados encontrados */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Resultados de la Búsqueda ({results.length})
            </h3>
            {results.length > 0 && (
              <span className="text-[11px] text-slate-400">
                Selecciona uno para ver su carnet
              </span>
            )}
          </div>

          {!results.length ? (
            <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
              Ingresa un DNI o apellido en el buscador para ver las coincidencias y su carnet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {results.map((r, i) => {
                const foto = r.FotoArchivo || DEFAULTS.photo;
                let clubOCargo = '';
                let categoria = '';
                let estadoStr = '';
                const isJugador = r.__tipo === 'jugador';

                if (isJugador) {
                  const j = r as Jugador;
                  const club = clubes.find((c) => c.ClubID === j.ClubID);
                  clubOCargo = club ? club.NombreClub : '(sin club)';
                  categoria = [j.Categoria, j.Categoria2].filter(Boolean).join(' / ');
                  estadoStr = normalizarEstado(j.Estado);
                } else {
                  const a = r as Administrativo;
                  clubOCargo = a.ClubCargo || '';
                }

                const isSelected =
                  selectedRecord?.NumeroDocumento === r.NumeroDocumento &&
                  selectedRecord?.__tipo === r.__tipo;

                return (
                  <div
                    key={`${r.NumeroDocumento}-${i}`}
                    onClick={() => handleCargarEnPreview(r)}
                    className={`search-result-card m-0 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <img src={foto} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="info">
                      <b className="text-black font-extrabold flex items-center gap-1.5 text-xs">
                        {isJugador ? (
                          <span className="tipo-badge jugador">Jugador</span>
                        ) : (
                          <span className="tipo-badge admin">Administrativo</span>
                        )}
                        {r.Apellidos || ''} {r.Nombres || ''}
                      </b>
                      <span className="text-[11.5px] text-black font-bold block mt-0.5">
                        DNI: {r.NumeroDocumento || ''} · {clubOCargo}
                        {categoria ? ' · ' + categoria : ''}
                        {estadoStr ? ' · ' + estadoStr : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Vista previa en vivo en la MISMA pantalla Buscar */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              Vista Previa en Vivo (Sin cambiar de pantalla)
            </h3>
            <button
              onClick={() => onOpenCardModal(previewCard)}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Abrir en Pantalla Emergente
            </button>
          </div>

          {/* Componente CardPreview con niveladores interactivos */}
          <CardPreview
            card={previewCard}
            onUpdateCard={setPreviewCard}
            showPrintButton={true}
            showControls={true}
          />
        </div>
      </div>
    </div>
  );
};
