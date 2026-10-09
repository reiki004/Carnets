import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  sb,
  Administrativo,
  adminRowToJs,
  adminJsToRow,
  subirImagenSupabase,
  obtenerTodosParaFotos,
  subirYEnlazarFoto,
  normalizarTipoDoc,
  encontrarCoincidenciaDoc,
} from '../services/supabaseService';
import { DEFAULTS } from '../assets/cardAssets';
import { CardState } from './CardPreview';
import { DateInput } from './DateInput';
import { isoADmy, dmyAIso, normalizarFechaIso } from '../utils/dateHelpers';
import {
  Search,
  Plus,
  Save,
  Upload,
  Eye,
  Briefcase,
  Scale,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FolderOpen,
  Download,
  CheckSquare,
  Image as ImageIcon,
} from 'lucide-react';

interface ScreenAdminProps {
  cargosCache: any[];
  ternas?: string[];
  onOpenCardModal: (card: CardState) => void;
}

export const ScreenAdmin: React.FC<ScreenAdminProps> = ({
  cargosCache,
  ternas = [],
  onOpenCardModal,
}) => {
  const [activeTabRight, setActiveTabRight] = useState<'form' | 'excel' | 'fotos'>('form');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Administrativo[]>([]);
  const [filtroTerna, setFiltroTerna] = useState<string>('');
  const [imprimirTernaDorso, setImprimirTernaDorso] = useState<boolean>(false);
  const [status, setStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  // Campos formulario
  const [editingAdmin, setEditingAdmin] = useState<Administrativo | null>(null);
  const [tipoDoc, setTipoDoc] = useState('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombres, setNombres] = useState('');
  // Cargo debe iniciar en ÁRBITRO por defecto
  const [cargo, setCargo] = useState('ÁRBITRO');
  const [terna, setTerna] = useState('');
  const [fnac, setFnac] = useState('');
  const [fotoName, setFotoName] = useState('ninguna');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');

  const [autoSubirFotos, setAutoSubirFotos] = useState(true);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const carpetaFotosInputRef = useRef<HTMLInputElement>(null);
  const archivosFotosInputRef = useRef<HTMLInputElement>(null);

  // Estados para Carga Masiva Excel
  const [excelName, setExcelName] = useState('ningún archivo elegido');
  const [importRows, setImportRows] = useState<any[]>([]);
  const [excelCheckedIndices, setExcelCheckedIndices] = useState<number[]>([]);
  const [importStatus, setImportStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  // Estados para Carga Masiva Fotos
  const [fotosName, setFotosName] = useState('ninguna');
  const [fotosParsed, setFotosParsed] = useState<any[]>([]);
  const [fotosStatus, setFotosStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  // Lista de cargos asegurando que ÁRBITRO esté disponible
  const cargosDisponibles = cargosCache.some((c) => c.cargo.toUpperCase() === 'ÁRBITRO')
    ? cargosCache.map((c) => c.cargo)
    : ['ÁRBITRO', ...cargosCache.map((c) => c.cargo)];

  const isArbitro = cargo.trim().toUpperCase() === 'ÁRBITRO' || cargo.trim().toUpperCase() === 'ARBITRO';

  function esNombreValido(str: string): boolean {
    return /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/.test(str.trim()) && str.trim().length > 0;
  }

  // Carga inicial de árbitros para navegación directa
  const cargarTodosLosArbitros = async () => {
    try {
      const { data, error } = await sb
        .from('administrativos')
        .select('*')
        .order('apellidos')
        .limit(100);
      if (!error && data) {
        setSearchResults(data.map(adminRowToJs));
      }
    } catch (err) {
      console.warn('Error al cargar árbitros:', err);
    }
  };

  useEffect(() => {
    cargarTodosLosArbitros();
  }, []);

  const generarCardStateAdmin = (adm: Administrativo, incluirTernaDorso: boolean = imprimirTernaDorso): CardState => {
    const cargoObj = cargosCache.find((c) => c.cargo === adm.ClubCargo);
    const ternaVal = adm.Terna || adm.Categoria || '';

    return {
      tipo: 'admin',
      apellidos: adm.Apellidos || 'APELLIDO',
      nombres: adm.Nombres || 'NOMBRE',
      clubname: adm.ClubCargo || 'ÁRBITRO',
      photoUrl: adm.FotoArchivo || DEFAULTS.photo,
      photoScale: 100,
      photoOffsetX: 0,
      photoOffsetY: 0,
      logoUrl: '',
      logoScale: 100,
      headerUrl: DEFAULTS.header,
      footerUrl: cargoObj && cargoObj.pie_url ? cargoObj.pie_url : DEFAULTS.footer,
      footerHeight: 20,
      fnac: isoADmy(adm.FechaNacimiento) || 'dd/mm/aaaa',
      dni: adm.NumeroDocumento || '00000000',
      categoria: ternaVal,
      terna: ternaVal,
      showCategoria: incluirTernaDorso, // desactivada por defecto
      backTopUrl: DEFAULTS.backtop,
      backBottomUrl: DEFAULTS.backbottom,
    };
  };

  const cargarAdminEnFormulario = (adm: Administrativo) => {
    setEditingAdmin(adm);
    setTipoDoc(adm.TipoDocumento || 'DNI');
    setNumDoc(adm.NumeroDocumento || '');
    setApellidos(adm.Apellidos || '');
    setNombres(adm.Nombres || '');
    setCargo(adm.ClubCargo || 'ÁRBITRO');
    setTerna(adm.Terna || adm.Categoria || '');
    setFnac(isoADmy(adm.FechaNacimiento));
    setFotoName(adm.FotoArchivo ? 'foto actual (sin cambios)' : 'ninguna');
    setFotoBase64(null);
    setStatus({ msg: 'Registro cargado en formulario.', kind: 'ok' });
  };

  const handleBuscar = async () => {
    const q = searchQuery.trim();
    if (!q) {
      cargarTodosLosArbitros();
      setStatus({ msg: 'Mostrando listado general.', kind: 'ok' });
      return;
    }
    setStatus({ msg: 'Buscando en árbitros…', kind: 'loading' });
    try {
      const { data, error } = await sb
        .from('administrativos')
        .select('*')
        .or(`numero_documento.ilike.%${q}%,apellidos.ilike.%${q}%,nombres.ilike.%${q}%`)
        .limit(30);

      if (error) throw error;
      const list = (data || []).map(adminRowToJs);
      if (!list.length) {
        setStatus({ msg: 'Sin resultados.', kind: 'err' });
        setSearchResults([]);
        return;
      }
      setSearchResults(list);
      setStatus({ msg: `${list.length} resultado(s) encontrado(s).`, kind: 'ok' });
    } catch (err: any) {
      setStatus({ msg: 'Error al buscar: ' + err.message, kind: 'err' });
    }
  };

  const handleNuevo = () => {
    setEditingAdmin(null);
    setTipoDoc('DNI');
    setNumDoc('');
    setApellidos('');
    setNombres('');
    // El cargo debe iniciar en ÁRBITRO por defecto
    setCargo('ÁRBITRO');
    setTerna('');
    setFnac('');
    setFotoName('ninguna');
    setFotoBase64(null);
    setStatus({ msg: 'Formulario listo para nuevo registro.', kind: 'ok' });
  };

  const handleDeleteAdmin = async (doc: string, nom: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nom} (${doc})?`)) return;
    try {
      const { error } = await sb.from('administrativos').delete().eq('numero_documento', doc);
      if (error) throw error;
      setSearchResults((prev) => prev.filter((a) => a.NumeroDocumento !== doc));
      if (editingAdmin?.NumeroDocumento === doc) {
        handleNuevo();
      }
      setStatus({ msg: 'Árbitro/directivo eliminado exitosamente.', kind: 'ok' });
    } catch (err: any) {
      setStatus({ msg: 'Error al eliminar: ' + err.message, kind: 'err' });
    }
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      const [meta, b64] = res.split(',');
      setFotoBase64(b64);
      setFotoMime(meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg');
      setFotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async () => {
    const doc = numDoc.trim();
    if (!doc) {
      setStatus({ msg: 'Ingresa el número de documento.', kind: 'err' });
      return;
    }
    if (!/^\d{8}$/.test(doc)) {
      alert('El número de documento (DNI, CE o Pasaporte) debe tener exactamente 8 dígitos numéricos.');
      setStatus({ msg: 'El documento debe tener exactamente 8 dígitos numéricos.', kind: 'err' });
      return;
    }
    if (!esNombreValido(apellidos)) {
      alert('Apellidos solo debe contener letras (se acepta Ñ y tildes).');
      setStatus({ msg: 'Apellidos solo debe contener letras (se acepta Ñ y tildes).', kind: 'err' });
      return;
    }
    if (!esNombreValido(nombres)) {
      alert('Nombres solo debe contener letras (se acepta Ñ y tildes).');
      setStatus({ msg: 'Nombres solo debe contener letras (se acepta Ñ y tildes).', kind: 'err' });
      return;
    }
    const fechaIso = dmyAIso(fnac);
    if (fechaIso === null) {
      setStatus({ msg: 'La fecha de nacimiento debe tener el formato dd/mm/aaaa.', kind: 'err' });
      return;
    }

    setStatus({ msg: 'Guardando en la base de datos…', kind: 'loading' });
    try {
      let fotoUrl = editingAdmin ? editingAdmin.FotoArchivo : null;
      if (fotoBase64) {
        fotoUrl = await subirImagenSupabase('fotos', `${doc}_admin.jpg`, fotoBase64, fotoMime);
      }

      const ternaFinal = isArbitro ? terna.trim().toUpperCase() : '';

      const data: Administrativo = {
        TipoDocumento: tipoDoc,
        NumeroDocumento: doc,
        Apellidos: apellidos.trim().toUpperCase(),
        Nombres: nombres.trim().toUpperCase(),
        Tipo: 'Administrativo',
        ClubCargo: cargo,
        Categoria: ternaFinal,
        Terna: ternaFinal,
        Estado: '',
        FechaNacimiento: fechaIso,
        FotoArchivo: fotoUrl,
        LogoArchivo: null,
      };

      const { error } = await sb.from('administrativos').upsert(adminJsToRow(data));
      if (error) throw error;

      setStatus({ msg: '¡Árbitro guardado exitosamente!', kind: 'ok' });
      cargarTodosLosArbitros();
      handleNuevo();
    } catch (err: any) {
      setStatus({ msg: 'Error al guardar: ' + err.message, kind: 'err' });
    }
  };

  // Carga Masiva Excel para Árbitros
  const handleDownloadTemplateAdmin = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['TipoDocumento', 'NumeroDocumento', 'Apellidos', 'Nombres', 'FechaNacimiento', 'Cargo', 'Terna', 'Estado'],
      ['DNI', '07557840', 'RODRIGUEZ', 'CARLOS', '15/05/1985', 'ÁRBITRO', ternas[0] || 'TERNA 1', 'ACTIVO'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Arbitros');
    XLSX.writeFile(wb, 'plantilla_arbitros_interclubes.xlsx');
  };

  const handleExcelUploadAdmin = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const cargoRow = String(row.Cargo || 'ÁRBITRO').trim().toUpperCase() || 'ÁRBITRO';
          const ternaRow = String(row.Terna === null || row.Terna === undefined ? '' : row.Terna).trim().toUpperCase();
          return {
            TipoDocumento: normalizarTipoDoc(row.TipoDocumento),
            NumeroDocumento: String(row.NumeroDocumento || '').trim(),
            Apellidos: String(row.Apellidos || '').trim(),
            Nombres: String(row.Nombres || '').trim(),
            FechaNacimiento: normalizarFechaIso(row.FechaNacimiento) || '',
            Cargo: cargoRow,
            Terna: ternaRow,
            Estado: String(row.Estado || 'ACTIVO').trim().toUpperCase(),
          };
        })
        .filter((r) => r.NumeroDocumento);

      if (!parsed.length) {
        setImportStatus({ msg: 'No se encontraron filas con NumeroDocumento válido.', kind: 'err' });
        return;
      }

      const { data: existingRows } = await sb.from('administrativos').select('numero_documento');
      const existingDocs = (existingRows || []).map((r: any) => String(r.numero_documento));

      const validated = parsed.map((r) => {
        const motivos: string[] = [];
        if (!/^\d{8}$/.test(r.NumeroDocumento)) motivos.push('documento debe ser 8 dígitos numéricos');
        if (!esNombreValido(r.Apellidos) || !esNombreValido(r.Nombres)) motivos.push('apellidos/nombres con caracteres inválidos');

        // Validación de Terna:
        // Si es ÁRBITRO, se permite subir con el campo vacío en TERNA, pero valida que pertenezca a una terna existente si tiene valor
        let ternaResuelta: string | null = null;
        const esArbitroRow = r.Cargo.toUpperCase() === 'ÁRBITRO' || r.Cargo.toUpperCase() === 'ARBITRO';
        if (esArbitroRow && r.Terna) {
          const ternaEncontrada = ternas.find((t) => t.trim().toUpperCase() === r.Terna.toUpperCase());
          if (!ternaEncontrada) {
            motivos.push(`la terna "${r.Terna}" no existe en el sistema`);
          } else {
            ternaResuelta = ternaEncontrada;
          }
        } else if (esArbitroRow && !r.Terna) {
          // Permitido vacío en TERNA
          ternaResuelta = null;
        }

        return {
          ...r,
          __ternaResuelta: ternaResuelta,
          __isDup: existingDocs.includes(r.NumeroDocumento),
          __motivos: motivos,
          __valid: motivos.length === 0,
        };
      });

      setImportRows(validated);
      setExcelCheckedIndices(
        validated.map((v, idx) => (v.__valid ? idx : -1)).filter((idx) => idx !== -1)
      );
      const invalidos = validated.filter((r) => !r.__valid).length;
      setImportStatus({
        msg: `${validated.length} fila(s) leída(s)${invalidos ? `, ${invalidos} con errores (verifique las ternas marcadas en rojo)` : ''}.`,
        kind: invalidos ? 'err' : 'ok',
      });
    } catch (err: any) {
      setImportStatus({ msg: 'Error leyendo archivo: ' + err.message, kind: 'err' });
    }
  };

  const handleToggleAllExcelAdmin = () => {
    if (excelCheckedIndices.length === importRows.length) {
      setExcelCheckedIndices([]);
    } else {
      setExcelCheckedIndices(importRows.map((_, i) => i));
    }
  };

  const handleToggleExcelRowAdmin = (idx: number) => {
    setExcelCheckedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleConfirmImportAdmin = async () => {
    if (!excelCheckedIndices.length) {
      setImportStatus({ msg: 'No hay filas marcadas para importar.', kind: 'err' });
      return;
    }
    const seleccionados = importRows.filter((_, idx) => excelCheckedIndices.includes(idx));
    const validos = seleccionados.filter((r) => r.__valid);
    if (!validos.length) {
      setImportStatus({ msg: 'No hay filas válidas para importar. Corrija las ternas o datos erróneos.', kind: 'err' });
      return;
    }

    setImportStatus({ msg: `Importando ${validos.length} árbitro(s)…`, kind: 'loading' });
    try {
      const payload = validos.map((r) =>
        adminJsToRow({
          TipoDocumento: r.TipoDocumento,
          NumeroDocumento: r.NumeroDocumento,
          Apellidos: r.Apellidos.toUpperCase(),
          Nombres: r.Nombres.toUpperCase(),
          Tipo: 'Árbitro',
          ClubCargo: r.Cargo,
          Categoria: r.__ternaResuelta || null,
          Terna: r.__ternaResuelta || null,
          Estado: r.Estado || 'ACTIVO',
          FechaNacimiento: r.FechaNacimiento || null,
          FotoArchivo: null,
          LogoArchivo: null,
        })
      );

      const { error } = await sb.from('administrativos').upsert(payload, {
        onConflict: 'numero_documento',
        ignoreDuplicates: false,
      });
      if (error) throw error;

      setImportRows([]);
      setExcelCheckedIndices([]);
      setExcelName('ningún archivo elegido');
      setImportStatus({ msg: `¡${validos.length} árbitro(s) importados exitosamente!`, kind: 'ok' });
      cargarTodosLosArbitros();
    } catch (err: any) {
      setImportStatus({ msg: 'Error al importar: ' + err.message, kind: 'err' });
    }
  };

  // Carga Masiva Fotos para Árbitros (Carpeta o Archivos individuales)
  const procesarArchivosFotosAdmin = async (incomingFiles: File[]) => {
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
          tabla: match ? match.tabla : ('administrativos' as const),
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
          msg: `0 de ${files.length} fotos coinciden con el DNI de árbitros registrados. Revisa que el nombre de cada foto sea el número de documento.`,
          kind: 'err',
        });
        return;
      }

      setFotosStatus({
        msg: `${coincidentes} de ${files.length} fotos coinciden con personas registradas. ${autoSubirFotos ? 'Iniciando subida automática a Supabase…' : 'Listas para subir.'}`,
        kind: 'ok',
      });

      if (autoSubirFotos && coincidentes > 0) {
        await ejecutarSubidaFotosAdmin(parsed.filter((p) => p.checked && p.matched));
      }
    } catch (err: any) {
      setFotosStatus({ msg: 'Error al verificar fotos: ' + err.message, kind: 'err' });
    }
  };

  const handleCarpetaFotosAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    procesarArchivosFotosAdmin(files);
  };

  const handleArchivosFotosAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    procesarArchivosFotosAdmin(files);
  };

  const handleToggleFotoCheckAdmin = (idx: number) => {
    setFotosParsed((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleToggleAllFotosAdmin = (select: boolean) => {
    setFotosParsed((prev) =>
      prev.map((item) => (item.matched ? { ...item, checked: select } : item))
    );
  };

  const ejecutarSubidaFotosAdmin = async (seleccionadas: any[]) => {
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
        const pubUrl = await subirYEnlazarFoto(file, doc, tabla || 'administrativos');
        uploadedDocs.push({ doc, url: pubUrl, tabla: tabla || 'administrativos' });
        ok++;
      } catch (err) {
        console.error('Error subiendo foto para árbitro ' + doc, err);
        fail++;
      }
    }

    // Actualizar estado local inmediatamente para que la vista previa y la lista se actualicen sin recargar
    if (uploadedDocs.length > 0) {
      const urlMap = new Map(uploadedDocs.map((u) => [u.doc, u.url]));
      setSearchResults((prev) =>
        prev.map((a) => {
          const directMatch = urlMap.get(a.NumeroDocumento);
          if (directMatch) return { ...a, FotoArchivo: directMatch };
          const noZeroMatch = urlMap.get(a.NumeroDocumento.replace(/^0+/, ''));
          if (noZeroMatch) return { ...a, FotoArchivo: noZeroMatch };
          return a;
        })
      );
    }

    setFotosStatus({
      msg: `¡Éxito! ${ok} foto(s) subida(s) a Supabase y enlazadas con los carnets${fail ? `, ${fail} con error` : ''}.`,
      kind: fail && !ok ? 'err' : 'ok',
    });
    if (carpetaFotosInputRef.current) carpetaFotosInputRef.current.value = '';
    if (archivosFotosInputRef.current) archivosFotosInputRef.current.value = '';
    cargarTodosLosArbitros();
  };

  const handleConfirmFotosAdmin = async () => {
    const seleccionadas = fotosParsed.filter((p) => p.checked && p.matched);
    await ejecutarSubidaFotosAdmin(seleccionadas);
  };

  // Filtrado por terna arbitral en el directorio
  const arbitrosFiltrados = searchResults.filter((r) => {
    if (!filtroTerna) return true;
    const t = (r.Terna || r.Categoria || '').toUpperCase();
    return t === filtroTerna.toUpperCase();
  });

  return (
    <div className="space-y-4">
      {/* Distribución equilibrada en 2 columnas (evita ventana larga) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda (6 cols): Buscador, Filtro de Terna y Directorio de Árbitros (Div principal #f4f4f2) */}
        <div className="lg:col-span-6 bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-2 flex-wrap gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#e11d2e]" />
              Directorio de Árbitros ({arbitrosFiltrados.length})
            </h2>
            <div className="flex items-center gap-2">
              {/* Casilla de verificación para imprimir al dorso la terna arbitral (desactivada por defecto) */}
              <label
                className="flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-[#dcdcd8] select-none hover:border-[#1a1a1a] transition-colors shadow-2xs"
                title="Marcar para que la terna arbitral aparezca en el dorso sobre las redes sociales al imprimir los carnets"
              >
                <input
                  type="checkbox"
                  checked={imprimirTernaDorso}
                  onChange={(e) => setImprimirTernaDorso(e.target.checked)}
                  className="accent-[#e11d2e] w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span>Imprimir terna al dorso</span>
              </label>

              <button
                onClick={handleNuevo}
                className="file-btn text-xs py-1 px-2.5 bg-[#e11d2e] hover:bg-[#c81926] text-white border-none font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo
              </button>
            </div>
          </div>

          <label className="text-xs font-bold text-[#1a1a1a] block">
            Buscar árbitro (DNI o apellidos)
          </label>
          <div className="file-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="Ej. 07557840 o Flores"
              className="flex-1 text-xs bg-white text-[#1a1a1a] border border-[#dcdcd8]"
            />
            <button onClick={handleBuscar} className="file-btn alt text-xs">
              <Search className="w-3.5 h-3.5" /> Buscar
            </button>
          </div>

          {/* Filtro para la terna arbitral en el directorio */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold text-[#555552] whitespace-nowrap flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-[#e11d2e]" /> Filtro de Terna:
            </span>
            <select
              value={filtroTerna}
              onChange={(e) => setFiltroTerna(e.target.value)}
              className="flex-1 text-xs bg-white text-[#1a1a1a] border border-[#dcdcd8] py-1.5 px-2 rounded"
            >
              <option value="">— Todas las ternas arbitrales —</option>
              {ternas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {filtroTerna && (
              <button
                onClick={() => setFiltroTerna('')}
                className="text-xs text-[#e11d2e] hover:underline font-bold px-1.5 py-1 bg-white border border-[#dcdcd8] rounded"
                title="Quitar filtro de terna"
              >
                ✕
              </button>
            )}
          </div>

          {arbitrosFiltrados.length > 0 ? (
            <div className="space-y-2 mt-3 max-h-96 overflow-y-auto pr-1">
              {arbitrosFiltrados.map((r) => (
                <div
                  key={r.NumeroDocumento}
                  className="p-2.5 rounded-lg border border-[#dcdcd8] hover:border-[#e11d2e] bg-white flex items-center justify-between gap-2 transition-colors"
                >
                  <div
                    onClick={() => cargarAdminEnFormulario(r)}
                    className="cursor-pointer flex-1"
                  >
                    <b className="text-xs text-[#1a1a1a] font-extrabold block">
                      {r.Apellidos} {r.Nombres}
                    </b>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11.5px] text-[#555552] font-semibold">
                        {r.TipoDocumento}: {r.NumeroDocumento} · {r.ClubCargo}
                      </span>
                      {(r.Terna || r.Categoria) && (
                        <span className="text-[10.5px] font-bold text-[#e11d2e] bg-[#e11d2e]/10 px-1.5 py-0.2 rounded border border-[#e11d2e]/20">
                          ⚖️ {r.Terna || r.Categoria}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenCardModal(generarCardStateAdmin(r, imprimirTernaDorso))}
                      className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-[#f4f4f2] hover:bg-emerald-50 border border-[#dcdcd8] rounded-md transition-colors"
                      title="Ver carnet emergente / Imprimir"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => cargarAdminEnFormulario(r)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 bg-[#f4f4f2] hover:bg-blue-50 border border-[#dcdcd8] rounded-md transition-colors"
                      title="Editar datos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(r.NumeroDocumento, `${r.Apellidos} ${r.Nombres}`)}
                      className="p-1.5 text-red-600 hover:text-red-800 bg-[#f4f4f2] hover:bg-red-50 border border-[#dcdcd8] rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#888884] bg-white rounded-lg border border-[#dcdcd8]">
              No se encontraron árbitros {filtroTerna ? `en la terna "${filtroTerna}"` : ''}.
            </div>
          )}
        </div>

        {/* Columna Derecha (6 cols): Paneles en pestañas (Formulario, Excel, Fotos) */}
        <div className="lg:col-span-6 bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs space-y-3">
          {/* Navegación por pestañas */}
          <div className="flex border-b border-[#dcdcd8] pb-1 gap-1">
            <button
              onClick={() => setActiveTabRight('form')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'form'
                  ? 'bg-[#e11d2e] text-white'
                  : 'text-[#555552] hover:bg-[#e9e9e6] hover:text-[#1a1a1a]'
              }`}
            >
              {editingAdmin ? '✎ Editar' : '＋ Nuevo'}
            </button>
            <button
              onClick={() => setActiveTabRight('excel')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'excel'
                  ? 'bg-[#e11d2e] text-white'
                  : 'text-[#555552] hover:bg-[#e9e9e6] hover:text-[#1a1a1a]'
              }`}
            >
              📥 Importar Excel
            </button>
            <button
              onClick={() => setActiveTabRight('fotos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTabRight === 'fotos'
                  ? 'bg-[#e11d2e] text-white'
                  : 'text-[#555552] hover:bg-[#e9e9e6] hover:text-[#1a1a1a]'
              }`}
            >
              📷 Subir Fotos
            </button>
          </div>

          {/* TAB 1: FORMULARIO INDIVIDUAL */}
          {activeTabRight === 'form' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                  {editingAdmin
                    ? `✎ Editando Árbitro: ${editingAdmin.Apellidos} ${editingAdmin.Nombres}`
                    : '＋ Registrar Árbitro'}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#1a1a1a]">
                    Tipo documento
                  </label>
                  <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1a1a1a]">
                    N° Documento
                  </label>
                  <input
                    type="text"
                    value={numDoc}
                    onChange={(e) => setNumDoc(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="00000000"
                    maxLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1a1a]">
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
                <label className="text-xs font-bold text-[#1a1a1a]">
                  Nombres
                </label>
                <input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value.toUpperCase())}
                  placeholder="NOMBRE"
                />
              </div>

              {/* Cargo y Selector de Terna Arbitral */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#1a1a1a]">
                    Cargo
                  </label>
                  <select
                    value={cargo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCargo(val);
                      if (val.toUpperCase() !== 'ÁRBITRO' && val.toUpperCase() !== 'ARBITRO') {
                        setTerna('');
                      }
                    }}
                  >
                    {cargosDisponibles.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1a1a1a] flex items-center justify-between">
                    <span>Terna Arbitral</span>
                    {!isArbitro && (
                      <span className="text-[10px] text-[#888884] font-normal italic">
                        (Solo para Árbitro)
                      </span>
                    )}
                  </label>
                  <select
                    value={isArbitro ? terna : ''}
                    onChange={(e) => setTerna(e.target.value)}
                    disabled={!isArbitro}
                    className={`w-full text-xs bg-white text-[#1a1a1a] border border-[#dcdcd8] py-1.5 px-2 rounded ${
                      !isArbitro ? 'opacity-50 cursor-not-allowed bg-zinc-100' : ''
                    }`}
                  >
                    <option value="">— {isArbitro ? 'Seleccionar terna' : 'No aplica'} —</option>
                    {ternas.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1a1a]">
                  Fecha nacimiento
                </label>
                <DateInput
                  value={fnac}
                  onChange={setFnac}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1a1a]">
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
                  <span className="file-name text-xs">{fotoName}</span>
                </div>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFoto}
                  className="hidden"
                />

                {/* Miniatura de la foto */}
                {(fotoBase64 || editingAdmin?.FotoArchivo) && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-white rounded-lg border border-[#dcdcd8] shadow-2xs">
                    <img
                      src={fotoBase64 ? `data:${fotoMime};base64,${fotoBase64}` : editingAdmin?.FotoArchivo || ''}
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
                <button onClick={handleGuardar} className="file-btn text-xs font-bold">
                  <Save className="w-3.5 h-3.5" /> Guardar en base de datos
                </button>
                <button onClick={handleNuevo} className="file-btn alt text-xs">
                  Cancelar
                </button>
              </div>

              {status.msg && <div className={`db-status ${status.kind} text-xs mt-2`}>{status.msg}</div>}
            </div>
          )}

          {/* TAB 2: IMPORTAR DESDE EXCEL */}
          {activeTabRight === 'excel' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                  📥 Carga masiva desde archivo Excel
                </h2>
                <button
                  onClick={handleDownloadTemplateAdmin}
                  className="text-xs text-[#e11d2e] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Descargar plantilla de ejemplo con las columnas requeridas"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar plantilla
                </button>
              </div>

              <div className="file-row">
                <button
                  onClick={() => excelInputRef.current?.click()}
                  className="file-btn alt text-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Subir archivo .xlsx
                </button>
                <span className="file-name text-xs truncate max-w-[220px]">{excelName}</span>
              </div>

              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUploadAdmin}
                className="hidden"
              />

              <div className="hint text-[11px] text-[#555552] leading-relaxed">
                Columnas requeridas: <strong>TipoDocumento, NumeroDocumento, Apellidos, Nombres, FechaNacimiento, Cargo, TERNA, Estado</strong>.<br />
                <em>Nota: Para árbitros, el campo TERNA puede dejarse vacío, pero si se indica un valor debe pertenecer a una terna existente.</em>
              </div>

              {importRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#555552]">
                    <span>
                      {excelCheckedIndices.length} de {importRows.length} fila(s) seleccionadas
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleAllExcelAdmin}
                      className="text-[#e11d2e] hover:underline font-bold cursor-pointer"
                    >
                      {excelCheckedIndices.length === importRows.length ? 'Deseleccionar todas' : 'Marcar todas'}
                    </button>
                  </div>

                  <div className="import-preview max-h-56 overflow-y-auto border border-[#dcdcd8] rounded-lg p-1 space-y-1 bg-white">
                    {importRows.map((r, i) => (
                      <label
                        key={i}
                        className={`import-row flex items-start gap-2 p-1.5 rounded text-xs cursor-pointer ${
                          !r.__valid ? 'bg-red-50 text-red-800' : excelCheckedIndices.includes(i) ? 'bg-emerald-50 text-emerald-900' : 'bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={excelCheckedIndices.includes(i)}
                          onChange={() => handleToggleExcelRowAdmin(i)}
                          className="mt-0.5 rounded text-[#e11d2e] focus:ring-[#e11d2e]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs">
                              {r.Apellidos} {r.Nombres}
                            </span>
                            <span className="text-[11px] font-mono text-[#555552]">
                              ({r.TipoDocumento} {r.NumeroDocumento})
                            </span>
                            {r.Terna && (
                              <span className="text-[10px] font-bold bg-[#e11d2e]/10 text-[#e11d2e] px-1.5 py-0.2 rounded border border-[#e11d2e]/20">
                                ⚖️ {r.Terna}
                              </span>
                            )}
                            {r.__isDup && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1 rounded">
                                Ya existe (se actualizará)
                              </span>
                            )}
                          </div>
                          {!r.__valid && (
                            <div className="text-[10.5px] text-red-600 font-semibold mt-0.5">
                              ⚠️ Errores: {r.__motivos.join(', ')}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmImportAdmin}
                    className="file-btn text-xs font-bold w-full justify-center"
                  >
                    <Upload className="w-3.5 h-3.5" /> Confirmar importación de {excelCheckedIndices.length} árbitro(s)
                  </button>
                </div>
              )}

              {importStatus.msg && (
                <div className={`db-status ${importStatus.kind} text-xs mt-2`}>
                  {importStatus.msg}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CARGA MASIVA DE FOTOS PARA ÁRBITROS */}
          {activeTabRight === 'fotos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                  📷 Carga de fotos de árbitros
                </h2>
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
                  title="Seleccionar una carpeta completa de fotos de árbitros"
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
                onChange={handleCarpetaFotosAdmin}
                className="hidden"
              />

              {/* Input para múltiples archivos */}
              <input
                ref={archivosFotosInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                onChange={handleArchivosFotosAdmin}
                className="hidden"
              />

              <div className="hint text-[11px] text-[#555552] leading-relaxed">
                El nombre de cada foto debe corresponder al número de documento del árbitro (ej. <strong>07557840.jpg</strong> o <strong>7557840.png</strong>). Se enlazarán automáticamente al carnet de cada árbitro en Supabase.
              </div>

              {fotosParsed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#555552]">
                    <span>
                      {fotosParsed.filter((p) => p.matched).length} coincidentes de {fotosParsed.length} foto(s)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAllFotosAdmin(true)}
                        className="text-[#e11d2e] hover:underline font-bold"
                      >
                        Marcar todas
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllFotosAdmin(false)}
                        className="text-[#555552] hover:underline font-bold"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="import-preview max-h-56 overflow-y-auto border border-[#dcdcd8] rounded-lg p-1.5 space-y-1.5 bg-white dark:bg-slate-900">
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
                          onChange={() => handleToggleFotoCheckAdmin(i)}
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
                              ✗ No coincide con ningún árbitro registrado
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmFotosAdmin}
                    disabled={fotosParsed.filter((p) => p.checked && p.matched).length === 0}
                    className="file-btn text-xs font-bold w-full justify-center py-2.5 bg-[#e11d2e] hover:bg-[#b91c1c] text-white disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-1.5" /> Subir y enlazar ahora a Supabase ({fotosParsed.filter((p) => p.checked && p.matched).length} fotos)
                  </button>
                </div>
              )}

              {fotosStatus.msg && (
                <div className={`db-status ${fotosStatus.kind} text-xs mt-2`}>
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
