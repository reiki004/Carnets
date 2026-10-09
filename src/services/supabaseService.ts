import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://wxxfogljhgpmvyezapxn.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eGZvZ2xqaGdwbXZ5ZXphcHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MzY4MDAsImV4cCI6MjEwNTUxMjgwMH0.dLZRgLRJl5HGer5FiZWFV_ifZ-BrgGahTDRF4JHBZMY';

export const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Club {
  ClubID: string;
  NombreClub: string;
  LogoArchivo: string | null;
}

export interface Jugador {
  NumeroDocumento: string;
  TipoDocumento: string;
  Apellidos: string;
  Nombres: string;
  FechaNacimiento: string | null;
  ClubID: string | null;
  Categoria: string | null;
  Categoria2: string | null;
  Estado: string | null;
  FotoArchivo: string | null;
  __tipo?: 'jugador';
  __clubId?: string | null;
  __categoriaResuelta?: string | null;
  __estadoResuelto?: string | null;
  __motivos?: string[];
}

export interface Administrativo {
  NumeroDocumento: string;
  TipoDocumento: string;
  Apellidos: string;
  Nombres: string;
  Tipo: string;
  ClubCargo: string;
  Categoria?: string | null;
  Terna?: string | null;
  Estado?: string | null;
  FechaNacimiento: string | null;
  FotoArchivo: string | null;
  LogoArchivo: string | null;
  __tipo?: 'admin';
}

export interface EstadoPie {
  estado: string;
  pie_url: string | null;
}

export interface CargoPie {
  cargo: string;
  pie_url: string | null;
}

export interface ClubCategoria {
  club_id: string;
  categoria: string;
}

export const ESTADOS_FIJOS = [
  'SOCIO',
  'INVITADO',
  'SOCIO EXPROFESIONAL',
  'INVITADO EXPROFESIONAL',
  'FEDERADA',
];

export function normalizarEstado(est: string | null | undefined): string {
  const s = String(est || '').trim().toUpperCase();
  if (s === 'SOCIO EX PROFESIONAL' || s === 'SOCIO EXPROFESIONAL') return 'SOCIO EXPROFESIONAL';
  if (s === 'INVITADO EX PROFESIONAL' || s === 'INVITADO EXPROFESIONAL') return 'INVITADO EXPROFESIONAL';
  return s || 'SOCIO';
}

export function normalizarTipoDoc(tipo: any): string {
  const s = String(tipo || 'DNI').trim();
  const lower = s.toLowerCase();
  if (
    lower.includes('extranj') ||
    lower === 'ce' ||
    lower === 'c.e.' ||
    lower === 'c.e' ||
    s.toUpperCase() === 'CE'
  ) {
    return 'CE';
  }
  if (lower === 'pasaporte') return 'Pasaporte';
  return s || 'DNI';
}

export function extraerDniDeNombre(fileName: string): string {
  const sinExt = fileName.replace(/\.[^.]+$/, '').trim();
  // 1. Busca secuencia de exactamente 8 dígitos seguidos (DNI estándar)
  const match8 = sinExt.match(/\b\d{8}\b/) || sinExt.match(/\d{8}/);
  if (match8) return match8[0];
  // 2. Busca entre 6 y 12 dígitos
  const matchDigits = sinExt.match(/\d{6,12}/);
  if (matchDigits) return matchDigits[0];
  // 3. Fallback: remover caracteres especiales y espacios
  return sinExt.replace(/[^A-Za-z0-9]/g, '').trim();
}

export interface CoincidenciaFotoDoc {
  row: any;
  exactDoc: string;
  nombreCompleto: string;
  tabla: 'jugadores' | 'administrativos';
  clubId?: string | null;
}

export function encontrarCoincidenciaDoc(
  fileName: string,
  dbRows: any[]
): CoincidenciaFotoDoc | null {
  const sinExt = fileName.replace(/\.[^.]+$/, '').trim();
  const rawDigits = sinExt.replace(/\D/g, '');
  const extracted = extraerDniDeNombre(fileName);

  for (const row of dbRows) {
    const dbDoc = String(row.numero_documento || row.NumeroDocumento || '').trim();
    if (!dbDoc) continue;
    const dbDigits = dbDoc.replace(/\D/g, '');
    const nombreCompleto = `${row.apellidos || row.Apellidos || ''} ${row.nombres || row.Nombres || ''}`.trim();
    const tabla: 'jugadores' | 'administrativos' =
      row.__tabla || (row.club_cargo !== undefined || row.ClubCargo !== undefined || row.tipo === 'Administrativo' ? 'administrativos' : 'jugadores');
    const clubId = row.club_id || row.ClubID || null;

    // 1. Coincidencia exacta de texto (ej. "45724229" o "08749999")
    if (sinExt.toLowerCase() === dbDoc.toLowerCase()) {
      return { row, exactDoc: dbDoc, nombreCompleto, tabla, clubId };
    }
    // 2. Coincidencia exacta de dígitos
    if (rawDigits && rawDigits === dbDigits) {
      return { row, exactDoc: dbDoc, nombreCompleto, tabla, clubId };
    }
    // 3. Coincidencia mediante extraerDniDeNombre
    if (extracted && (extracted.toLowerCase() === dbDoc.toLowerCase() || extracted === dbDigits)) {
      return { row, exactDoc: dbDoc, nombreCompleto, tabla, clubId };
    }
    // 4. Coincidencia ignorando ceros a la izquierda (ej. "7557840" con "07557840")
    const strip0Db = dbDigits.replace(/^0+/, '');
    const strip0File = rawDigits.replace(/^0+/, '');
    if (strip0Db && strip0Db === strip0File) {
      return { row, exactDoc: dbDoc, nombreCompleto, tabla, clubId };
    }
    // 5. Coincidencia rellenando a 8 dígitos con ceros a la izquierda
    if (rawDigits.length > 0 && rawDigits.padStart(8, '0') === dbDigits.padStart(8, '0')) {
      return { row, exactDoc: dbDoc, nombreCompleto, tabla, clubId };
    }
    // 6. Subcadena en el nombre del archivo (ej. "FOTO_DNI_45724229_2024.jpg")
    if (dbDigits.length >= 6 && sinExt.includes(dbDigits)) {
      return { row, exactDoc: dbDoc, nombreCompleto, tabla, clubId };
    }
  }
  return null;
}

// Convertidores entre snake_case de Supabase y CamelCase usado en la UI
export function clubRowToJs(row: any): Club {
  return {
    ClubID: row.id,
    NombreClub: row.nombre_club,
    LogoArchivo: row.logo_url || null,
  };
}

export function clubJsToRow(o: Club): any {
  return {
    id: o.ClubID,
    nombre_club: o.NombreClub,
    logo_url: o.LogoArchivo || null,
  };
}

export function jugadorRowToJs(row: any): Jugador {
  return {
    NumeroDocumento: String(row.numero_documento || ''),
    TipoDocumento: normalizarTipoDoc(row.tipo_documento),
    Apellidos: row.apellidos || '',
    Nombres: row.nombres || '',
    FechaNacimiento: row.fecha_nacimiento || null,
    ClubID: row.club_id || null,
    Categoria: row.categoria || null,
    Categoria2: row.categoria2 || null,
    Estado: normalizarEstado(row.estado),
    FotoArchivo: row.foto_url || null,
  };
}

export function jugadorJsToRow(o: Jugador): any {
  return {
    numero_documento: o.NumeroDocumento,
    tipo_documento: normalizarTipoDoc(o.TipoDocumento),
    apellidos: o.Apellidos,
    nombres: o.Nombres,
    fecha_nacimiento: o.FechaNacimiento || null,
    club_id: o.ClubID || null,
    categoria: o.Categoria || null,
    categoria2: o.Categoria2 || null,
    estado: o.Estado || null,
    foto_url: o.FotoArchivo || null,
  };
}

export function adminRowToJs(row: any): Administrativo {
  return {
    NumeroDocumento: String(row.numero_documento || ''),
    TipoDocumento: normalizarTipoDoc(row.tipo_documento),
    Apellidos: row.apellidos || '',
    Nombres: row.nombres || '',
    Tipo: row.tipo || 'Administrativo',
    ClubCargo: row.club_cargo || '',
    Categoria: row.categoria || null,
    Terna: row.terna || row.categoria || null,
    Estado: row.estado || null,
    FechaNacimiento: row.fecha_nacimiento || null,
    FotoArchivo: row.foto_url || null,
    LogoArchivo: row.logo_url || null,
  };
}

export function adminJsToRow(o: Administrativo): any {
  const row: any = {
    numero_documento: o.NumeroDocumento,
    tipo_documento: normalizarTipoDoc(o.TipoDocumento),
    apellidos: o.Apellidos,
    nombres: o.Nombres,
    tipo: o.Tipo || 'Administrativo',
    club_cargo: o.ClubCargo,
    categoria: o.Terna || o.Categoria || null,
    estado: o.Estado || null,
    fecha_nacimiento: o.FechaNacimiento || null,
    foto_url: o.FotoArchivo || null,
    logo_url: o.LogoArchivo || null,
  };
  return row;
}

const LOCAL_TERNAS_KEY = 'interclubes_ternas_cache';

export async function fetchTernasSupabase(): Promise<string[]> {
  const set = new Set<string>();

  // 1. Intentar cargar desde tabla dedicada 'ternas' si existe en Supabase
  try {
    const { data, error } = await sb.from('ternas').select('terna').order('terna');
    if (!error && data && data.length > 0) {
      data.forEach((r: any) => {
        const val = String(r.terna || '').trim().toUpperCase();
        if (val) set.add(val);
      });
    }
  } catch (err) {}

  // 2. Cargar ternas ya registradas en la columna categoria de la tabla administrativos
  try {
    const { data: admData } = await sb
      .from('administrativos')
      .select('categoria')
      .not('categoria', 'is', null)
      .limit(100);
    if (admData) {
      admData.forEach((r: any) => {
        const val = String(r.categoria || '').trim().toUpperCase();
        if (val) set.add(val);
      });
    }
  } catch (err) {}

  // 3. Cargar desde localStorage
  const saved = localStorage.getItem(LOCAL_TERNAS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          const val = String(item || '').trim().toUpperCase();
          if (val) set.add(val);
        });
      }
    } catch {}
  }

  // Valores predeterminados si aún no hay ninguna
  if (set.size === 0) {
    ['TERNA 1', 'TERNA 2', 'TERNA 3'].forEach((t) => set.add(t));
  }

  const list = Array.from(set).sort();
  localStorage.setItem(LOCAL_TERNAS_KEY, JSON.stringify(list));
  return list;
}

export async function insertTernaSupabase(ternaName: string): Promise<void> {
  const t = ternaName.trim().toUpperCase();
  if (!t) return;

  try {
    await sb.from('ternas').insert([{ terna: t }]);
  } catch (err) {}

  const current = await fetchTernasSupabase();
  if (!current.includes(t)) {
    const next = [...current, t].sort();
    localStorage.setItem(LOCAL_TERNAS_KEY, JSON.stringify(next));
  }
}

export async function deleteTernaSupabase(ternaName: string): Promise<void> {
  const t = ternaName.trim().toUpperCase();
  try {
    await sb.from('ternas').delete().eq('terna', t);
  } catch (err) {}

  const current = await fetchTernasSupabase();
  const next = current.filter((item) => item !== t);
  localStorage.setItem(LOCAL_TERNAS_KEY, JSON.stringify(next));
}

/**
 * Sube una imagen (base64 o File/Blob) al bucket de Supabase indicado
 */
export async function subirImagenSupabase(
  bucket: string,
  path: string,
  dataOrBase64: string | Blob | File,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    let body: BodyInit;
    if (typeof dataOrBase64 === 'string') {
      const cleanB64 = dataOrBase64.includes(',') ? dataOrBase64.split(',')[1] : dataOrBase64;
      const sanitized = cleanB64.trim().replace(/\s/g, '');
      const binary = atob(sanitized);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      body = bytes;
    } else {
      body = dataOrBase64;
    }

    const { error } = await sb.storage.from(bucket).upload(path, body, {
      contentType: mimeType,
      upsert: true,
    });
    if (error) {
      console.error(`Error de Supabase storage al subir ${path}:`, error);
      throw error;
    }

    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    // Añadir timestamp para evitar que la caché del navegador retenga fotos viejas
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (err: any) {
    console.error('Error subiendo imagen a Supabase Storage:', err);
    throw err;
  }
}

/**
 * Obtiene todos los jugadores y administrativos registrados para emparejamiento inteligente de fotos
 */
export async function obtenerTodosParaFotos(): Promise<Array<{
  numero_documento: string;
  apellidos: string;
  nombres: string;
  club_id?: string | null;
  club_cargo?: string | null;
  foto_url?: string | null;
  __tabla: 'jugadores' | 'administrativos';
}>> {
  const [resJug, resAdm] = await Promise.all([
    sb.from('jugadores').select('numero_documento, apellidos, nombres, club_id, foto_url').limit(5000),
    sb.from('administrativos').select('numero_documento, apellidos, nombres, club_cargo, foto_url').limit(1000),
  ]);

  const jugList = (resJug.data || []).map((j: any) => ({
    numero_documento: String(j.numero_documento || '').trim(),
    apellidos: String(j.apellidos || '').trim(),
    nombres: String(j.nombres || '').trim(),
    club_id: j.club_id || null,
    foto_url: j.foto_url || null,
    __tabla: 'jugadores' as const,
  }));

  const admList = (resAdm.data || []).map((a: any) => ({
    numero_documento: String(a.numero_documento || '').trim(),
    apellidos: String(a.apellidos || '').trim(),
    nombres: String(a.nombres || '').trim(),
    club_cargo: a.club_cargo || null,
    foto_url: a.foto_url || null,
    __tabla: 'administrativos' as const,
  }));

  return [...jugList, ...admList];
}

/**
 * Sube una foto a Supabase Storage y actualiza la fila correspondiente en la base de datos
 */
export async function subirYEnlazarFoto(
  file: File,
  exactDoc: string,
  tabla: 'jugadores' | 'administrativos'
): Promise<string> {
  const path = tabla === 'administrativos' ? `${exactDoc}_admin.jpg` : `${exactDoc}.jpg`;
  const mime = file.type || 'image/jpeg';

  // 1. Subir directamente el File/Blob a Supabase Storage (rápido y sin base64 intermedio)
  const pubUrl = await subirImagenSupabase('fotos', path, file, mime);

  // 2. Actualizar la base de datos
  let { data, error } = await sb
    .from(tabla)
    .update({ foto_url: pubUrl })
    .eq('numero_documento', exactDoc)
    .select('numero_documento, foto_url');

  if (error) {
    console.error(`Error actualizando base de datos para ${exactDoc}:`, error);
    throw error;
  }

  // Si no afectó ninguna fila, intentar variaciones con o sin ceros a la izquierda
  if (!data || data.length === 0) {
    const stripDoc = exactDoc.replace(/^0+/, '');
    if (stripDoc && stripDoc !== exactDoc) {
      const res2 = await sb
        .from(tabla)
        .update({ foto_url: pubUrl })
        .eq('numero_documento', stripDoc)
        .select('numero_documento, foto_url');
      if (res2.data && res2.data.length > 0) {
        data = res2.data;
      }
    }

    const pad8Doc = exactDoc.padStart(8, '0');
    if ((!data || data.length === 0) && pad8Doc !== exactDoc) {
      const res3 = await sb
        .from(tabla)
        .update({ foto_url: pubUrl })
        .eq('numero_documento', pad8Doc)
        .select('numero_documento, foto_url');
      if (res3.data && res3.data.length > 0) {
        data = res3.data;
      }
    }
  }

  return pubUrl;
}
