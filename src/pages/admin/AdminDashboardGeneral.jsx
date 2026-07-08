import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, AreaChart, Area
} from 'recharts';
import { 
  Users, Calendar, Clock, MapPin, Target, 
  AlertTriangle, Filter, ChevronDown, Activity, Truck, Database, ShieldAlert
} from 'lucide-react';
import { supabase } from "../../services/supabaseClient";

// ==========================================
// COMPONENTES DE UI
// ==========================================
const FilterSelect = ({ icon: Icon, label, options, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={12} /> {label}
    </label>
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', appearance: 'none', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.875rem', fontWeight: 500, outline: 'none', cursor: 'pointer' }}>
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
      <div style={{ background: `${color}15`, padding: '12px', borderRadius: '12px', color: color }}><Icon size={24} /></div>
      {statusValue !== undefined && thresholds && <Semaforo value={statusValue} thresholds={thresholds} inverse={inverseStatus} />}
    </div>
    <div>
      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.875rem', fontWeight: 900 }}>{value}</h3>
      <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>{title}</p>
      {subtitle && <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>{subtitle}</p>}
    </div>
  </div>
);

const ProgressBar = ({ current, target, label, color = "#3b82f6" }) => {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>
        <span style={{ color: '#475569' }}>{label}</span>
        <span style={{ color: color }}>{current.toLocaleString()} / {target.toLocaleString()} ({percentage}%)</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.5s ease-in-out' }} />
      </div>
    </div>
  );
};

// ==========================================
// VISTA PRINCIPAL: DASHBOARD DIRECTIVO
// ==========================================
export default function DashboardGeneral() {
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState('Conectando a Supabase...');
  const [dbColor, setDbColor] = useState('#f59e0b');
  
  const [usuarios, setUsuarios] = useState([]);
  const [viajes, setViajes] = useState([]);
  
  const [filtroFecha, setFiltroFecha] = useState('Este Mes');
  const [filtroUN, setFiltroUN] = useState('ALL');
  const [filtroGeneracion, setFiltroGeneracion] = useState('ALL');
  const [filtroLider, setFiltroLider] = useState('ALL');

  useEffect(() => {
    const cargarDatosCentrales = async () => {
      try {
        const [resU, resV] = await Promise.all([
          // OPTIMIZADO: Consulta ligera para evitar Timeout (Error 500)
          supabase.from('usuarios').select('id, rol, nombre_completo, unidad_negocio, generacion, lider, etapa_actual, estatus, tutor_opt, created_at, fecha_entrega_operacion, fecha_inicio_opt'),
          supabase.from('viajes_diarios').select('id_alumno, km_recorridos, tiempo_total_minutos, hora_inicio')
        ]);
        if (!resU.error) setUsuarios(resU.data || []);
        if (!resV.error) setViajes(resV.data || []);
        setDbStatus('Base de Datos Conectada'); setDbColor('#10b981');
      } catch (err) {
        setDbStatus('Error de Conexión DB'); setDbColor('#ef4444');
      }
    };
    cargarDatosCentrales();
  }, []);

  const { datosFiltrados, alertasIA, dataLideres } = useMemo(() => {
    let alumnosProcesados = [];
    let alertas = [];
    
    const soloAlumnos = usuarios.filter(u => u.rol === 'Alumno' && u.estatus !== 'Baja');
    
    soloAlumnos.forEach(a => {
      const misViajes = viajes.filter(v => v.id_alumno === a.id);
      const kmAcumulados = misViajes.reduce((sum, v) => sum + (parseFloat(v.km_recorridos) || 0), 0);
      const minsAcumulados = misViajes.reduce((sum, v) => sum + (parseFloat(v.tiempo_total_minutos) || 0), 0);
      
      let diasSinManejar = misViajes.length > 0 
        ? Math.max(0, Math.floor((new Date().getTime() - Math.max(...misViajes.map(v => new Date(v.hora_inicio).getTime()))) / (1000 * 60 * 60 * 24)))
        : 10;

      let diasAsignacion = a.tutor ? 0 : 5;
      
      // MOTOR DE CERTIFICACIÓN 8 SEMANAS
      const fechaInicioReal = a.fecha_entrega_operacion || a.fecha_inicio_opt || a.created_at;
      const diasDesdeEntrega = fechaInicioReal ? Math.max(0, Math.floor((new Date().getTime() - new Date(fechaInicioReal).getTime()) / (1000 * 60 * 60 * 24))) : 0;
      let diasAtraso = 0;

      if (diasDesdeEntrega >= 56 && a.etapa_actual !== 'Certificado') {
        diasAtraso = diasDesdeEntrega - 56;
        alertas.unshift(`🚨 ALERTA DIRECTIVA - CERTIFICACIÓN VENCIDA: El operador ${a.nombre_completo} (${a.generacion || 'S/A'}) excedió las 8 semanas límite. Lleva ${diasAtraso} días extra operando sin certificación final.`);
      } else {
        let riesgoScore = (diasSinManejar > 5 ? 40 : 0) + (diasAsignacion > 3 ? 30 : 0);
        if (riesgoScore >= 60) {
          alertas.push(`⚠️ Riesgo Crítico (${riesgoScore}%): El operador ${a.nombre_completo} acumula demasiados días de inactividad.`);
        }
      }

      alumnosProcesados.push({
        id: a.id,
        nombre: a.nombre_completo,
        un: a.unidad_negocio || 'S/A',
        generacion: a.generacion || 'S/A',
        lider: a.lider || 'S/A',
        etapa: a.etapa_actual,
        kmActual: kmAcumulados,
        kmMeta: 4000,
        hrsActual: parseFloat((minsAcumulados / 60).toFixed(1)),
        hrsMeta: 100,
        diasAsignacion: diasAsignacion,
        diasSinManejo: diasSinManejar,
        diasAtrasoCertificacion: diasAtraso
      });
    });

    const filtrados = alumnosProcesados.filter(a => {
      const matchUN = filtroUN === 'ALL' || a.un === filtroUN;
      const matchGen = filtroGeneracion === 'ALL' || a.generacion === filtroGeneracion;
      const matchLider = filtroLider === 'ALL' || a.lider === filtroLider;
      return matchUN && matchGen && matchLider;
    });

    const agrupadoLideres = filtrados.reduce((acc, a) => {
      if (!acc[a.lider]) acc[a.lider] = { name: a.lider, km: 0, horas: 0 };
      acc[a.lider].km += a.kmActual;
      acc[a.lider].horas += a.hrsActual;
      return acc;
    }, {});

    return { datosFiltrados: filtrados, alertasIA: alertas, dataLideres: Object.values(agrupadoLideres) };
  }, [usuarios, viajes, filtroUN, filtroGeneracion, filtroLider]);

  const kpis = useMemo(() => {
    if (datosFiltrados.length === 0) return { kmTotal: 0, hrsTotal: 0, promAsignacion: 0, promSinManejo: 0 };
    const kmTotal = datosFiltrados.reduce((acc, a) => acc + a.kmActual, 0);
    const hrsTotal = datosFiltrados.reduce((acc, a) => acc + a.hrsActual, 0);
    const promAsignacion = datosFiltrados.reduce((acc, a) => acc + a.diasAsignacion, 0) / datosFiltrados.length;
    const promSinManejo = datosFiltrados.reduce((acc, a) => acc + a.diasSinManejo, 0) / datosFiltrados.length;
    return { kmTotal, hrsTotal, promAsignacion: promAsignacion.toFixed(1), promSinManejo: promSinManejo.toFixed(1) };
  }, [datosFiltrados]);

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 900, letterSpacing: '-0.5px' }}>
              Dashboard de Alta Dirección LARMEX
            </h1>
            <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '1rem' }}>
              Análisis dinámico de rendimiento, predicción de bajas y cumplimientos globales.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '8px 16px', borderRadius: '20px', border: `1px solid ${dbColor}50`, color: dbColor, fontWeight: 600, fontSize: '0.875rem' }}>
              <Database size={16} /> <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dbColor }} /> {dbStatus}
            </div>
            <button onClick={() => { localStorage.removeItem('udat_app_session'); navigate('/app'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Cerrar Sesión Segura
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
          <FilterSelect icon={Calendar} label="Rango de Fechas" value={filtroFecha} onChange={setFiltroFecha} options={['Hoy', 'Esta Semana', 'Este Mes']} />
          <FilterSelect icon={MapPin} label="Unidad de Negocio" value={filtroUN} onChange={setFiltroUN} options={['Monterrey', 'Nuevo Laredo', 'Tijuana']} />
          <FilterSelect icon={Users} label="Generación" value={filtroGeneracion} onChange={setFiltroGeneracion} options={['Gen 24-A', 'Gen 24-B']} />
          <FilterSelect icon={Target} label="Líder Asignado" value={filtroLider} onChange={setFiltroLider} options={['Carlos Ruiz', 'María Silva', 'Jorge Ramos']} />
        </div>
      </header>

      <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20}/> Termómetro de Riesgo e Inactividad</h3>
        {alertasIA.length === 0 ? <p style={{color: '#10b981', margin: 0, fontWeight: 'bold'}}>✓ Flota sin riesgos inminentes detectados.</p> : alertasIA.map((alerta, idx) => (
          <div key={idx} style={{ padding: '10px', background: '#fff', borderLeft: '4px solid #ef4444', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', color: '#991b1b' }}>{alerta}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Promedio Asignación OPT" value={`${kpis.promAsignacion} días`} subtitle="Desde inducción hasta tutor" icon={Clock} color="#8b5cf6" statusValue={kpis.promAsignacion} thresholds={{ warning: 3, critical: 6 }} inverseStatus={true} />
        <StatCard title="Tiempo Muerto Promedio" value={`${kpis.promSinManejo} días`} subtitle="Días perdidos sin manejar" icon={AlertTriangle} color="#ef4444" statusValue={kpis.promSinManejo} thresholds={{ warning: 5, critical: 10 }} inverseStatus={true} />
        <StatCard title="Kilómetros Recorridos" value={`${kpis.kmTotal.toLocaleString()} km`} subtitle="Acumulado global" icon={Truck} color="#3b82f6" />
        <StatCard title="Horas de Práctica" value={`${kpis.hrsTotal.toLocaleString()} hrs`} subtitle="Acumulado global" icon={Activity} color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#0f172a', margin: '0 0 20px 0', fontWeight: 800 }}>Kilómetros y Horas Generados por Líder</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <ComposedChart data={dataLideres} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="km" name="Kilómetros" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="horas" name="Horas" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>Avance de Metas por Alumno (Detalle)</h2>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Mostrando {datosFiltrados.length} alumnos</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Alumno / Gen</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Líder / U.N.</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Progreso KM</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Progreso Horas</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Tiempos Muertos</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay datos para los filtros seleccionados</td></tr>
                ) : (
                  datosFiltrados.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{a.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.generacion}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{a.lider}</div>
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
                          <div title="Días para asignar tutor" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: a.diasAsignacion > 3 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                            <Clock size={14}/> {a.diasAsignacion}d Asig.
                          </div>
                          <div title="Días sin manejar" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: a.diasSinManejo > 5 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
                            <AlertTriangle size={14}/> {a.diasSinManejo}d Inact.
                          </div>
                        </div>
                        {a.diasAtrasoCertificacion > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: '#ef4444', fontWeight: 900, marginTop: '5px' }}>
                            <AlertTriangle size={14}/> +{a.diasAtrasoCertificacion}d Vencido
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}