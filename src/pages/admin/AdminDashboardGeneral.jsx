import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, AreaChart, Area
} from 'recharts';
import { 
  Users, TrendingUp, Calendar, Clock, MapPin, Target, 
  AlertTriangle, Filter, ChevronDown, Activity, Truck, Database
} from 'lucide-react';

// =========================================================================
// ⚠️ INSTRUCCIONES PARA TU ENTORNO LOCAL (VS CODE):
// 1. Borra este bloque "const supabase = { ... }"
// 2. Descomenta la línea "import { supabase }..." que está justo abajo.
// =========================================================================
import { supabase } from '../../services/supabaseClient';
// import { supabase } from '../../services/supabaseClient';


// ==========================================
// COMPONENTES DE UI EMPRESARIAL
// ==========================================

const FilterSelect = ({ icon: Icon, label, options, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={12} /> {label}
    </label>
    <div style={{ position: 'relative' }}>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          width: '100%', padding: '8px 12px', appearance: 'none', background: '#fff', 
          border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', 
          fontSize: '0.875rem', fontWeight: 500, outline: 'none', cursor: 'pointer'
        }}
      >
        <option value="ALL">Todos</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  </div>
);

const Semaforo = ({ value, thresholds, inverse = false }) => {
  let status = 'ok';
  if (inverse) {
    if (value >= thresholds.critical) status = 'critical';
    else if (value >= thresholds.warning) status = 'warning';
  } else {
    if (value <= thresholds.critical) status = 'critical';
    else if (value <= thresholds.warning) status = 'warning';
  }

  const configs = {
    ok: { color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'Óptimo' },
    warning: { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'Precaución' },
    critical: { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'Crítico' }
  };
  const current = configs[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: current.color }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: current.color, boxShadow: `0 0 8px ${current.glow}` }} />
      {current.text}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, statusValue, thresholds, inverseStatus }) => (
  <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: color }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{ background: `${color}15`, padding: '12px', borderRadius: '12px', color: color }}>
        <Icon size={24} />
      </div>
      {statusValue !== undefined && thresholds && (
        <Semaforo value={statusValue} thresholds={thresholds} inverse={inverseStatus} />
      )}
    </div>
    <div>
      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.875rem', fontWeight: 800 }}>{value}</h3>
      <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>{title}</p>
      {subtitle && <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>{subtitle}</p>}
    </div>
  </div>
);

const ProgressBar = ({ current, target, label, color = "#3b82f6" }) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>
        <span style={{ color: '#475569' }}>{label}</span>
        <span style={{ color: color }}>{current} / {target} ({percentage}%)</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.5s ease-in-out' }} />
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  // Estado para verificar conexión
  const [dbStatus, setDbStatus] = useState('Conectando a Supabase...');
  const [dbColor, setDbColor] = useState('#f59e0b');

  // Estados de Filtros
  const [filtroFecha, setFiltroFecha] = useState('Este Mes');
  const [filtroUN, setFiltroUN] = useState('ALL');
  const [filtroGeneracion, setFiltroGeneracion] = useState('ALL');
  const [filtroLider, setFiltroLider] = useState('ALL');

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        console.log("Probando conexión a la tabla 'usuarios'...");
        // ESTA ES LA CONSULTA REAL QUE SE HARÁ A TU BASE DE DATOS
        const { data, error } = await supabase.from('usuarios').select('nombre_completo, numero_empleado').limit(5);

        if (error) throw error;
        if (data) {
          setDbStatus('Base de Datos Conectada');
          setDbColor('#10b981');
          console.log("✅ ÉXITO: Datos recibidos de Supabase:", data);
        }
      } catch (err) {
        setDbStatus('Error de Conexión DB');
        setDbColor('#ef4444');
        console.error("❌ ERROR SUPABASE:", err.message);
      }
    };
    testSupabaseConnection();
  }, []);

  // Datos Base (Mock simulando Base de Datos mientras conectas todo)
  const dataAlumnos = [
    { id: 1, nombre: 'Juan Pérez', un: 'Monterrey', generacion: 'Gen 24-A', lider: 'Carlos Ruiz', kmActual: 450, kmMeta: 1000, hrsActual: 45, hrsMeta: 100, diasAsignacion: 2, diasSinManejo: 1 },
    { id: 2, nombre: 'Ana Gómez', un: 'Nuevo Laredo', generacion: 'Gen 24-A', lider: 'María Silva', kmActual: 890, kmMeta: 1000, hrsActual: 90, hrsMeta: 100, diasAsignacion: 5, diasSinManejo: 14 },
    { id: 3, nombre: 'Luis Torres', un: 'Monterrey', generacion: 'Gen 24-B', lider: 'Carlos Ruiz', kmActual: 120, kmMeta: 1000, hrsActual: 15, hrsMeta: 100, diasAsignacion: 1, diasSinManejo: 2 },
    { id: 4, nombre: 'Marta Díaz', un: 'Tijuana', generacion: 'Gen 24-A', lider: 'Jorge Ramos', kmActual: 600, kmMeta: 1000, hrsActual: 55, hrsMeta: 100, diasAsignacion: 8, diasSinManejo: 21 },
    { id: 5, nombre: 'Pedro M.', un: 'Nuevo Laredo', generacion: 'Gen 24-B', lider: 'María Silva', kmActual: 300, kmMeta: 1000, hrsActual: 28, hrsMeta: 100, diasAsignacion: 3, diasSinManejo: 5 },
  ];

  const dataDesempeno = [
    { periodo: 'Sem 1', km: 2400, horas: 210 },
    { periodo: 'Sem 2', km: 3100, horas: 280 },
    { periodo: 'Sem 3', km: 2800, horas: 250 },
    { periodo: 'Sem 4', km: 4200, horas: 390 },
  ];

  const datosFiltrados = useMemo(() => {
    return dataAlumnos.filter(a => {
      const matchUN = filtroUN === 'ALL' || a.un === filtroUN;
      const matchGen = filtroGeneracion === 'ALL' || a.generacion === filtroGeneracion;
      const matchLider = filtroLider === 'ALL' || a.lider === filtroLider;
      return matchUN && matchGen && matchLider;
    });
  }, [filtroUN, filtroGeneracion, filtroLider]);

  const kpis = useMemo(() => {
    if (datosFiltrados.length === 0) return { kmTotal: 0, hrsTotal: 0, promAsignacion: 0, promSinManejo: 0 };
    const kmTotal = datosFiltrados.reduce((acc, a) => acc + a.kmActual, 0);
    const hrsTotal = datosFiltrados.reduce((acc, a) => acc + a.hrsActual, 0);
    const promAsignacion = datosFiltrados.reduce((acc, a) => acc + a.diasAsignacion, 0) / datosFiltrados.length;
    const promSinManejo = datosFiltrados.reduce((acc, a) => acc + a.diasSinManejo, 0) / datosFiltrados.length;
    return { kmTotal, hrsTotal, promAsignacion: promAsignacion.toFixed(1), promSinManejo: promSinManejo.toFixed(1) };
  }, [datosFiltrados]);

  const dataLideres = useMemo(() => {
    const agrupado = datosFiltrados.reduce((acc, a) => {
      if (!acc[a.lider]) acc[a.lider] = { name: a.lider, km: 0, horas: 0, alumnos: 0 };
      acc[a.lider].km += a.kmActual;
      acc[a.lider].horas += a.hrsActual;
      acc[a.lider].alumnos += 1;
      return acc;
    }, {});
    return Object.values(agrupado);
  }, [datosFiltrados]);

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER & FILTROS & ESTADO DE CONEXIÓN */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Dashboard de Capacitación (OPT)
            </h1>
            <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '1rem' }}>
              Análisis dinámico de rendimiento, tiempos muertos y metas por alumno.
            </p>
          </div>

          {/* INDICADOR DE CONEXIÓN A SUPABASE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '8px 16px', borderRadius: '20px', border: `1px solid ${dbColor}50`, color: dbColor, fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Database size={16} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dbColor, boxShadow: `0 0 8px ${dbColor}` }} />
              {dbStatus}
            </div>
            <button style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
              <Filter size={16} /> Exportar Reporte
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS DINÁMICOS */}
        <div style={{ display: 'flex', gap: '16px', background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
          <FilterSelect icon={Calendar} label="Rango de Fechas" value={filtroFecha} onChange={setFiltroFecha} options={['Hoy', 'Esta Semana', 'Este Mes', 'Trimestre', 'Año Actual']} />
          <FilterSelect icon={MapPin} label="Unidad de Negocio" value={filtroUN} onChange={setFiltroUN} options={['Monterrey', 'Nuevo Laredo', 'Tijuana']} />
          <FilterSelect icon={Users} label="Generación" value={filtroGeneracion} onChange={setFiltroGeneracion} options={['Gen 24-A', 'Gen 24-B']} />
          <FilterSelect icon={Target} label="Líder Asignado" value={filtroLider} onChange={setFiltroLider} options={['Carlos Ruiz', 'María Silva', 'Jorge Ramos']} />
        </div>
      </header>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard 
          title="Promedio Asignación OPT" value={`${kpis.promAsignacion} días`} subtitle="Desde inducción hasta tener tutor"
          icon={Clock} color="#8b5cf6" statusValue={kpis.promAsignacion} thresholds={{ warning: 3, critical: 6 }} inverseStatus={true} 
        />
        <StatCard 
          title="Tiempo Muerto Promedio" value={`${kpis.promSinManejo} días`} subtitle="Días perdidos sin manejar"
          icon={AlertTriangle} color="#ef4444" statusValue={kpis.promSinManejo} thresholds={{ warning: 5, critical: 10 }} inverseStatus={true} 
        />
        <StatCard title="Kilómetros Recorridos" value={`${kpis.kmTotal.toLocaleString()} km`} subtitle="Acumulado en el periodo" icon={Truck} color="#3b82f6" />
        <StatCard title="Horas de Práctica" value={`${kpis.hrsTotal} hrs`} subtitle="Acumulado en el periodo" icon={Activity} color="#10b981" />
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#0f172a', margin: '0 0 20px 0', fontWeight: 700 }}>Kilómetros y Horas por Líder</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <ComposedChart data={dataLideres} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="km" name="Kilómetros" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="horas" name="Horas" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#0f172a', margin: '0 0 20px 0', fontWeight: 700 }}>Evolución General del Rendimiento</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <AreaChart data={dataDesempeno} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="km" name="Kilómetros" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorKm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>Avance de Metas por Alumno (Detalle)</h2>
          <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Mostrando {datosFiltrados.length} alumnos</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Alumno / Gen</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Líder / U.N.</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Progreso Kilómetros</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Progreso Horas</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Tiempos (Asig. / Muerto)</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay datos para los filtros seleccionados</td></tr>
              ) : (
                datosFiltrados.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.generacion}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{a.lider}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.un}</div>
                    </td>
                    <td style={{ padding: '16px 24px', minWidth: '200px' }}>
                      <ProgressBar current={a.kmActual} target={a.kmMeta} label="KM" color="#3b82f6" />
                    </td>
                    <td style={{ padding: '16px 24px', minWidth: '200px' }}>
                      <ProgressBar current={a.hrsActual} target={a.hrsMeta} label="HRS" color="#10b981" />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div title="Días para asignar tutor" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: a.diasAsignacion > 3 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          <Clock size={14}/> {a.diasAsignacion}d
                        </div>
                        <div title="Días sin manejar" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: a.diasSinManejo > 5 ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                          <AlertTriangle size={14}/> {a.diasSinManejo}d
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}