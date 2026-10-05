import React, { useState, useRef } from 'react';
import {
  sb,
  Administrativo,
  adminRowToJs,
  adminJsToRow,
  subirImagenSupabase,
} from '../services/supabaseService';
import { DEFAULTS } from '../assets/cardAssets';
import { CardState } from './CardPreview';
import { DateInput } from './DateInput';
import { isoADmy, dmyAIso } from '../utils/dateHelpers';
import { Search, Plus, Save, Upload, Eye, Briefcase, Edit2, Trash2 } from 'lucide-react';

interface ScreenAdminProps {
  cargosCache: any[];
  onOpenCardModal: (card: CardState) => void;
}

export const ScreenAdmin: React.FC<ScreenAdminProps> = ({
  cargosCache,
  onOpenCardModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Administrativo[]>([]);
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
  const [cargo, setCargo] = useState(cargosCache[0]?.cargo || 'ÁRBITRO');
  const [fnac, setFnac] = useState('');
  const [fotoName, setFotoName] = useState('ninguna');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');

  const fotoInputRef = useRef<HTMLInputElement>(null);

  function esNombreValido(str: string): boolean {
    return /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/.test(str.trim()) && str.trim().length > 0;
  }

  const generarCardStateAdmin = (adm: Administrativo): CardState => {
    const cargoObj = cargosCache.find((c) => c.cargo === adm.ClubCargo);

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
      categoria: adm.Categoria || '',
      showCategoria: false,
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
    setCargo(adm.ClubCargo || (cargosCache[0]?.cargo || 'ÁRBITRO'));
    setFnac(isoADmy(adm.FechaNacimiento));
    setFotoName(adm.FotoArchivo ? 'foto actual (sin cambios)' : 'ninguna');
    setFotoBase64(null);
    setStatus({ msg: 'Registro cargado en formulario.', kind: 'ok' });
  };

  const handleBuscar = async () => {
    const q = searchQuery.trim();
    setSearchResults([]);
    if (!q) {
      setStatus({ msg: 'Escribe un documento o apellido para buscar.', kind: 'err' });
      return;
    }
    setStatus({ msg: 'Buscando en árbitros…', kind: 'loading' });
    try {
      const { data, error } = await sb
        .from('administrativos')
        .select('*')
        .or(`numero_documento.ilike.%${q}%,apellidos.ilike.%${q}%,nombres.ilike.%${q}%`)
        .limit(20);

      if (error) throw error;
      const list = (data || []).map(adminRowToJs);
      if (!list.length) {
        setStatus({ msg: 'Sin resultados.', kind: 'err' });
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
    setCargo(cargosCache[0]?.cargo || 'DIRECTIVO');
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

      const data: Administrativo = {
        TipoDocumento: tipoDoc,
        NumeroDocumento: doc,
        Apellidos: apellidos.trim().toUpperCase(),
        Nombres: nombres.trim().toUpperCase(),
        Tipo: 'Administrativo',
        ClubCargo: cargo,
        Categoria: '',
        Estado: '',
        FechaNacimiento: fechaIso,
        FotoArchivo: fotoUrl,
        LogoArchivo: null,
      };

      const { error } = await sb.from('administrativos').upsert(adminJsToRow(data));
      if (error) throw error;

      setStatus({ msg: '¡Árbitro guardado exitosamente!', kind: 'ok' });
      handleNuevo();
    } catch (err: any) {
      setStatus({ msg: 'Error al guardar: ' + err.message, kind: 'err' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Distribución equilibrada en 2 columnas (evita ventana larga) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda (6 cols): Buscador y Lista de Árbitros (Div principal #f4f4f2) */}
        <div className="lg:col-span-6 bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#e11d2e]" />
              Directorio de Árbitros
            </h2>
            <button
              onClick={handleNuevo}
              className="file-btn text-xs py-1 px-2.5 bg-[#e11d2e] hover:bg-[#c81926] text-white border-none font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo
            </button>
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

          {searchResults.length > 0 && (
            <div className="space-y-2 mt-3 max-h-96 overflow-y-auto pr-1">
              {searchResults.map((r) => (
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
                    <span className="text-[11.5px] text-[#555552] font-semibold block">
                      {r.TipoDocumento}: {r.NumeroDocumento} · {r.ClubCargo}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenCardModal(generarCardStateAdmin(r))}
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
          )}
        </div>

        {/* Columna Derecha (6 cols): Formulario de Registro / Edición (Div principal #f4f4f2) */}
        <div className="lg:col-span-6 bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#dcdcd8] pb-2">
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
                <option value="Carné de extranjería">Carné de extranjería</option>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-[#1a1a1a]">
                Cargo
              </label>
              <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
                {cargosCache.map((c) => (
                  <option key={c.cargo} value={c.cargo}>
                    {c.cargo}
                  </option>
                ))}
              </select>
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

            {/* Miniatura de la foto luego de subir foto */}
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
      </div>
    </div>
  );
};
