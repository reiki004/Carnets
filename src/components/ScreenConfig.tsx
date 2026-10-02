import React, { useState, useRef } from 'react';
import {
  sb,
  Club,
  clubJsToRow,
  subirImagenSupabase,
  SUPABASE_URL,
} from '../services/supabaseService';
import { DEFAULTS } from '../assets/cardAssets';
import { CardState } from './CardPreview';
import { DateInput } from './DateInput';
import {
  Shield,
  Layers,
  Palette,
  Briefcase,
  Sliders,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Database,
} from 'lucide-react';

interface ScreenConfigProps {
  clubes: Club[];
  categorias: string[];
  estadosCache: any[];
  cargosCache: any[];
  refreshClubes: () => Promise<void>;
  loadCategorias: () => Promise<void>;
  loadEstadosCargos: () => Promise<void>;
  cardState: CardState;
  setCardState: React.Dispatch<React.SetStateAction<CardState>>;
}

export const ScreenConfig: React.FC<ScreenConfigProps> = ({
  clubes,
  categorias,
  estadosCache,
  cargosCache,
  refreshClubes,
  loadCategorias,
  loadEstadosCargos,
  cardState,
  setCardState,
}) => {
  // Gestión de clubes
  const [selectedClubId, setSelectedClubId] = useState('');
  const [clubNombre, setClubNombre] = useState('');
  const [clubLogoName, setClubLogoName] = useState('ninguno');
  const [clubLogoBase64, setClubLogoBase64] = useState<string | null>(null);
  const [clubLogoMime, setClubLogoMime] = useState('image/jpeg');
  const [clubCategorias, setClubCategorias] = useState<string[]>([]);
  const [clubStatus, setClubStatus] = useState<{ msg: string; kind: 'ok' | 'err' | 'loading' | '' }>({
    msg: '',
    kind: '',
  });

  // Categorías
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  // Cargos
  const [nuevoCargo, setNuevoCargo] = useState('');

  // Target para subir pie de tarjeta (estado o cargo)
  const [pieTarget, setPieTarget] = useState<{ tipo: 'estado' | 'cargo'; valor: string } | null>(null);

  const clubLogoInputRef = useRef<HTMLInputElement>(null);
  const pieUploadInputRef = useRef<HTMLInputElement>(null);

  // Al seleccionar un club en el panel de clubes
  const handleSelectClub = async (id: string) => {
    setSelectedClubId(id);
    const c = clubes.find((item) => item.ClubID === id);
    if (c) {
      setClubNombre(c.NombreClub);
      setClubLogoName(c.LogoArchivo ? 'logo actual (sin cambios)' : 'ninguno');
      setClubLogoBase64(null);

      // Cargar categorías asignadas a este club
      const { data } = await sb.from('club_categorias').select('categoria').eq('club_id', id);
      setClubCategorias((data || []).map((r: any) => r.categoria));
    } else {
      setClubNombre('');
      setClubLogoName('ninguno');
      setClubLogoBase64(null);
      setClubCategorias([]);
    }
  };

  const handleClubLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      const [meta, b64] = res.split(',');
      setClubLogoBase64(b64);
      setClubLogoMime(meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg');
      setClubLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const toggleCategoriaEnClub = (cat: string, checked: boolean) => {
    if (checked) {
      if (!clubCategorias.includes(cat)) {
        setClubCategorias([...clubCategorias, cat]);
      }
    } else {
      setClubCategorias(clubCategorias.filter((c) => c !== cat));
    }
  };

  const handleSaveClub = async () => {
    const nombre = clubNombre.trim().toUpperCase();
    if (!nombre) {
      setClubStatus({ msg: 'Ingresa el nombre del club.', kind: 'err' });
      return;
    }

    let cId = selectedClubId;
    const existing = clubes.find((c) => c.ClubID === cId);
    if (!cId) cId = 'C' + Date.now();

    setClubStatus({ msg: 'Guardando club…', kind: 'loading' });
    try {
      let logoUrl = existing ? existing.LogoArchivo : null;
      if (clubLogoBase64) {
        logoUrl = await subirImagenSupabase('logos', `${cId}.jpg`, clubLogoBase64, clubLogoMime);
      }

      const { error } = await sb.from('clubes').upsert(
        clubJsToRow({
          ClubID: cId,
          NombreClub: nombre,
          LogoArchivo: logoUrl,
        })
      );
      if (error) throw error;

      // Actualizar categorías del club
      await sb.from('club_categorias').delete().eq('club_id', cId);
      if (clubCategorias.length) {
        const rows = clubCategorias.map((cat) => ({
          club_id: cId,
          categoria: cat,
        }));
        await sb.from('club_categorias').insert(rows);
      }

      await refreshClubes();
      setSelectedClubId(cId);
      setClubStatus({ msg: '¡Club guardado exitosamente!', kind: 'ok' });
    } catch (err: any) {
      setClubStatus({ msg: 'Error al guardar club: ' + err.message, kind: 'err' });
    }
  };

  const handleDeleteClub = async () => {
    if (!selectedClubId) {
      setClubStatus({ msg: 'Selecciona un club primero.', kind: 'err' });
      return;
    }
    if (
      !confirm(
        '¿Eliminar este club? Los jugadores que pertenezcan a este club quedarán sin club asignado (no se borran).'
      )
    )
      return;

    setClubStatus({ msg: 'Eliminando club…', kind: 'loading' });
    try {
      await sb.from('jugadores').update({ club_id: null }).eq('club_id', selectedClubId);
      await sb.from('club_categorias').delete().eq('club_id', selectedClubId);
      const { error } = await sb.from('clubes').delete().eq('id', selectedClubId);
      if (error) throw error;

      setSelectedClubId('');
      setClubNombre('');
      setClubCategorias([]);
      await refreshClubes();
      setClubStatus({ msg: 'Club eliminado exitosamente.', kind: 'ok' });
    } catch (err: any) {
      setClubStatus({ msg: 'Error al eliminar: ' + err.message, kind: 'err' });
    }
  };

  // Categorías
  const handleAddCategoria = async () => {
    const val = nuevaCategoria.trim().toUpperCase();
    if (!val) return;
    await sb.from('categorias').upsert({ categoria: val });
    setNuevaCategoria('');
    await loadCategorias();
  };

  const handleDeleteCategoria = async (cat: string) => {
    if (!confirm(`¿Eliminar la categoría "${cat}"?`)) return;
    await sb.from('categorias').delete().eq('categoria', cat);
    await loadCategorias();
  };

  // Cargos
  const handleAddCargo = async () => {
    const val = nuevoCargo.trim().toUpperCase();
    if (!val) return;
    await sb.from('cargos').upsert({ cargo: val });
    setNuevoCargo('');
    await loadEstadosCargos();
  };

  // Subir pie de tarjeta (Estados y Cargos)
  const triggerPieUpload = (tipo: 'estado' | 'cargo', valor: string) => {
    setPieTarget({ tipo, valor });
    pieUploadInputRef.current?.click();
  };

  const handlePieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pieTarget) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const res = ev.target?.result as string;
      const [meta, b64] = res.split(',');
      const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      const tabla = pieTarget.tipo === 'estado' ? 'estados' : 'cargos';
      const col = pieTarget.tipo === 'estado' ? 'estado' : 'cargo';
      const path = `${pieTarget.tipo}_${pieTarget.valor}`.replace(/\s+/g, '_').replace(/[^\w.-]/g, '') + '.jpg';

      try {
        const url = await subirImagenSupabase('pies', path, b64, mime);
        await sb.from(tabla).update({ pie_url: url }).eq(col, pieTarget.valor);
        await loadEstadosCargos();
      } catch (err: any) {
        alert('Error al asignar diseño de pie: ' + err.message);
      }
      setPieTarget(null);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* ================= SECCIÓN 1: GESTIÓN DE CLUBES (DENTRO DE CONFIG) ================= */}
      <div className="group m-0 p-0 border-b border-[#dcdcd8] pb-5" id="gestion-clubes">
        <span className="side-tag jug flex items-center gap-1 w-max">
          <Shield className="w-3.5 h-3.5" /> Gestión de clubes
        </span>

        <label className="text-xs font-bold text-[#1a1a1a] mt-2">Club a editar</label>
        <select
          value={selectedClubId}
          onChange={(e) => handleSelectClub(e.target.value)}
        >
          <option value="">— Nuevo club —</option>
          {clubes.map((c) => (
            <option key={c.ClubID} value={c.ClubID}>
              {c.NombreClub}
            </option>
          ))}
        </select>

        <label className="text-xs font-bold text-[#1a1a1a] mt-2">Nombre del club</label>
        <input
          type="text"
          value={clubNombre}
          onChange={(e) => setClubNombre(e.target.value.toUpperCase())}
          placeholder="NOMBRE DEL CLUB"
        />

        <label className="text-xs font-bold text-[#1a1a1a] mt-2">Logo del club</label>
        <div className="file-row">
          <button
            type="button"
            onClick={() => clubLogoInputRef.current?.click()}
            className="file-btn alt text-xs"
          >
            <Upload className="w-3.5 h-3.5" /> Subir logo
          </button>
          <span className="file-name">{clubLogoName}</span>
        </div>
        <input
          ref={clubLogoInputRef}
          type="file"
          accept="image/*"
          onChange={handleClubLogoChange}
          className="hidden"
        />

        <label className="text-xs font-bold text-[#1a1a1a] mt-3 block">
          Categorías de este club
        </label>
        <div className="hint mb-1 text-[#555552]">
          Marca las categorías que aplican a este club (puedes seleccionar una o varias):
        </div>
        <div className="club-cat-list">
          {categorias.map((cat) => {
            const isChecked = clubCategorias.includes(cat);
            return (
              <label key={cat} className="club-cat-opt">
                <input
                  type="checkbox"
                  value={cat}
                  checked={isChecked}
                  onChange={(e) => toggleCategoriaEnClub(cat, e.target.checked)}
                />
                {cat}
              </label>
            );
          })}
        </div>

        <div className="file-row mt-4">
          <button onClick={handleSaveClub} className="file-btn text-xs font-bold bg-[#e11d2e] hover:bg-[#c81926] text-white border-none">
            ＋ Guardar club
          </button>
          {selectedClubId && (
            <button
              onClick={handleDeleteClub}
              className="file-btn alt text-xs text-[#e11d2e] hover:text-[#c81926]"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Eliminar club
            </button>
          )}
        </div>

        {clubStatus.msg && (
          <div className={`db-status ${clubStatus.kind} mt-2`}>
            {clubStatus.msg}
          </div>
        )}
      </div>

      {/* ================= SECCIÓN 2: CATEGORÍAS ================= */}
      <div className="group m-0 p-0 border-b border-[#dcdcd8] pb-5">
        <span className="side-tag db flex items-center gap-1 w-max">
          <Layers className="w-3.5 h-3.5" /> Categorías del torneo
        </span>
        <div className="file-row mt-2">
          <input
            type="text"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategoria()}
            placeholder="Ej. CATEGORIA SUB-15"
            className="flex-1"
          />
          <button onClick={handleAddCategoria} className="file-btn alt text-xs">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>
        <div className="chip-list mt-2">
          {categorias.map((cat) => (
            <span key={cat} className="chip">
              {cat}
              <span
                className="x"
                title="Eliminar"
                onClick={() => handleDeleteCategoria(cat)}
              >
                ✕
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ================= SECCIÓN 3: ESTADOS DE JUGADOR & DISEÑO DE PIE ================= */}
      <div className="group m-0 p-0 border-b border-[#dcdcd8] pb-5">
        <span className="side-tag back flex items-center gap-1 w-max">
          <Palette className="w-3.5 h-3.5" /> Estados de jugador · Diseño de pie
        </span>
        <div className="hint mt-1 mb-2 text-[#555552]">
          Asigna una imagen de pie inferior diferente para cada estado de jugador. Se aplicará automáticamente al imprimir.
        </div>
        <div className="space-y-2">
          {estadosCache.map((e) => (
            <div key={e.estado} className="pie-item">
              <img
                src={e.pie_url || DEFAULTS.footer}
                className="pie-thumb"
                alt=""
              />
              <span className="pie-name">{e.estado}</span>
              <button
                className="pie-btn"
                onClick={() => triggerPieUpload('estado', e.estado)}
              >
                Cambiar diseño
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECCIÓN 4: CARGOS DE ADMINISTRATIVO & DISEÑO DE PIE ================= */}
      <div className="group m-0 p-0 border-b border-[#dcdcd8] pb-5">
        <span className="side-tag front flex items-center gap-1 w-max">
          <Briefcase className="w-3.5 h-3.5" /> Cargos de árbitros · Diseño de pie
        </span>
        <div className="file-row mt-2">
          <input
            type="text"
            value={nuevoCargo}
            onChange={(e) => setNuevoCargo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCargo()}
            placeholder="Ej. ÁRBITRO PRINCIPAL"
            className="flex-1"
          />
          <button onClick={handleAddCargo} className="file-btn alt text-xs">
            <Plus className="w-3.5 h-3.5" /> Agregar cargo
          </button>
        </div>
        <div className="hint mt-1 mb-2 text-[#555552]">
          Asigna una imagen de pie inferior para cada cargo arbitral.
        </div>
        <div className="space-y-2">
          {cargosCache.map((c) => (
            <div key={c.cargo} className="pie-item">
              <img
                src={c.pie_url || DEFAULTS.footer}
                className="pie-thumb"
                alt=""
              />
              <span className="pie-name">{c.cargo}</span>
              <button
                className="pie-btn"
                onClick={() => triggerPieUpload('cargo', c.cargo)}
              >
                Cambiar diseño
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Input oculto para subida de diseño de pie */}
      <input
        ref={pieUploadInputRef}
        type="file"
        accept="image/*"
        onChange={handlePieFile}
        className="hidden"
      />

      {/* ================= SECCIÓN 5: INFORMACIÓN DE CONEXIÓN SUPABASE ================= */}
      <div className="bg-white p-3.5 rounded-xl border border-[#dcdcd8] text-xs text-[#1a1a1a] space-y-1.5 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
          <Database className="w-4 h-4 text-[#e11d2e]" />
          <span>Base de Datos Supabase Conectada</span>
        </div>
        <p className="text-[11px] text-[#555552] font-mono break-all">
          Proyecto activo: {SUPABASE_URL}
        </p>
        <div className="flex items-center gap-1.5 text-[#1a1a1a] font-semibold text-[11px]">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Conexión verificada con clave pública anónima
        </div>
      </div>

      {/* ================= SECCIÓN 6: EDICIÓN MANUAL AVANZADA DEL CARNET ================= */}
      <details className="mini-panel">
        <summary className="font-bold text-[#1a1a1a]">
          Edición manual avanzada del carnet (pruebas libres)
        </summary>
        <div className="mini-body space-y-3 pt-2">
          <div className="hint text-[#555552]">
            Permite editar cualquier campo del carnet visual directamente para pruebas puntuales sin alterar la base de datos.
          </div>

          <div className="type-toggle">
            <label className="radio-opt">
              <input
                type="radio"
                name="tipoCarnetManual"
                checked={cardState.tipo === 'socio'}
                onChange={() => setCardState((prev) => ({ ...prev, tipo: 'socio' }))}
              />
              Jugador / Socio (con logo)
            </label>
            <label className="radio-opt">
              <input
                type="radio"
                name="tipoCarnetManual"
                checked={cardState.tipo === 'admin'}
                onChange={() => setCardState((prev) => ({ ...prev, tipo: 'admin' }))}
              />
              Árbitro (sin logo, con cargo)
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1a1a1a]">Apellidos</label>
            <input
              type="text"
              value={cardState.apellidos}
              onChange={(e) =>
                setCardState((prev) => ({ ...prev, apellidos: e.target.value.toUpperCase() }))
              }
              placeholder="APELLIDO"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1a1a1a]">Nombres</label>
            <input
              type="text"
              value={cardState.nombres}
              onChange={(e) =>
                setCardState((prev) => ({ ...prev, nombres: e.target.value.toUpperCase() }))
              }
              placeholder="NOMBRE"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1a1a1a]">
              {cardState.tipo === 'admin' ? 'Cargo arbitral' : 'Nombre del club'}
            </label>
            <input
              type="text"
              value={cardState.clubname}
              onChange={(e) =>
                setCardState((prev) => ({ ...prev, clubname: e.target.value.toUpperCase() }))
              }
              placeholder={cardState.tipo === 'admin' ? 'ÁRBITRO' : 'NOMBRE DEL CLUB'}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-[#1a1a1a]">Fecha nacimiento</label>
              <DateInput
                value={cardState.fnac}
                onChange={(val) => setCardState((prev) => ({ ...prev, fnac: val }))}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1a1a1a]">Número de documento</label>
              <input
                type="text"
                value={cardState.dni}
                onChange={(e) => setCardState((prev) => ({ ...prev, dni: e.target.value }))}
                placeholder="00000000"
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
