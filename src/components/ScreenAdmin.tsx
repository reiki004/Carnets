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
import { Search, Plus, Save, Upload, Eye, Briefcase } from 'lucide-react';

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
  const [cargo, setCargo] = useState(cargosCache[0]?.cargo || 'DIRECTIVO');
  const [fnac, setFnac] = useState('');
  const [fotoName, setFotoName] = useState('ninguna');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');

  const fotoInputRef = useRef<HTMLInputElement>(null);

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

  const generarCardStateAdmin = (adm: Administrativo): CardState => {
    const cargoObj = cargosCache.find((c) => c.cargo === adm.ClubCargo);

    return {
      tipo: 'admin',
      apellidos: adm.Apellidos || 'APELLIDO',
      nombres: adm.Nombres || 'NOMBRE',
      clubname: adm.ClubCargo || 'DIRECTIVO',
      photoUrl: adm.FotoArchivo || DEFAULTS.photo,
      photoScale: 100,
      photoOffsetX: 0,
      photoOffsetY: 0,
      logoUrl: '',
      logoScale: 100,
      headerUrl: DEFAULTS.header,
      footerUrl: cargoObj && cargoObj.pie_url ? cargoObj.pie_url : DEFAULTS.footer,
      footerHeight: 21,
      fnac: isoADmy(adm.FechaNacimiento) || 'dd/mm/aaaa',
      dni: adm.NumeroDocumento || '00000000',
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
    setCargo(adm.ClubCargo || (cargosCache[0]?.cargo || 'DIRECTIVO'));
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
    setStatus({ msg: 'Buscando en administrativos…', kind: 'loading' });
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

      setStatus({ msg: '¡Administrativo guardado exitosamente!', kind: 'ok' });
      handleNuevo();
    } catch (err: any) {
      setStatus({ msg: 'Error al guardar: ' + err.message, kind: 'err' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Distribución equilibrada en 2 columnas (evita ventana larga) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda (6 cols): Buscador y Lista de Administrativos */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-purple-600" />
              Directorio Administrativo
            </h2>
            <button
              onClick={handleNuevo}
              className="file-btn text-xs py-1 px-2.5"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo
            </button>
          </div>

          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Buscar (DNI o apellidos)
          </label>
          <div className="file-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="Ej. 07557840 o Flores"
              className="flex-1 text-xs"
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
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2"
                >
                  <div
                    onClick={() => cargarAdminEnFormulario(r)}
                    className="cursor-pointer flex-1"
                  >
                    <b className="text-xs text-black font-extrabold block">
                      {r.Apellidos} {r.Nombres}
                    </b>
                    <span className="text-[11.5px] text-black font-bold block">
                      {r.TipoDocumento}: {r.NumeroDocumento} · {r.ClubCargo}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenCardModal(generarCardStateAdmin(r))}
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md"
                    title="Ver carnet emergente / Imprimir"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha (6 cols): Formulario de Registro / Edición */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {editingAdmin
                ? `✎ Editando: ${editingAdmin.Apellidos} ${editingAdmin.Nombres}`
                : '＋ Registrar Administrativo'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipo documento
              </label>
              <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                <option value="DNI">DNI</option>
                <option value="Carné de extranjería">Carné de extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
              <span className="file-name text-xs">{fotoName}</span>
            </div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleFoto}
              className="hidden"
            />
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
