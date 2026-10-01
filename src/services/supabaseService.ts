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
    TipoDocumento: row.tipo_documento || 'DNI',
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
    tipo_documento: o.TipoDocumento || 'DNI',
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
    TipoDocumento: row.tipo_documento || 'DNI',
    Apellidos: row.apellidos || '',
    Nombres: row.nombres || '',
    Tipo: row.tipo || 'Administrativo',
    ClubCargo: row.club_cargo || '',
    Categoria: row.categoria || null,
    Estado: row.estado || null,
    FechaNacimiento: row.fecha_nacimiento || null,
    FotoArchivo: row.foto_url || null,
    LogoArchivo: row.logo_url || null,
  };
}

export function adminJsToRow(o: Administrativo): any {
  return {
    numero_documento: o.NumeroDocumento,
    tipo_documento: o.TipoDocumento || 'DNI',
    apellidos: o.Apellidos,
    nombres: o.Nombres,
    tipo: o.Tipo || 'Administrativo',
    club_cargo: o.ClubCargo,
    categoria: o.Categoria || null,
    estado: o.Estado || null,
    fecha_nacimiento: o.FechaNacimiento || null,
    foto_url: o.FotoArchivo || null,
    logo_url: o.LogoArchivo || null,
  };
}

/**
 * Sube una imagen en base64 al bucket de Supabase indicado
 */
export async function subirImagenSupabase(
  bucket: string,
  path: string,
  base64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const { error } = await sb.storage.from(bucket).upload(path, bytes, {
      contentType: mimeType,
      upsert: true,
    });
    if (error) {
      console.warn('Supabase storage upload warning:', error);
      // Fallback a dataUrl en caso de política de bucket o modo sin permisos de escritura directos
      return `data:${mimeType};base64,${base64}`;
    }
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn('Error subiendo imagen a Supabase, usando respaldo local:', err);
    return `data:${mimeType};base64,${base64}`;
  }
}
