import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  sb,
  Club,
  Jugador,
  jugadorRowToJs,
  jugadorJsToRow,
  subirImagenSupabase,
  obtenerTodosParaFotos,
  subirYEnlazarFoto,
  ESTADOS_FIJOS,
  normalizarEstado,
  normalizarTipoDoc,
  encontrarCoincidenciaDoc,
} from '../services/supabaseService';
import { DEFAULTS } from '../assets/cardAssets';
import { CardState } from './CardPreview';
import { DateInput } from './DateInput';
import { printMultipleCardsDirectly } from '../utils/printHelpers';
import { normalizarFechaIso, isoADmy, dmyAIso } from '../utils/dateHelpers';
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
  Shield,
  Save,
  Search,
  Image as ImageIcon,
} from 'lucide-react';

interface ScreenClubProps {
  clubes: Club[];
  categorias: string[];
  estadosCache: any[];
  refreshClubes: () => Promise<void>;
  selectedClubId: string;
  setSelectedClubId: (id: string) => void;
  onOpenCardModal: (card: CardState) => void;
  onBatchPrint?: (cards: CardState[]) => Promise<void>;
}

export const ScreenClub: React.FC<ScreenClubProps> = ({
  clubes,
  categorias,
  estadosCache,
  refreshClubes,
  selectedClubId,
  setSelectedClubId,
  onOpenCardModal,
  onBatchPrint,
}) => {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [textoFiltro, setTextoFiltro] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  // Jugadores seleccionados con checkbox para impresión por lotes
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isPrintingSelected, setIsPrintingSelected] = useState(false);
  // Checkbox para incluir categoría en impresión (desactivado por defecto)
  const [imprimirCategoriaMasiva, setImprimirCategoriaMasiva] = useState(false);

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
  const [excelCheckedIndices, setExcelCheckedIndices] = useState<number[]>([]);
  const [importStatus, setImportStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  // Categorías asignadas al club seleccionado
  const [clubCategorias, setClubCategorias] = useState<string[]>([]);

  // Fotos masivas
  const [fotosMasivasTipo, setFotosMasivasTipo] = useState<'jugadores' | 'administrativos'>('jugadores');
  const [fotosName, setFotosName] = useState('ninguna');
  const [fotosParsed, setFotosParsed] = useState<any[]>([]);
  const [fotosStatus, setFotosStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  const [autoSubirFotos, setAutoSubirFotos] = useState(true);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const carpetaFotosInputRef = useRef<HTMLInputElement>(null);
  const archivosFotosInputRef = useRef<HTMLInputElement>(null);

  function esNombreValido(str: string): boolean {
    return /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/.test(str.trim()) && str.trim().length > 0;
  }

  // Ordenar siempre la lista en orden alfabético de Apellidos y Nombres
  const ordenarJugadores = (list: Jugador[]): Jugador[] => {
    return [...list].sort((a, b) => {
      const apA = (a.Apellidos || '').trim().localeCompare((b.Apellidos || '').trim(), 'es', { sensitivity: 'base' });
      if (apA !== 0) return apA;
      return (a.Nombres || '').trim().localeCompare((b.Nombres || '').trim(), 'es', { sensitivity: 'base' });
    });
  };

  // Cargar jugadores del club seleccionado
  const loadJugadores = async () => {
    if (!selectedClubId) {
      setJugadores([]);
      return;
    }
    setLoadingList(true);
    try {
      let query = sb.from('jugadores').select('*').eq('club_id', selectedClubId).order('apellidos').order('nombres');
      if (categoriaFiltro) {
        query = query.eq('categoria', categoriaFiltro);
      }
      const { data, error } = await query;
      if (error) throw error;
      const list = (data || []).map(jugadorRowToJs);
      setJugadores(ordenarJugadores(list));
    } catch (err: any) {
      console.error('Error cargando jugadores:', err);
    } finally {
      setLoadingList(false);
    }
  };

  // Cargar categorías asignadas al club seleccionado desde la base de datos
  useEffect(() => {
    const fetchClubCategorias = async () => {
      if (!selectedClubId) {
        setClubCategorias([]);
        setCategoriaFiltro('');
        return;
      }
      try {
        const { data, error } = await sb
          .from('club_categorias')
          .select('categoria')
          .eq('club_id', selectedClubId);
        if (!error && data && data.length > 0) {
          const list = data.map((r: any) => r.categoria);
          setClubCategorias(list);
        } else {
          setClubCategorias([]);
        }
      } catch (err) {
        console.error('Error cargando club_categorias:', err);
        setClubCategorias([]);
      }
    };
    fetchClubCategorias();
  }, [selectedClubId]);

  // Lista de categorías que aplican para el club seleccionado
  const categoriasClub = useMemo(() => {
    if (!selectedClubId) return [];
    if (clubCategorias.length > 0) return clubCategorias;
    return categorias;
  }, [selectedClubId, clubCategorias, categorias]);

  // Sincronizar por defecto Categoria 1 con el filtro de categoría activo
  useEffect(() => {
    if (!editingJugador) {
      if (categoriaFiltro) {
        setCat1(categoriaFiltro);
      } else if (categoriasClub.length > 0 && !cat1) {
        setCat1(categoriasClub[0]);
      }
    }
  }, [categoriaFiltro, editingJugador, categoriasClub]);

  // Pequeños círculos de colores según tipo de estado del jugador
  const renderEstadoCircles = (estadoStr: string | null | undefined) => {
    const norm = normalizarEstado(estadoStr);
    const circles: string[] = [];
    if (norm === 'SOCIO') {
      circles.push('#FFF000');
    } else if (norm === 'INVITADO') {
      circles.push('#0A5CFF');
    } else if (norm === 'SOCIO EXPROFESIONAL') {
      circles.push('#FFF000', '#FF900A');
    } else if (norm === 'INVITADO EXPROFESIONAL') {
      circles.push('#0A5CFF', '#FF900A');
    } else if (norm === 'FEDERADA') {
      circles.push('#0A5CFF');
    }
    if (!circles.length) return null;
    return (
      <span className="inline-flex items-center gap-1 ml-1.5 align-middle">
        {circles.map((col, idx) => (
          <span
            key={idx}
            className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 shadow-xs shrink-0"
            style={{ backgroundColor: col }}
            title={norm}
          />
        ))}
      </span>
    );
  };

  useEffect(() => {
    loadJugadores();
  }, [selectedClubId, categoriaFiltro]);

  // Construir estado del carnet para modal e impresión
  const generarCardState = (j: Jugador): CardState => {
    const club = clubes.find((c) => c.ClubID === j.ClubID);
    const estNombre = normalizarEstado(j.Estado);
    const estObj = estadosCache.find(
      (e) => String(e.estado).toUpperCase() === estNombre.toUpperCase()
    );
    const catStr = [j.Categoria, j.Categoria2].filter(Boolean).join(' / ') || j.Categoria || '';

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
      footerHeight: 20,
      fnac: isoADmy(j.FechaNacimiento) || 'dd/mm/aaaa',
      dni: j.NumeroDocumento || '00000000',
      categoria: catStr,
      showCategoria: imprimirCategoriaMasiva,
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
    setCat1(categoriaFiltro || categoriasClub[0] || '');
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

  const handleToggleSelect = (docNum: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docNum) ? prev.filter((d) => d !== docNum) : [...prev, docNum]
    );
  };

  const handleToggleSelectAll = () => {
    const allFilteredDocs = filteredJugadores.map((j) => j.NumeroDocumento);
    const allSelected = allFilteredDocs.length > 0 && allFilteredDocs.every((d) => selectedDocs.includes(d));
    if (allSelected) {
      setSelectedDocs((prev) => prev.filter((d) => !allFilteredDocs.includes(d)));
    } else {
      setSelectedDocs((prev) => Array.from(new Set([...prev, ...allFilteredDocs])));
    }
  };

  const handlePrintSelected = async () => {
    if (isPrintingSelected) return;

    // Obtener documentos seleccionados: desde el estado de React o desde los checkboxes marcados en el DOM
    const domChecked = Array.from(document.querySelectorAll<HTMLInputElement>('.jugChk:checked'))
      .map((chk) => (chk.value && chk.value !== 'on' ? chk.value : chk.getAttribute('data-doc') || chk.dataset.doc || ''))
      .filter(Boolean);

    const docs = Array.from(new Set([...selectedDocs, ...domChecked]));

    if (!docs.length) {
      alert('Marca al menos un jugador de la lista con su casilla de verificación.');
      return;
    }

    const selectedCards = docs
      .map((docNum) => {
        const jug = jugadores.find((j: Jugador) => j.NumeroDocumento === docNum);
        return jug ? { ...generarCardState(jug), showCategoria: imprimirCategoriaMasiva } : null;
      })
      .filter(Boolean) as CardState[];

    if (!selectedCards.length) {
      alert('No se encontraron datos para los jugadores seleccionados.');
      return;
    }

    try {
      setIsPrintingSelected(true);
      if (onBatchPrint) {
        await onBatchPrint(selectedCards);
      } else {
        await printMultipleCardsDirectly(selectedCards);
      }
    } catch (err) {
      console.error('Error al imprimir seleccionados:', err);
      alert('Ocurrió un error al preparar la impresión: ' + String(err));
    } finally {
      setIsPrintingSelected(false);
    }
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
        .map((row) => {
          const rawClub = String(row.Club === null || row.Club === undefined ? '' : row.Club).trim();
          const rawCat = String(row.Categoria === null || row.Categoria === undefined ? '' : row.Categoria).trim();
          const rawEst = String(row.Estado === null || row.Estado === undefined ? '' : row.Estado).trim();
          return {
            TipoDocumento: normalizarTipoDoc(row.TipoDocumento),
            NumeroDocumento: String(row.NumeroDocumento || '').trim(),
            Apellidos: String(row.Apellidos || '').trim(),
            Nombres: String(row.Nombres || '').trim(),
            FechaNacimiento: normalizarFechaIso(row.FechaNacimiento) || '',
            Club: rawClub,
            Categoria: rawCat,
            Estado: rawEst,
          };
        })
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
        if (!r.FechaNacimiento) motivos.push('fecha de nacimiento inválida (use formato DD/MM/AAAA o fecha estándar)');

        // Validación estricta: Club no puede ser NULL ni blanco, y debe existir
        let clubEncontrado = null;
        if (!r.Club) {
          motivos.push('el campo Club es obligatorio (no se permite vacío ni NULL)');
        } else {
          clubEncontrado = clubes.find(
            (c) => c.NombreClub.trim().toUpperCase() === r.Club.toUpperCase()
          );
          if (!clubEncontrado) motivos.push(`el club "${r.Club}" no existe en el sistema`);
        }

        // Validación estricta: Categoría no puede ser NULL ni blanca, y debe existir
        let catEncontrada = null;
        if (!r.Categoria) {
          motivos.push('el campo Categoría es obligatorio (no se permite vacío ni NULL)');
        } else {
          catEncontrada = categorias.find(
            (c) => c.trim().toUpperCase() === r.Categoria.toUpperCase()
          );
          if (!catEncontrada) motivos.push(`la categoría "${r.Categoria}" no existe`);
        }

        // Validación estricta: Estado no puede ser NULL ni blanco, y debe existir
        let estEncontrado = null;
        let estNormal = '';
        if (!r.Estado) {
          motivos.push('el campo Estado es obligatorio (no se permite vacío ni NULL)');
        } else {
          estNormal = normalizarEstado(r.Estado);
          estEncontrado = ESTADOS_FIJOS.find((s) => s.toUpperCase() === estNormal.toUpperCase());
          if (!estEncontrado) motivos.push(`el estado "${r.Estado}" no existe`);
        }

        return {
          ...r,
          __clubId: clubEncontrado ? clubEncontrado.ClubID : null,
          __categoriaResuelta: catEncontrada || null,
          __estadoResuelto: estEncontrado || estNormal || 'SOCIO',
          __isDup: existingDocs.includes(r.NumeroDocumento),
          __motivos: motivos,
          __valid: motivos.length === 0,
        };
      });

      setImportRows(validated);
      // Por requerimiento: marcar por defecto las filas que sean válidas
      setExcelCheckedIndices(
        validated.map((v, idx) => (v.__valid ? idx : -1)).filter((idx) => idx !== -1)
      );
      const invalidos = validated.filter((r) => !r.__valid).length;
      setImportStatus({
        msg: `${validated.length} fila(s) leída(s)${invalidos ? `, ${invalidos} con errores (campos obligatorios vacíos o no existentes)` : ''}.`,
        kind: invalidos ? 'err' : 'ok',
      });
    } catch (err: any) {
      setImportStatus({ msg: 'Error leyendo archivo: ' + err.message, kind: 'err' });
    }
  };

  const handleToggleAllExcel = () => {
    if (excelCheckedIndices.length === importRows.length) {
      setExcelCheckedIndices([]);
    } else {
      setExcelCheckedIndices(importRows.map((_, i) => i));
    }
  };

  const handleToggleExcelRow = (idx: number) => {
    setExcelCheckedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleConfirmImport = async () => {
    if (!excelCheckedIndices.length) {
      setImportStatus({ msg: 'No hay filas marcadas para importar.', kind: 'err' });
      return;
    }
    const seleccionados = importRows.filter((_, idx) => excelCheckedIndices.includes(idx));
    const validos = seleccionados.filter((r) => r.__valid);
    if (!validos.length) {
      setImportStatus({
        msg: 'No hay filas válidas marcadas para importar. Corrija los errores (Club, Categoría y Estado no pueden ser blancos/NULL y deben existir).',
        kind: 'err',
      });
      return;
    }

    setImportStatus({ msg: `Importando ${validos.length} jugadores válidos…`, kind: 'loading' });
    try {
      const payload = validos.map((r) =>
        jugadorJsToRow({
          TipoDocumento: r.TipoDocumento,
          NumeroDocumento: r.NumeroDocumento,
          Apellidos: r.Apellidos.toUpperCase(),
          Nombres: r.Nombres.toUpperCase(),
          FechaNacimiento: normalizarFechaIso(r.FechaNacimiento) || r.FechaNacimiento,
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
      setExcelCheckedIndices([]);
      setExcelName('ningún archivo elegido');
      setImportStatus({ msg: `¡${validos.length} jugadores importados exitosamente!`, kind: 'ok' });
      loadJugadores();
    } catch (err: any) {
      setImportStatus({ msg: 'Error al importar: ' + err.message, kind: 'err' });
    }
  };

  // Carga y procesamiento masivo de fotos (Archivos individuales o Carpeta)
  const procesarArchivosFotos = async (incomingFiles: File[]) => {
    const files = incomingFiles.filter((f) =>
      /\.(jpe?g|png|webp)$/i.test(f.name)
    );
    setFotosName(files.length ? `${files.length} archivo(s) seleccionado(s)` : 'ninguna');
    if (!files.length) {
      setFotosStatus({ msg: 'No se encontraron imágenes válidas (JPG, PNG o WebP).', kind: 'err' });
      return;
    }

    setFotosStatus({ msg: 'Verificando fotos con la base de datos de Supabase…', kind: 'loading' });

    try {
      // Obtener todos los registros (jugadores y árbitros) para cotejo inteligente
      const todosLosRegistros = await obtenerTodosParaFotos();

      const parsed = files.map((f) => {
        const match = encontrarCoincidenciaDoc(f.name, todosLosRegistros);
        const previewUrl = URL.createObjectURL(f);
        return {
          file: f,
          fileName: f.name,
          previewUrl,
          doc: match ? match.exactDoc : f.name.replace(/\.[^.]+$/, '').trim(),
          matched: !!match,
          checked: !!match,
          tabla: match ? match.tabla : (fotosMasivasTipo as 'jugadores' | 'administrativos'),
          matchedPerson: match
            ? {
                exactDoc: match.exactDoc,
                nombreCompleto: match.nombreCompleto,
                tabla: match.tabla,
              }
            : undefined,
        };
      });

      setFotosParsed(parsed);
      const coincidentes = parsed.filter((p) => p.matched).length;

      if (coincidentes === 0) {
        setFotosStatus({
          msg: `0 de ${files.length} fotos coinciden con el DNI de personas registradas. Revisa que el nombre de cada foto sea el número de documento.`,
          kind: 'err',
        });
        return;
      }

      setFotosStatus({
        msg: `${coincidentes} de ${files.length} fotos coinciden. ${autoSubirFotos ? 'Iniciando subida automática a Supabase…' : 'Listas para subir.'}`,
        kind: 'ok',
      });

      if (autoSubirFotos && coincidentes > 0) {
        await ejecutarSubidaFotos(parsed.filter((p) => p.checked && p.matched));
      }
    } catch (err: any) {
      setFotosStatus({ msg: 'Error al verificar fotos: ' + err.message, kind: 'err' });
    }
  };

  const handleCarpetaFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    procesarArchivosFotos(files);
  };

  const handleArchivosFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    procesarArchivosFotos(files);
  };

  const handleToggleFotoCheck = (idx: number) => {
    setFotosParsed((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleToggleAllFotos = (select: boolean) => {
    setFotosParsed((prev) =>
      prev.map((item) => (item.matched ? { ...item, checked: select } : item))
    );
  };

  const ejecutarSubidaFotos = async (seleccionadas: any[]) => {
    if (!seleccionadas.length) {
      setFotosStatus({ msg: 'No hay fotos coincidentes seleccionadas para subir.', kind: 'err' });
      return;
    }

    let ok = 0;
    let fail = 0;
    const uploadedDocs: { doc: string; url: string; tabla: string }[] = [];

    for (let i = 0; i < seleccionadas.length; i++) {
      const { file, doc, tabla } = seleccionadas[i];
      setFotosStatus({
        msg: `Subiendo a Supabase (${i + 1}/${seleccionadas.length}): ${file.name} [${doc}]…`,
        kind: 'loading',
      });

      try {
        // Subir directamente el File a Supabase Storage y actualizar la base de datos
        const pubUrl = await subirYEnlazarFoto(file, doc, tabla || 'jugadores');
        uploadedDocs.push({ doc, url: pubUrl, tabla: tabla || 'jugadores' });
        ok++;
      } catch (err) {
        console.error('Error subiendo foto para doc ' + doc, err);
        fail++;
      }
    }

    // Actualizar estado local de jugadores inmediatamente para que la vista previa del carnet y la nómina muestren la foto al instante
    if (uploadedDocs.length > 0) {
      const urlMap = new Map(uploadedDocs.map((u) => [u.doc, u.url]));
      setJugadores((prev) =>
        prev.map((j) => {
          const directMatch = urlMap.get(j.NumeroDocumento);
          if (directMatch) return { ...j, FotoArchivo: directMatch };
          const noZeroMatch = urlMap.get(j.NumeroDocumento.replace(/^0+/, ''));
          if (noZeroMatch) return { ...j, FotoArchivo: noZeroMatch };
          return j;
        })
      );
    }

    setFotosStatus({
      msg: `¡Éxito! ${ok} foto(s) subida(s) a Supabase y enlazadas con los carnets${fail ? `, ${fail} con error` : ''}.`,
      kind: fail && !ok ? 'err' : 'ok',
    });

    if (carpetaFotosInputRef.current) carpetaFotosInputRef.current.value = '';
    if (archivosFotosInputRef.current) archivosFotosInputRef.current.value = '';
    if (selectedClubId) loadJugadores();
  };

  const handleConfirmFotos = async () => {
    const seleccionadas = fotosParsed.filter((p) => p.checked && p.matched);
    await ejecutarSubidaFotos(seleccionadas);
  };

  const filteredJugadores = useMemo(() => {
    const list = jugadores.filter((j) => {
      if (!textoFiltro) return true;
      const q = textoFiltro.toLowerCase().trim();
      return (
        (j.Apellidos || '').toLowerCase().includes(q) ||
        (j.Nombres || '').toLowerCase().includes(q) ||
        (j.NumeroDocumento || '').includes(q)
      );
    });
    return ordenarJugadores(list);
  }, [jugadores, textoFiltro]);

  const selectedClub = clubes.find((c) => c.ClubID === selectedClubId);

  return (
    <div className="space-y-4">
      {/* Barra superior: Selector de Club & Filtros (Div principal #f4f4f2) */}
      <div
        style={{ backgroundColor: '#f4f4f2', borderColor: '#dcdcd8' }}
        className="bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs space-y-3"
      >
        {/* Fila 1: Selector de Club y Selector de Categoría alineados */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Selector de Club (7 columnas) */}
          <div className="md:col-span-7 flex items-center gap-2.5">
            {/* Logo del club al lado izquierdo del nombre */}
            {selectedClub?.LogoArchivo ? (
              <img
                src={selectedClub.LogoArchivo}
                alt={selectedClub.NombreClub}
                className="w-9 h-9 rounded-lg object-contain bg-white border border-[#dcdcd8] p-0.5 shadow-xs shrink-0"
                title={selectedClub.NombreClub}
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#1e1e21] border border-[#dcdcd8] dark:border-[#2e2e33] flex items-center justify-center text-[#e11d2e] shrink-0 shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
            )}

            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-[#1a1a1a] dark:text-[#f4f4f5] whitespace-nowrap">
                Club:
              </span>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="flex-1 text-xs bg-white text-[#1a1a1a] border border-[#dcdcd8] py-1.5 px-2 rounded"
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
          </div>

          {/* Selector de Categoría alineado en la fila (5 columnas) */}
          <div className="md:col-span-5 flex items-center gap-2">
            <span className="text-xs font-bold text-[#1a1a1a] whitespace-nowrap">
              Categoría:
            </span>
            <select
              value={categoriaFiltro}
              onChange={(e) => {
                const val = e.target.value;
                setCategoriaFiltro(val);
                if (val && !editingJugador) {
                  setCat1(val);
                }
              }}
              className="flex-1 text-xs py-1.5 px-2 bg-white text-[#1a1a1a] border border-[#dcdcd8] rounded"
            >
              <option value="">Todas las categorías</option>
              {categoriasClub.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Filtro del jugador DEBAJO del selector de club */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2 border-t border-[#dcdcd8]">
          <div className="md:col-span-7 flex items-center gap-2">
            <span className="text-xs font-bold text-[#555552] whitespace-nowrap flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#e11d2e]" /> Filtro de jugador:
            </span>
            <input
              type="text"
              value={textoFiltro}
              onChange={(e) => setTextoFiltro(e.target.value)}
              placeholder="Filtrar por DNI o Apellidos de jugador..."
              className="flex-1 text-xs py-1.5 px-3 bg-white text-[#1a1a1a] border border-[#dcdcd8] rounded"
            />
            {textoFiltro && (
              <button
                onClick={() => setTextoFiltro('')}
                className="text-xs text-[#e11d2e] hover:underline font-bold px-1.5 py-1 bg-white border border-[#dcdcd8] rounded"
                title="Limpiar filtro"
              >
                ✕
              </button>
            )}
          </div>
          {textoFiltro && (
            <div className="md:col-span-5 text-xs text-[#555552] italic">
              Filtrando jugadores en tabla ({filteredJugadores.length} encontrados)
            </div>
          )}
        </div>
      </div>

      {/* Distribución equilibrada en 2 Columnas (evita ventanas largas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA 1 (IZQUIERDA - 7 COLS): TABLA DE JUGADORES (Div principal #f4f4f2) */}
        <div
          style={{ backgroundColor: '#f4f4f2', borderColor: '#dcdcd8' }}
          className="lg:col-span-7 bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between border-b border-[#dcdcd8] dark:border-[#2e2e33] pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {selectedClub?.LogoArchivo && (
                <img
                  src={selectedClub.LogoArchivo}
                  alt=""
                  className="w-6 h-6 rounded object-contain bg-white border border-[#dcdcd8] p-0.5"
                />
              )}
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1.5">
                <span style={{ color: '#000000' }} className="text-[#000000]">
                  {selectedClub ? selectedClub.NombreClub : 'Jugadores del Club'} ({filteredJugadores.length})
                </span>
              </h2>
            </div>

            {filteredJugadores.length > 0 && (
              <div className="flex items-center gap-2">
                <label
                  className="flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-[#dcdcd8] select-none hover:border-[#1a1a1a] transition-colors shadow-2xs"
                  title="Marcar para que la categoría aparezca en el dorso sobre las redes sociales al imprimir los carnets"
                >
                  <input
                    type="checkbox"
                    checked={imprimirCategoriaMasiva}
                    onChange={(e) => setImprimirCategoriaMasiva(e.target.checked)}
                    className="accent-[#e11d2e] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Imprimir categoría</span>
                </label>

                <button
                  onClick={handlePrintSelected}
                  disabled={isPrintingSelected}
                  className="file-btn text-xs font-bold py-1.5 px-3 bg-[#18181b] hover:bg-black text-white border border-[#27272a] rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  title="Imprimir carnets de los jugadores seleccionados"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>
                    {isPrintingSelected
                      ? 'Preparando impresión…'
                      : selectedDocs.length > 0
                      ? `Imprimir seleccionados (${selectedDocs.length})`
                      : 'Imprimir seleccionados'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {!selectedClubId ? (
            <div className="jug-empty text-center py-12 text-[#555552]">
              Selecciona un club arriba para ver y gestionar su nómina de jugadores.
            </div>
          ) : loadingList ? (
            <div className="jug-empty text-center py-12 text-[#555552]">
              Cargando jugadores…
            </div>
          ) : !filteredJugadores.length ? (
            <div className="jug-empty text-center py-12 text-[#555552]">
              {jugadores.length
                ? 'Sin coincidencias con el filtro aplicado.'
                : 'Este club aún no tiene jugadores registrados. Agrégalos en el panel derecho.'}
            </div>
          ) : (
            <div className="max-h-[540px] overflow-y-auto border border-[#dcdcd8] rounded-lg bg-white">
              <table className="jug-table m-0">
                <thead>
                  <tr>
                    <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '28px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={
                          filteredJugadores.length > 0 &&
                          filteredJugadores.every((j) => selectedDocs.includes(j.NumeroDocumento))
                        }
                        onChange={handleToggleSelectAll}
                        title="Seleccionar / deseleccionar todos los jugadores de la lista"
                      />
                    </th>
                    <th style={{ width: '34px' }}></th>
                    <th>Jugador</th>
                    <th>Doc.</th>
                    <th>Cat.</th>
                    <th style={{ width: '85px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJugadores.map((j, idx) => (
                    <tr key={j.NumeroDocumento}>
                      <td className="text-center font-mono text-xs font-bold text-[#555552] dark:text-slate-400 select-none" style={{ width: '32px' }}>
                        {idx + 1}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="jugChk cursor-pointer"
                          value={j.NumeroDocumento}
                          data-doc={j.NumeroDocumento}
                          checked={selectedDocs.includes(j.NumeroDocumento)}
                          onChange={() => handleToggleSelect(j.NumeroDocumento)}
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
                        <b className="text-slate-900 dark:text-white font-extrabold text-sm block">
                          {j.Apellidos} {j.Nombres}
                        </b>
                        <span className="flex items-center text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <span>{normalizarEstado(j.Estado)}</span>
                          {renderEstadoCircles(j.Estado)}
                        </span>
                      </td>
                      <td className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{j.NumeroDocumento}</td>
                      <td className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {j.Categoria}
                        {j.Categoria2 ? (
                          <span className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
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

        {/* COLUMNA 2 (DERECHA - 5 COLS): PANELES EN PESTAÑAS (Div principal #f4f4f2) */}
        <div
          style={{ backgroundColor: '#f4f4f2', borderColor: '#dcdcd8' }}
          className="lg:col-span-5 bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs space-y-4"
        >
          {/* Navegación por pestañas para no hacer la ventana larga */}
          <div className="flex border-b border-[#dcdcd8] dark:border-[#2e2e33] pb-1 gap-1">
            <button
              onClick={() => setActiveTabRight('form')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'form'
                  ? 'bg-[#e11d2e] text-white'
                  : 'text-[#555552] dark:text-slate-400 hover:bg-[#e9e9e6] dark:hover:bg-[#2e2e33] hover:text-[#1a1a1a] dark:hover:text-white'
              }`}
            >
              {editingJugador ? '✎ Editar' : '＋ Nuevo'}
            </button>
            <button
              onClick={() => setActiveTabRight('excel')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'excel'
                  ? 'bg-[#e11d2e] text-white'
                  : 'text-[#555552] dark:text-slate-400 hover:bg-[#e9e9e6] dark:hover:bg-[#2e2e33] hover:text-[#1a1a1a] dark:hover:text-white'
              }`}
            >
              📥 Importar Excel
            </button>
            <button
              onClick={() => setActiveTabRight('fotos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'fotos'
                  ? 'bg-[#e11d2e] text-white'
                  : 'text-[#555552] dark:text-slate-400 hover:bg-[#e9e9e6] dark:hover:bg-[#2e2e33] hover:text-[#1a1a1a] dark:hover:text-white'
              }`}
            >
              📷 Subir Fotos
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
                    <option value="CE">CE</option>
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
                    {categoriasClub.map((c) => (
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
                    {categoriasClub.map((c) => (
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

                {/* Miniatura de la foto luego de subir foto */}
                {(fotoBase64 || editingJugador?.FotoArchivo) && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-white rounded-lg border border-[#dcdcd8] shadow-2xs">
                    <img
                      src={fotoBase64 ? `data:${fotoMime};base64,${fotoBase64}` : editingJugador?.FotoArchivo || ''}
                      alt="Miniatura"
                      className="w-12 h-14 object-cover rounded-md border border-[#dcdcd8] bg-slate-100 shadow-xs"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#1a1a1a] block truncate max-w-[200px]">{fotoName}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        ✓ Fotografía lista
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="file-row pt-2">
                <button
                  onClick={handleSaveJugador}
                  className="file-btn text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5 inline mr-1" /> Guardar jugador
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
                <div className="flex items-center justify-between bg-white dark:bg-[#1e1e21] p-2 rounded-lg border border-[#dcdcd8] dark:border-[#2e2e33]">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#1a1a1a] dark:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={importRows.length > 0 && excelCheckedIndices.length === importRows.length}
                      onChange={handleToggleAllExcel}
                      className="cursor-pointer"
                    />
                    <span>Activar / desactivar todos</span>
                  </label>
                  <span className="text-xs font-black text-[#e11d2e] bg-[#f4f4f2] dark:bg-black/30 px-2.5 py-0.5 rounded-full border border-[#dcdcd8] dark:border-[#2e2e33]">
                    {excelCheckedIndices.length} de {importRows.length} activados
                  </span>
                </div>
              )}

              {importRows.length > 0 && (
                <div className="import-preview max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded p-1 space-y-1">
                  {importRows.map((r, i) => (
                    <label
                      key={i}
                      className={`import-row ${!r.__valid ? 'err' : r.__isDup ? 'dup' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="importChk cursor-pointer"
                        data-idx={i}
                        checked={excelCheckedIndices.includes(i)}
                        onChange={() => handleToggleExcelRow(i)}
                      />
                      <span className="flex-1 text-xs">
                        <b>{r.Apellidos} {r.Nombres}</b> — {r.NumeroDocumento} ({r.Club}) {r.FechaNacimiento ? `· F.Nac: ${isoADmy(r.FechaNacimiento)}` : ''}
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Carga de fotos de Jugadores y Árbitros
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSubirFotos}
                    onChange={(e) => setAutoSubirFotos(e.target.checked)}
                    className="accent-[#e11d2e] rounded w-3.5 h-3.5"
                  />
                  <span>Subir automáticamente</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => carpetaFotosInputRef.current?.click()}
                  className="file-btn alt text-xs justify-center py-2"
                  title="Seleccionar una carpeta completa del equipo o club"
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1" /> Carpeta de fotos
                </button>
                <button
                  type="button"
                  onClick={() => archivosFotosInputRef.current?.click()}
                  className="file-btn alt text-xs justify-center py-2"
                  title="Seleccionar varios archivos JPG/PNG con Ctrl o Shift"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1" /> Archivos de fotos
                </button>
              </div>

              <div className="text-[11px] text-[#555552] dark:text-slate-400 bg-white dark:bg-slate-900 border border-[#dcdcd8] dark:border-slate-800 rounded p-2 flex items-center justify-between">
                <span>Selección: <strong className="text-slate-800 dark:text-slate-200">{fotosName}</strong></span>
              </div>

              {/* Input para carpeta */}
              <input
                ref={carpetaFotosInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                // @ts-ignore
                directory="true"
                multiple
                onChange={handleCarpetaFotos}
                className="hidden"
              />

              {/* Input para múltiples archivos */}
              <input
                ref={archivosFotosInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                onChange={handleArchivosFotos}
                className="hidden"
              />

              <div className="hint text-xs">
                El nombre de cada foto debe ser el número de documento (ej. <strong>07557840.jpg</strong> o <strong>45724229.png</strong>). Se coteja automáticamente con jugadores y árbitros registrados.
              </div>

              {fotosParsed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#555552] dark:text-slate-400">
                    <span>
                      {fotosParsed.filter((p) => p.matched).length} coincidentes de {fotosParsed.length} fotos
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAllFotos(true)}
                        className="text-[#e11d2e] hover:underline font-bold"
                      >
                        Marcar todas
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllFotos(false)}
                        className="text-[#555552] hover:underline font-bold"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="import-preview max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 space-y-1.5 bg-white dark:bg-slate-900">
                    {fotosParsed.map((p, i) => (
                      <label
                        key={i}
                        className={`import-row flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer border ${
                          !p.matched
                            ? 'bg-red-50/60 border-red-200 text-red-700'
                            : p.checked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={p.checked}
                          disabled={!p.matched}
                          onChange={() => handleToggleFotoCheck(i)}
                          className="rounded text-[#e11d2e] focus:ring-[#e11d2e] cursor-pointer"
                        />
                        {p.previewUrl ? (
                          <img
                            src={p.previewUrl}
                            alt=""
                            className="w-7 h-8 object-cover rounded border border-black/10 shrink-0 bg-slate-100"
                          />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] font-semibold truncate text-slate-800 dark:text-slate-200" title={p.fileName}>
                            {p.fileName}
                          </div>
                          {p.matched ? (
                            <div className="text-[11px] text-emerald-700 font-bold truncate">
                              ✓ [{p.doc}] {p.matchedPerson?.nombreCompleto} <span className="text-[10px] uppercase font-semibold text-emerald-600">({p.tabla === 'administrativos' ? 'Árbitro' : 'Jugador'})</span>
                            </div>
                          ) : (
                            <div className="text-[10.5px] text-red-600 font-medium italic">
                              ✗ No coincide con ningún DNI registrado
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmFotos}
                    disabled={fotosParsed.filter((p) => p.checked && p.matched).length === 0}
                    className="file-btn text-xs font-bold w-full justify-center py-2.5 bg-[#e11d2e] hover:bg-[#b91c1c] text-white disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-1.5" /> Subir y enlazar ahora a Supabase ({fotosParsed.filter((p) => p.checked && p.matched).length} fotos)
                  </button>
                </div>
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
