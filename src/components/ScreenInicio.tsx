import React, { useEffect, useState } from 'react';
import { sb } from '../services/supabaseService';
import {
  Users,
  Shield,
  Briefcase,
  Layers,
  Search,
  Printer,
  ChevronRight,
  Info,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface ScreenInicioProps {
  irAPantalla: (nombre: string, focusSection?: string) => void;
  onOpenCardModal: () => void;
}

export const ScreenInicio: React.FC<ScreenInicioProps> = ({
  irAPantalla,
  onOpenCardModal,
}) => {
  const [stats, setStats] = useState({
    clubes: '—',
    jugadores: '—',
    admin: '—',
    categorias: '—',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [c, j, a, cat] = await Promise.all([
          sb.from('clubes').select('*', { count: 'exact', head: true }),
          sb.from('jugadores').select('*', { count: 'exact', head: true }),
          sb.from('administrativos').select('*', { count: 'exact', head: true }),
          sb.from('categorias').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          clubes: c.count !== null ? String(c.count) : '0',
          jugadores: j.count !== null ? String(j.count) : '0',
          admin: a.count !== null ? String(a.count) : '0',
          categorias: cat.count !== null ? String(cat.count) : '0',
        });
      } catch (err) {
        console.warn('Error cargando estadísticas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Banner de bienvenida y acción rápida con degradados de rojos */}
      <div className="bg-gradient-to-r from-[#800713] via-[#b3141f] via-[#d61c28] to-[#ea2434] text-white rounded-2xl p-6 shadow-md border border-[#991b1b] flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        {/* Resplandor y profundidad visual de degradado */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-16 w-56 h-56 bg-black/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider bg-black/25 text-white px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-xs">
            Plataforma Oficial
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1 text-white drop-shadow-xs">
            Impresión de Carnets · InterClubes
          </h1>
          <p className="text-xs text-red-100 mt-1 max-w-xl leading-relaxed">
            Gestión ágil de jugadores, clubes y personal administrativo para impresión a doble cara en tarjetas plásticas CR-80 (55 × 86.5 mm).
          </p>
        </div>

        <div className="relative z-10">
          <button
            onClick={onOpenCardModal}
            className="bg-white hover:bg-[#f4f4f2] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer border border-white"
          >
            <Printer className="w-4 h-4 text-[#e11d2e]" />
            <span style={{ color: '#000000' }} className="text-[#000000] font-bold">
              Ver Carnet Modelo
            </span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Estadísticas (Div principales #f4f4f2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-[#1a1a1a] block font-mono">
            {stats.clubes}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#555552] flex items-center justify-center gap-1.5 mt-1">
            <Shield className="w-3.5 h-3.5 text-[#e11d2e]" /> Clubes
          </span>
        </div>

        <div className="bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-[#1a1a1a] block font-mono">
            {stats.jugadores}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#555552] flex items-center justify-center gap-1.5 mt-1">
            <Users className="w-3.5 h-3.5 text-[#e11d2e]" /> Jugadores
          </span>
        </div>

        <div className="bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-[#1a1a1a] block font-mono">
            {stats.admin}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#555552] flex items-center justify-center gap-1.5 mt-1">
            <Briefcase className="w-3.5 h-3.5 text-[#e11d2e]" /> Árbitros
          </span>
        </div>

        <div className="bg-[#f4f4f2] border border-[#dcdcd8] p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-[#1a1a1a] block font-mono">
            {stats.categorias}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#555552] flex items-center justify-center gap-1.5 mt-1">
            <Layers className="w-3.5 h-3.5 text-[#e11d2e]" /> Categorías
          </span>
        </div>
      </div>

      {/* Módulos Principales de Acceso Rápido (Div principales #f4f4f2) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#555552] mb-3">
          Módulos y Operaciones Principales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => irAPantalla('buscar')}
            className="bg-[#f4f4f2] border border-[#dcdcd8] hover:border-[#e11d2e] p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-[#dcdcd8] text-[#e11d2e] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#e11d2e] flex items-center justify-between">
              <span>Búsqueda Rápida</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-[#555552] mt-1 leading-relaxed">
              Busca por DNI, apellidos o nombres con vista previa directa en pantalla.
            </p>
          </div>

          <div
            onClick={() => irAPantalla('club')}
            className="bg-[#f4f4f2] border border-[#dcdcd8] hover:border-[#e11d2e] p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-[#dcdcd8] text-[#e11d2e] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#e11d2e] flex items-center justify-between">
              <span>Roster de Clubes</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-[#555552] mt-1 leading-relaxed">
              Nómina por club, impresión individual o masiva, carga Excel y fotos.
            </p>
          </div>

          <div
            onClick={() => irAPantalla('admin')}
            className="bg-[#f4f4f2] border border-[#dcdcd8] hover:border-[#e11d2e] p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-[#dcdcd8] text-[#e11d2e] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#e11d2e] flex items-center justify-between">
              <span>Árbitros</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-[#555552] mt-1 leading-relaxed">
              Carnés para árbitros, presidentes de mesa y directivos
            </p>
          </div>

          <div
            onClick={() => irAPantalla('config', 'gestion-clubes')}
            className="bg-[#f4f4f2] border border-[#dcdcd8] hover:border-[#e11d2e] p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-[#dcdcd8] text-[#e11d2e] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#e11d2e] flex items-center justify-between">
              <span>Gestión de Clubes</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-[#555552] mt-1 leading-relaxed">
              Ubicada en Config: crear clubes, subir logos y asignar categorías.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta Informativa de Buenas Prácticas de Impresión (Div principales #f4f4f2) */}
      <div className="bg-[#f4f4f2] border border-[#dcdcd8] rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-[#1a1a1a] text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#e11d2e]" />
            <span>Optimizador de Impresión Zebra ZC300</span>
          </div>
          <p className="text-[#555552]">
            Formato estándar <strong>CR-80 (55 × 86.5 mm)</strong> vertical con márgenes en 0 y doble cara automática activada en el controlador.
          </p>
        </div>

        <button
          onClick={onOpenCardModal}
          className="whitespace-nowrap px-4 py-2 bg-white hover:bg-[#e9e9e6] text-[#1a1a1a] border border-[#dcdcd8] rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#e11d2e]" />
          <span>Calibrar Niveladores</span>
        </button>
      </div>
    </div>
  );
};
