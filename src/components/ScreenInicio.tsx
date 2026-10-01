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
      {/* Banner de bienvenida y acción rápida */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            Plataforma Oficial
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Interclubes · Impresión de Carnets Zebra ZC300
          </h1>
          <p className="text-xs text-red-100 mt-1 max-w-xl">
            Gestión ágil de jugadores, clubes y personal administrativo para impresión a doble cara en tarjetas plásticas CR-80 (55 × 86.5 mm).
          </p>
        </div>

        <button
          onClick={onOpenCardModal}
          className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-red-600" />
          <span>Ver Carnet Modelo</span>
        </button>
      </div>

      {/* Tarjetas de Métricas Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 block font-mono">
            {stats.clubes}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mt-1">
            <Shield className="w-3.5 h-3.5" /> Clubes
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 block font-mono">
            {stats.jugadores}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mt-1">
            <Users className="w-3.5 h-3.5" /> Jugadores
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 block font-mono">
            {stats.admin}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mt-1">
            <Briefcase className="w-3.5 h-3.5" /> Administrativos
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs text-center">
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 block font-mono">
            {stats.categorias}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mt-1">
            <Layers className="w-3.5 h-3.5" /> Categorías
          </span>
        </div>
      </div>

      {/* Módulos Principales de Acceso Rápido */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Módulos y Operaciones Principales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => irAPantalla('buscar')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
              <span>Búsqueda Rápida</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Busca por DNI, apellidos o nombres con vista previa directa en pantalla.
            </p>
          </div>

          <div
            onClick={() => irAPantalla('club')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-between">
              <span>Roster de Clubes</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Nómina por club, impresión individual o masiva, carga Excel y fotos.
            </p>
          </div>

          <div
            onClick={() => irAPantalla('admin')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-between">
              <span>Administrativos</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Carnets especializados sin logo central para directivos, staff y delegados.
            </p>
          </div>

          <div
            onClick={() => irAPantalla('config', 'gestion-clubes')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 p-4 rounded-xl shadow-xs cursor-pointer transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between">
              <span>Gestión de Clubes</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Ubicada en Config: crear clubes, subir logos y asignar categorías.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta Informativa de Buenas Prácticas de Impresión */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Optimizador de Impresión Zebra ZC300</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Formato estándar <strong>CR-80 (55 × 86.5 mm)</strong> vertical con márgenes en 0 y doble cara automática activada en el controlador.
          </p>
        </div>

        <button
          onClick={onOpenCardModal}
          className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-red-600" />
          <span>Calibrar Niveladores</span>
        </button>
      </div>
    </div>
  );
};
