import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  sb,
  Club,
  Jugador,
  jugadorRowToJs,
  jugadorJsToRow,
  subirImagenSupabase,
  ESTADOS_FIJOS,
  normalizarEstado,
} from '../services/supabaseService';
import { DEFAULTS } from '../assets/cardAssets';
import { CardState } from './CardPreview';
import { DateInput } from './DateInput';
import {
  Printer,
  Upload,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  FileSpreadsheet,
  Download,
  Check,
  Eye,
  CheckSquare,
} from 'lucide-react';

interface ScreenClubProps {
  clubes: Club[];
  categorias: string[];
  estadosCache: any[];
  refreshClubes: () => Promise<void>;
  selectedClubId: string;
  setSelectedClubId: (id: string) => void;
  onOpenCardModal: (card: CardState) => void;
}

export const ScreenClub: React.FC<ScreenClubProps> = ({
  clubes,
  categorias,
  estadosCache,
  refreshClubes,
  selectedClubId,
  setSelectedClubId,
  onOpenCardModal,
}) => {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [textoFiltro, setTextoFiltro] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  // Pestaña derecha activa: 'form' | 'excel' | 'fotos'
  const [activeTabRight, setActiveTabRight] = useState<'form' | 'excel' | 'fotos'>('form');

  // Formulario de jugador
  const [editingJugador, setEditingJugador] = useState<Jugador | null>(null);
  const [tipoDoc, setTipoDoc] = useState('DNI');
  const [numeroDoc, setNumeroDoc] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombres, setNombres] = useState('');
  const [cat1, setCat1] = useState('');
  const [cat2, setCat2] = useState('');
  const [estado, setEstado] = useState('SOCIO');
  const [fnac, setFnac] = useState('');
  const [fotoName, setFotoName] = useState('ninguna');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');
  const [formStatus, setFormStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  // Importar Excel
  const [excelName, setExcelName] = useState('ningún archivo elegido');
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  // Fotos masivas
  const [fotosMasivasTipo, setFotosMasivasTipo] = useState<'jugadores' | 'administrativos'>('jugadores');
  const [fotosName, setFotosName] = useState('ninguna');
  const [fotosParsed, setFotosParsed] = useState<any[]>([]);
  const [fotosStatus, setFotosStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  const fotoInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const carpetaFotosInputRef = useRef<HTMLInputElement>(null);

  function esNombreValido(str: string): boolean {
    return /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/.test(str.trim()) && str.trim().length > 0;
  }

  function dmyAIso(str: string): string | null {
    const s = str.trim();
    if (!s) return '';
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = parseInt(m[1], 10),
      mo = parseInt(m[2], 10),
      y = parseInt(m[3], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function isoADmy(iso: string | null): string {
    if (!iso) return '';
    const s = String(iso).slice(0, 10);
    const parts = s.split('-');
    if (parts.length !== 3) return '';
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Cargar jugadores del club seleccionado
  const loadJugadores = async () => {
    if (!selectedClubId) {
      setJugadores([]);
      return;
    }
    setLoadingList(true);
    try {
      let query = sb.from('jugadores').select('*').eq('club_id', selectedClubId);
      if (categoriaFiltro) {
        query = query.eq('categoria', categoriaFiltro);
      }
      const { data, error } = await query;
      if (error) throw error;
      setJugadores((data || []).map(jugadorRowToJs));
    } catch (err: any) {
      console.error('Error cargando jugadores:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadJugadores();
  }, [selectedClubId, categoriaFiltro]);

  // Construir estado del carnet para modal
  const generarCardState = (j: Jugador): CardState => {
    const club = clubes.find((c) => c.ClubID === j.ClubID);
    const estNombre = normalizarEstado(j.Estado);
    const estObj = estadosCache.find(
      (e) => String(e.estado).toUpperCase() === estNombre.toUpperCase()
    );

    return {
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
    };
  };

  const handleEditJugador = (j: Jugador) => {
    setEditingJugador(j);
    setTipoDoc(j.TipoDocumento || 'DNI');
    setNumeroDoc(j.NumeroDocumento || '');
    setApellidos(j.Apellidos || '');
    setNombres(j.Nombres || '');
    setCat1(j.Categoria || '');
    setCat2(j.Categoria2 || '');
    setEstado(normalizarEstado(j.Estado));
    setFnac(isoADmy(j.FechaNacimiento));
    setFotoName(j.FotoArchivo ? 'foto actual (sin cambios)' : 'ninguna');
    setFotoBase64(null);
    setFormStatus({ msg: '', kind: '' });
    setActiveTabRight('form');
  };

  const handleNuevoForm = () => {
    setEditingJugador(null);
    setTipoDoc('DNI');
    setNumeroDoc('');
    setApellidos('');
    setNombres('');
    setCat1(categorias[0] || '');
    setCat2('');
    setEstado('SOCIO');
    setFnac('');
    setFotoName('ninguna');
    setFotoBase64(null);
    setFormStatus({ msg: '', kind: '' });
    setActiveTabRight('form');
  };

  const handleFotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const [meta, b64] = result.split(',');
      setFotoBase64(b64);
      setFotoMime(meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg');
      setFotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveJugador = async () => {
    if (!selectedClubId) {
      setFormStatus({ msg: 'Selecciona un club primero.', kind: 'err' });
      return;
    }
    const num = numeroDoc.trim();
    if (!num) {
      setFormStatus({ msg: 'Ingresa el número de documento.', kind: 'err' });
      return;
    }
    if (!/^\d{8}$/.test(num)) {
      alert('El número de documento (DNI, CE o Pasaporte) debe tener exactamente 8 dígitos numéricos.');
      setFormStatus({ msg: 'El documento debe tener exactamente 8 dígitos numéricos.', kind: 'err' });
      return;
    }
    if (!esNombreValido(apellidos)) {
      alert('Apellidos solo debe contener letras (se acepta Ñ y tildes).');
      setFormStatus({ msg: 'Apellidos solo debe contener letras (se acepta Ñ y tildes).', kind: 'err' });
      return;
    }
    if (!esNombreValido(nombres)) {
      alert('Nombres solo debe contener letras (se acepta Ñ y tildes).');
      setFormStatus({ msg: 'Nombres solo debe contener letras (se acepta Ñ y tildes).', kind: 'err' });
      return;
    }
    const fechaIso = dmyAIso(fnac);
    if (fechaIso === null) {
      setFormStatus({ msg: 'La fecha de nacimiento debe tener el formato dd/mm/aaaa.', kind: 'err' });
      return;
    }
    if (cat2 && cat2 === cat1) {
      setFormStatus({ msg: 'Las dos categorías no pueden ser iguales.', kind: 'err' });
      return;
    }

    setFormStatus({ msg: 'Guardando jugador…', kind: 'loading' });
    try {
      let fotoUrl = editingJugador ? editingJugador.FotoArchivo : null;
      if (fotoBase64) {
        fotoUrl = await subirImagenSupabase('fotos', `${num}.jpg`, fotoBase64, fotoMime);
      }

      const data: Jugador = {
        TipoDocumento: tipoDoc,
        NumeroDocumento: num,
        Apellidos: apellidos.trim().toUpperCase(),
        Nombres: nombres.trim().toUpperCase(),
        FechaNacimiento: fechaIso,
        ClubID: selectedClubId,
        Categoria: cat1 || null,
        Categoria2: cat2 || null,
        Estado: normalizarEstado(estado),
        FotoArchivo: fotoUrl,
      };

      const { error } = await sb.from('jugadores').upsert(jugadorJsToRow(data));
      if (error) throw error;

      setFormStatus({ msg: '¡Jugador guardado exitosamente!', kind: 'ok' });
      handleNuevoForm();
      loadJugadores();
    } catch (err: any) {
      setFormStatus({ msg: 'Error al guardar: ' + (err.message || String(err)), kind: 'err' });
    }
  };

  const handleDeleteJugador = async (numDoc: string) => {
    if (!confirm('¿Eliminar a este jugador de la base de datos?')) return;
    try {
      const { error } = await sb.from('jugadores').delete().eq('numero_documento', numDoc);
      if (error) throw error;
      loadJugadores();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleVerCarnetSingle = (j: Jugador) => {
    const card = generarCardState(j);
    onOpenCardModal(card);
  };

  const handlePrintSelected = async () => {
    const checks = Array.from(document.querySelectorAll<HTMLInputElement>('.jugChk:checked'));
    if (!checks.length) {
      alert('Marca al menos un jugador de la lista con su casilla.');
      return;
    }
    // Abre modal o imprime lote
    window.print();
  };

  // Plantilla Excel
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['TipoDocumento', 'NumeroDocumento', 'Apellidos', 'Nombres', 'FechaNacimiento', 'Club', 'Categoria', 'Estado'],
      ['DNI', '00000000', 'APELLIDO', 'NOMBRE', '16/09/1964', 'NOMBRE DEL CLUB', 'LIBRE', 'SOCIO'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jugadores');
    XLSX.writeFile(wb, 'plantilla_jugadores_interclubes.xlsx');
  };

  // Carga de Excel
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelName(file.name);
    setImportStatus({ msg: 'Leyendo archivo Excel…', kind: 'loading' });

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const parsed = rows
        .map((row) => ({
          TipoDocumento: String(row.TipoDocumento || 'DNI').trim() || 'DNI',
          NumeroDocumento: String(row.NumeroDocumento || '').trim(),
          Apellidos: String(row.Apellidos || '').trim(),
          Nombres: String(row.Nombres || '').trim(),
          FechaNacimiento: String(row.FechaNacimiento || '').trim(),
          Club: String(row.Club || '').trim(),
          Categoria: String(row.Categoria || '').trim(),
          Estado: normalizarEstado(row.Estado),
        }))
        .filter((r) => r.NumeroDocumento);

      if (!parsed.length) {
        setImportStatus({ msg: 'No se encontraron filas con NumeroDocumento válido.', kind: 'err' });
        return;
      }

      const { data: existingRows } = await sb.from('jugadores').select('numero_documento');
      const existingDocs = (existingRows || []).map((r: any) => String(r.numero_documento));

      const validated = parsed.map((r) => {
        const motivos: string[] = [];
        if (!/^\d{8}$/.test(r.NumeroDocumento)) motivos.push('documento debe ser 8 dígitos numéricos');
        if (!esNombreValido(r.Apellidos) || !esNombreValido(r.Nombres)) motivos.push('apellidos/nombres con caracteres inválidos');

        const clubEncontrado = clubes.find(
          (c) => c.NombreClub.toUpperCase() === r.Club.toUpperCase()
        );
        if (!clubEncontrado) motivos.push(`el club "${r.Club}" no existe en el sistema`);

        const catEncontrada = categorias.find(
          (c) => c.toUpperCase() === r.Categoria.toUpperCase()
        );
        if (!catEncontrada) motivos.push(`la categoría "${r.Categoria}" no existe`);

        const estNormal = normalizarEstado(r.Estado);
        const estEncontrado = ESTADOS_FIJOS.find((s) => s === estNormal);
        if (!estEncontrado) motivos.push(`el estado "${r.Estado}" no existe`);

        return {
          ...r,
          __clubId: clubEncontrado ? clubEncontrado.ClubID : null,
          __categoriaResuelta: catEncontrada || null,
          __estadoResuelto: estNormal || 'SOCIO',
          __isDup: existingDocs.includes(r.NumeroDocumento),
          __motivos: motivos,
          __valid: motivos.length === 0,
        };
      });

      setImportRows(validated);
      const invalidos = validated.filter((r) => !r.__valid).length;
      setImportStatus({
        msg: `${validated.length} fila(s) leída(s)${invalidos ? `, ${invalidos} con errores` : ''}.`,
        kind: invalidos ? 'err' : 'ok',
      });
    } catch (err: any) {
      setImportStatus({ msg: 'Error leyendo archivo: ' + err.message, kind: 'err' });
    }
  };

  const handleConfirmImport = async () => {
    const checks = Array.from(document.querySelectorAll<HTMLInputElement>('.importChk:checked'));
    if (!checks.length) {
      setImportStatus({ msg: 'No hay filas marcadas para importar.', kind: 'err' });
      return;
    }
    const indices = checks.map((c) => parseInt(c.dataset.idx || '0', 10));
    const seleccionados = importRows.filter((_, idx) => indices.includes(idx));

    setImportStatus({ msg: 'Importando jugadores…', kind: 'loading' });
    try {
      const payload = seleccionados.map((r) =>
        jugadorJsToRow({
          TipoDocumento: r.TipoDocumento,
          NumeroDocumento: r.NumeroDocumento,
          Apellidos: r.Apellidos.toUpperCase(),
          Nombres: r.Nombres.toUpperCase(),
          FechaNacimiento: dmyAIso(r.FechaNacimiento) || r.FechaNacimiento,
          ClubID: r.__clubId,
          Categoria: r.__categoriaResuelta,
          Categoria2: null,
          Estado: r.__estadoResuelto,
          FotoArchivo: null,
        })
      );

      const { error } = await sb.from('jugadores').upsert(payload, {
        onConflict: 'numero_documento',
        ignoreDuplicates: true,
      });
      if (error) throw error;

      setImportRows([]);
      setExcelName('ningún archivo elegido');
      setImportStatus({ msg: `¡${seleccionados.length} jugadores importados exitosamente!`, kind: 'ok' });
      loadJugadores();
    } catch (err: any) {
      setImportStatus({ msg: 'Error al importar: ' + err.message, kind: 'err' });
    }
  };

  // Fotos masivas
  const handleCarpetaFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      /\.(jpe?g|png|webp)$/i.test(f.name)
    );
    setFotosName(files.length ? `${files.length} archivo(s)` : 'ninguna');
    if (!files.length) return;

    setFotosStatus({ msg: 'Verificando con la base de datos…', kind: 'loading' });
    const docs = files.map((f) => f.name.replace(/\.[^.]+$/, '').trim());

    try {
      const { data: rows } = await sb.from(fotosMasivasTipo).select('numero_documento').in('numero_documento', docs);
      const existing = (rows || []).map((r: any) => String(r.numero_documento));

      const parsed = files.map((f) => {
        const doc = f.name.replace(/\.[^.]+$/, '').trim();
        return {
          file: f,
          doc,
          matched: existing.includes(doc),
        };
      });

      setFotosParsed(parsed);
      const coincidentes = parsed.filter((p) => p.matched).length;
      setFotosStatus({
        msg: `${coincidentes} de ${files.length} fotos coinciden con documentos en la base.`,
        kind: coincidentes ? 'ok' : 'err',
      });
    } catch (err: any) {
      setFotosStatus({ msg: 'Error al verificar fotos: ' + err.message, kind: 'err' });
    }
  };

  const handleConfirmFotos = async () => {
    const checks = Array.from(document.querySelectorAll<HTMLInputElement>('.fotoChk:checked'));
    if (!checks.length) {
      setFotosStatus({ msg: 'No hay fotos seleccionadas para subir.', kind: 'err' });
      return;
    }

    let ok = 0,
      fail = 0;
    for (let i = 0; i < checks.length; i++) {
      const idx = parseInt(checks[i].dataset.idx || '0', 10);
      const { file, doc } = fotosParsed[idx];
      setFotosStatus({
        msg: `Subiendo ${i + 1}/${checks.length}…`,
        kind: 'loading',
      });

      try {
        const reader = new FileReader();
        const b64Promise = new Promise<{ b64: string; mime: string }>((resolve) => {
          reader.onload = (ev) => {
            const res = ev.target?.result as string;
            const [meta, b64] = res.split(',');
            resolve({ b64, mime: meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg' });
          };
          reader.readAsDataURL(file);
        });

        const { b64, mime } = await b64Promise;
        const path = fotosMasivasTipo === 'administrativos' ? `${doc}_admin.jpg` : `${doc}.jpg`;
        const pubUrl = await subirImagenSupabase('fotos', path, b64, mime);

        await sb.from(fotosMasivasTipo).update({ foto_url: pubUrl }).eq('numero_documento', doc);
        ok++;
      } catch (err) {
        fail++;
      }
    }

    setFotosStatus({
      msg: `Listo: ${ok} foto(s) subida(s), ${fail} con error.`,
      kind: fail ? 'err' : 'ok',
    });
    setFotosParsed([]);
    setFotosName('ninguna');
    if (selectedClubId) loadJugadores();
  };

  const filteredJugadores = jugadores.filter((j) => {
    if (!textoFiltro) return true;
    const q = textoFiltro.toLowerCase();
    return (
      j.Apellidos.toLowerCase().includes(q) ||
      j.Nombres.toLowerCase().includes(q) ||
      j.NumeroDocumento.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Barra superior: Selector de Club & Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            Club:
          </span>
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="flex-1 text-xs"
          >
            <option value="">— Selecciona un club —</option>
            {clubes.map((c) => (
              <option key={c.ClubID} value={c.ClubID}>
                {c.NombreClub}
              </option>
            ))}
          </select>
          <button
            onClick={() => refreshClubes()}
            className="file-btn alt text-xs p-2"
            title="Refrescar clubes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Categoría:
            </span>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="text-xs py-1.5 px-2"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={textoFiltro}
            onChange={(e) => setTextoFiltro(e.target.value)}
            placeholder="Filtrar por DNI o Apellidos..."
            className="text-xs py-1.5 px-3 w-48"
          />
        </div>
      </div>

      {/* Distribución equilibrada en 2 Columnas (evita ventanas largas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA 1 (IZQUIERDA - 7 COLS): TABLA DE JUGADORES */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>Jugadores del Club ({filteredJugadores.length})</span>
            </h2>

            {filteredJugadores.length > 0 && (
              <button
                onClick={handlePrintSelected}
                className="file-btn text-xs font-semibold py-1 px-2.5"
              >
                <Printer className="w-3 h-3" /> Imprimir seleccionados
              </button>
            )}
          </div>

          {!selectedClubId ? (
            <div className="jug-empty text-center py-12 text-slate-400">
              Selecciona un club arriba para ver y gestionar su nómina de jugadores.
            </div>
          ) : loadingList ? (
            <div className="jug-empty text-center py-12 text-slate-400">
              Cargando jugadores…
            </div>
          ) : !filteredJugadores.length ? (
            <div className="jug-empty text-center py-12 text-slate-400">
              {jugadores.length
                ? 'Sin coincidencias con el filtro aplicado.'
                : 'Este club aún no tiene jugadores registrados. Agrégalos en el panel derecho.'}
            </div>
          ) : (
            <div className="max-h-[540px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="jug-table m-0">
                <thead>
                  <tr>
                    <th style={{ width: '28px' }}></th>
                    <th style={{ width: '34px' }}></th>
                    <th>Jugador</th>
                    <th>Doc.</th>
                    <th>Cat.</th>
                    <th style={{ width: '85px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJugadores.map((j) => (
                    <tr key={j.NumeroDocumento}>
                      <td>
                        <input
                          type="checkbox"
                          className="jugChk cursor-pointer"
                          data-doc={j.NumeroDocumento}
                        />
                      </td>
                      <td>
                        <img
                          src={j.FotoArchivo || DEFAULTS.photo}
                          className="thumb w-6 h-6 rounded-md object-cover"
                          alt=""
                        />
                      </td>
                      <td>
                        <b className="text-black font-extrabold text-sm block">
                          {j.Apellidos} {j.Nombres}
                        </b>
                        <span className="block text-[11px] font-bold text-black">
                          {normalizarEstado(j.Estado)}
                        </span>
                      </td>
                      <td className="font-mono text-xs font-black text-black">{j.NumeroDocumento}</td>
                      <td className="text-xs font-black text-black">
                        {j.Categoria}
                        {j.Categoria2 ? (
                          <span className="block text-[10.5px] font-bold text-black">
                            {j.Categoria2}
                          </span>
                        ) : null}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        <button
                          className="mini-btn text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                          title="Ver carnet emergente / Imprimir"
                          onClick={() => handleVerCarnetSingle(j)}
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          className="mini-btn text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="Editar datos"
                          onClick={() => handleEditJugador(j)}
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          className="mini-btn text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Eliminar"
                          onClick={() => handleDeleteJugador(j.NumeroDocumento)}
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* COLUMNA 2 (DERECHA - 5 COLS): PANELES EN PESTAÑAS (NUEVO JUGADOR / EXCEL / FOTOS) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-4">
          {/* Navegación por pestañas para no hacer la ventana larga */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 pb-1 gap-1">
            <button
              onClick={() => setActiveTabRight('form')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'form'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {editingJugador ? '✎ Editar' : '＋ Nuevo'}
            </button>
            <button
              onClick={() => setActiveTabRight('excel')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'excel'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              📥 Importar Excel
            </button>
            <button
              onClick={() => setActiveTabRight('fotos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'fotos'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              📁 Fotos Carpeta
            </button>
          </div>

          {/* TAB 1: FORMULARIO NUEVO / EDITAR JUGADOR */}
          {activeTabRight === 'form' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipo documento
                  </label>
                  <select
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value)}
                  >
                    <option value="DNI">DNI</option>
                    <option value="Carné de extranjería">Carné de extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    N° Documento (8 dígitos)
                  </label>
                  <input
                    type="text"
                    value={numeroDoc}
                    onChange={(e) =>
                      setNumeroDoc(e.target.value.replace(/\D/g, '').slice(0, 8))
                    }
                    placeholder="00000000"
                    maxLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value.toUpperCase())}
                  placeholder="APELLIDO"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nombres
                </label>
                <input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value.toUpperCase())}
                  placeholder="NOMBRE"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Categoría 1
                  </label>
                  <select value={cat1} onChange={(e) => setCat1(e.target.value)}>
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Categoría 2 (opc.)
                  </label>
                  <select value={cat2} onChange={(e) => setCat2(e.target.value)}>
                    <option value="">— Ninguna —</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    {ESTADOS_FIJOS.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fecha nacimiento
                  </label>
                  {/* DateInput con autoformato de / */}
                  <DateInput
                    value={fnac}
                    onChange={setFnac}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fotografía
                </label>
                <div className="file-row">
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    className="file-btn alt text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" /> Subir foto
                  </button>
                  <span className="file-name">{fotoName}</span>
                </div>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoFile}
                  className="hidden"
                />
              </div>

              <div className="file-row pt-2">
                <button
                  onClick={handleSaveJugador}
                  className="file-btn text-xs font-bold"
                >
                  Guardar jugador
                </button>
                <button
                  onClick={handleNuevoForm}
                  className="file-btn alt text-xs"
                >
                  Cancelar / nuevo
                </button>
              </div>

              {formStatus.msg && (
                <div className={`db-status ${formStatus.kind}`}>
                  {formStatus.msg}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMPORTAR EXCEL */}
          {activeTabRight === 'excel' && (
            <div className="space-y-3">
              <div className="file-row">
                <button
                  onClick={handleDownloadTemplate}
                  className="file-btn alt text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar plantilla
                </button>
                <button
                  onClick={() => excelInputRef.current?.click()}
                  className="file-btn alt text-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Subir archivo .xlsx
                </button>
              </div>
              <span className="file-name block text-xs">{excelName}</span>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />

              <div className="hint text-xs">
                Columnas requeridas: <strong>TipoDocumento, NumeroDocumento, Apellidos, Nombres, FechaNacimiento, Club, Categoria, Estado</strong>.
              </div>

              {importRows.length > 0 && (
                <div className="import-preview max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded p-1 space-y-1">
                  {importRows.map((r, i) => (
                    <label
                      key={i}
                      className={`import-row ${!r.__valid ? 'err' : r.__isDup ? 'dup' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="importChk"
                        data-idx={i}
                        defaultChecked={r.__valid && !r.__isDup}
                        disabled={!r.__valid}
                      />
                      <span className="flex-1 text-xs">
                        <b>{r.Apellidos} {r.Nombres}</b> — {r.NumeroDocumento} ({r.Club})
                        {!r.__valid ? (
                          <small className="block text-red-600">
                            {r.__motivos.join('; ')}
                          </small>
                        ) : r.__isDup ? (
                          <small className="block text-amber-600">
                            Duplicado en la base
                          </small>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {importRows.length > 0 && (
                <button
                  onClick={handleConfirmImport}
                  className="file-btn text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5" /> Confirmar importación
                </button>
              )}

              {importStatus.msg && (
                <div className={`db-status ${importStatus.kind}`}>
                  {importStatus.msg}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CARGA MASIVA DE FOTOS */}
          {activeTabRight === 'fotos' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subir fotos de:
                </label>
                <select
                  value={fotosMasivasTipo}
                  onChange={(e) => setFotosMasivasTipo(e.target.value as any)}
                >
                  <option value="jugadores">Jugadores</option>
                  <option value="administrativos">Administrativos</option>
                </select>
              </div>

              <div className="file-row">
                <button
                  onClick={() => carpetaFotosInputRef.current?.click()}
                  className="file-btn alt text-xs"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Seleccionar carpeta de fotos
                </button>
                <span className="file-name text-xs">{fotosName}</span>
              </div>

              <input
                ref={carpetaFotosInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                multiple
                onChange={handleCarpetaFotos}
                className="hidden"
              />

              <div className="hint text-xs">
                El nombre de cada foto debe ser el número de documento (ej. <strong>07557840.jpg</strong>).
              </div>

              {fotosParsed.length > 0 && (
                <div className="import-preview max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded p-1 space-y-1">
                  {fotosParsed.map((p, i) => (
                    <label key={i} className={`import-row ${!p.matched ? 'err' : ''}`}>
                      <input
                        type="checkbox"
                        className="fotoChk"
                        data-idx={i}
                        defaultChecked={p.matched}
                        disabled={!p.matched}
                      />
                      <span className="flex-1 text-xs">{p.file.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {fotosParsed.length > 0 && (
                <button
                  onClick={handleConfirmFotos}
                  className="file-btn text-xs font-bold"
                >
                  <Upload className="w-3.5 h-3.5" /> Subir y emparejar fotos
                </button>
              )}

              {fotosStatus.msg && (
                <div className={`db-status ${fotosStatus.kind}`}>
                  {fotosStatus.msg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
