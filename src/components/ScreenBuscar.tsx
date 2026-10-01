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
import { isoADmy } from '../utils/dateHelpers';
import { Search, Loader2, UserCheck, Eye, Printer, Download } from 'lucide-react';

interface ScreenBuscarProps {
  clubes: Club[];
  cargosCache: any[];
  estadosCache: any[];
  onOpenCardModal: (card: CardState) => void;
  onSelectCard?: (card: CardState) => void;
}

export const ScreenBuscar: React.FC<ScreenBuscarProps> = ({
  clubes,
  cargosCache,
  estadosCache,
  onOpenCardModal,
  onSelectCard,
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
    footerHeight: 20,
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

      const newCard: CardState = {
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
        footerHeight: 20,
        fnac: isoADmy(j.FechaNacimiento) || 'dd/mm/aaaa',
        dni: j.NumeroDocumento || '00000000',
        backTopUrl: DEFAULTS.backtop,
        backBottomUrl: DEFAULTS.backbottom,
      };
      setPreviewCard(newCard);
      onSelectCard?.(newCard);
    } else {
      const a = item as Administrativo;
      const cargoObj = cargosCache.find((c) => c.cargo === a.ClubCargo);

      const newCard: CardState = {
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
        footerHeight: 20,
        fnac: isoADmy(a.FechaNacimiento) || 'dd/mm/aaaa',
        dni: a.NumeroDocumento || '00000000',
        backTopUrl: DEFAULTS.backtop,
        backBottomUrl: DEFAULTS.backbottom,
      };
      setPreviewCard(newCard);
      onSelectCard?.(newCard);
    }
  };

  return (
    <div className="space-y-6">
      {/* Buscador superior (Div principal #f4f4f2) */}
      <div className="bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs">
        <label className="text-xs font-bold text-[#1a1a1a] mb-1.5 block">
          Documento (DNI/CE), Apellidos o Nombres
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#555552] absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="Ej. 07557840 o Flores..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#dcdcd8] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#e11d2e]"
            />
          </div>
          <button
            onClick={handleBuscar}
            className="file-btn text-xs font-bold px-4 py-2 bg-[#e11d2e] hover:bg-[#c81926] text-white border-none"
          >
            Buscar
          </button>
        </div>

        {status.msg && (
          <div className={`db-status ${status.kind} mt-2 text-xs font-semibold`}>
            {status.kind === 'loading' && (
              <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-1" />
            )}
            {status.msg}
          </div>
        )}
      </div>

      {/* Área dividida: Resultados a la izquierda y Vista Previa en vivo a la derecha (SIN cambiar de pantalla) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Resultados encontrados (Div principal #f4f4f2) */}
        <div className="lg:col-span-5 bg-[#f4f4f2] border border-[#dcdcd8] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
              Resultados de la Búsqueda ({results.length})
            </h3>
            {results.length > 0 && (
              <span className="text-[11px] text-[#555552]">
                Selecciona uno para ver su carnet
              </span>
            )}
          </div>

          {!results.length ? (
            <div className="text-center py-10 text-xs text-[#555552]">
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
                    className={`search-result-card m-0 p-3 rounded-xl transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-2 border-[#e11d2e] shadow-xs'
                        : 'border border-[#dcdcd8] hover:border-[#e11d2e]'
                    }`}
                  >
                    <img src={foto} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="info">
                      <b className="text-[#1a1a1a] font-extrabold flex items-center gap-1.5 text-xs">
                        {isJugador ? (
                          <span className="tipo-badge jugador">Jugador</span>
                        ) : (
                          <span className="tipo-badge admin">Administrativo</span>
                        )}
                        {r.Apellidos || ''} {r.Nombres || ''}
                      </b>
                      <span className="text-[11.5px] text-[#555552] font-semibold block mt-0.5">
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

        {/* Columna Derecha: Vista previa en vivo en la MISMA pantalla Buscar (Div principal #f4f4f2) */}
        <div className="lg:col-span-7 bg-[#f4f4f2] border border-[#dcdcd8] rounded-xl p-5 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-[#dcdcd8] pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#e11d2e]" />
              Vista Previa en Vivo (Sin cambiar de pantalla)
            </h3>
            <button
              onClick={() => onOpenCardModal(previewCard)}
              className="text-xs text-[#e11d2e] font-bold hover:underline"
            >
              Abrir en Pantalla Emergente
            </button>
          </div>

          {/* Componente CardPreview con niveladores interactivos */}
          <CardPreview
            card={previewCard}
            onUpdateCard={(val: React.SetStateAction<CardState>) => {
              setPreviewCard((prev) => {
                const next = typeof val === 'function' ? val(prev) : val;
                onSelectCard?.(next);
                return next;
              });
            }}
            showPrintButton={true}
            showControls={true}
          />
        </div>
      </div>
    </div>
  );
};
