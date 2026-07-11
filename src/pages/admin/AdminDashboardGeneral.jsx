import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, Line
} from 'recharts';
import { 
  Users, Calendar, Clock, MapPin, Target, 
  AlertTriangle, Filter, ChevronDown, Activity, Truck, Database, ShieldAlert, BookOpen, Upload, UserPlus
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
  
  // NUEVO: Estado para Catálogos Dinámicos
  const [catUnidades, setCatUnidades] = useState([]);
  const [catLideres, setCatLideres] = useState([]);
  const [catGerentes, setCatGerentes] = useState([]);
  
  const [pestañaActiva, setPestañaActiva] = useState('general');
  const [filtroFecha, setFiltroFecha] = useState('Este Mes');
  const [filtroUN, setFiltroUN] = useState('ALL');
  const [filtroGeneracion, setFiltroGeneracion] = useState('ALL');
  const [filtroLider, setFiltroLider] = useState('ALL');
  const [filtroGerente, setFiltroGerente] = useState('ALL');

  useEffect(() => {
    const cargarDatosCentrales = async () => {
      try {
        const [resU, resV, resUn, resLid, resGer] = await Promise.all([
          supabase.from('usuarios').select('id, rol, nombre_completo, unidad_negocio, generacion, lider, gerente, etapa_actual, estatus, tutor_opt, created_at, fecha_entrega_operacion, fecha_inicio_opt'),
          supabase.from('viajes_diarios').select('id_alumno, km_recorridos, tiempo_total_minutos, hora_inicio'),
          supabase.from('cat_unidades').select('nombre'),
          supabase.from('cat_lideres').select('nombre'),
          supabase.from('cat_gerentes').select('nombre')
        ]);
        if (!resU.error) setUsuarios(resU.data || []);
        if (!resV.error) setViajes(resV.data || []);
        if (!resUn.error) setCatUnidades(resUn.data.map(u => u.nombre));
        if (!resLid.error) setCatLideres(resLid.data.map(l => l.nombre));
        if (!resGer.error) setCatGerentes(resGer.data.map(g => g.nombre));
        
        setDbStatus('Base de Datos Conectada'); setDbColor('#10b981');
      } catch (err) {
        setDbStatus('Error de Conexión DB'); setDbColor('#ef4444');
      }
    };
    cargarDatosCentrales();
  }, []);

  const generacionesUnicas = useMemo(() => [...new Set(usuarios.map(u => u.generacion).filter(Boolean))], [usuarios]);

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

      let diasAsignacion = a.tutor_opt ? 0 : 5;
      
      const fechaInicioReal = a.fecha_entrega_operacion || a.fecha_inicio_opt || a.created_at;
      const diasDesdeEntrega = fechaInicioReal ? Math.max(0, Math.floor((new Date().getTime() - new Date(fechaInicioReal).getTime()) / (1000 * 60 * 60 * 24))) : 0;
      let diasAtraso = 0;

      if (diasDesdeEntrega >= 56 && a.etapa_actual !== 'Certificado') {
        diasAtraso = diasDesdeEntrega - 56;
        alertas.unshift(`🚨 ALERTA DIRECTIVA - CERTIFICACIÓN VENCIDA: ${a.nombre_completo} excedió las 8 semanas. Lleva ${diasAtraso} días extra.`);
      }

      alumnosProcesados.push({
        ...a,
        kmActual: kmAcumulados,
        kmMeta: 4000,
        hrsActual: parseFloat((minsAcumulados / 60).toFixed(1)),
        hrsMeta: 100,
        diasAsignacion: diasAsignacion,
        diasSinManejo: diasSinManejar,
        diasAtrasoCertificacion: diasAtraso,
        un: a.unidad_negocio || 'S/A'
      });
    });

    const filtrados = alumnosProcesados.filter(a => {
      return (filtroUN === 'ALL' || a.un === filtroUN) &&
             (filtroGeneracion === 'ALL' || a.generacion === filtroGeneracion) &&
             (filtroLider === 'ALL' || a.lider === filtroLider) &&
             (filtroGerente === 'ALL' || a.gerente === filtroGerente);
    });

    const agrupadoLideres = filtrados.reduce((acc, a) => {
        const lid = a.lider || "Sin Asignar";
        if (!acc[lid]) acc[lid] = { name: lid, km: 0, horas: 0 };
        acc[lid].km += a.kmActual;
        acc[lid].horas += a.hrsActual;
        return acc;
    }, {});

    return { datosFiltrados: filtrados, alertasIA: alertas, dataLideres: Object.values(agrupadoLideres) };
  }, [usuarios, viajes, filtroUN, filtroGeneracion, filtroLider, filtroGerente]);

  const kpis = useMemo(() => {
    if (datosFiltrados.length === 0) return { kmTotal: 0, hrsTotal: 0, promAsignacion: 0, promSinManejo: 0 };
    const kmTotal = datosFiltrados.reduce((acc, a) => acc + a.kmActual, 0);
    const hrsTotal = datosFiltrados.reduce((acc, a) => acc + a.hrsActual, 0);
    const promAsignacion = datosFiltrados.reduce((acc, a) => acc + a.diasAsignacion, 0) / datosFiltrados.length;
    const promSinManejo = datosFiltrados.reduce((acc, a) => acc + a.diasSinManejo, 0) / datosFiltrados.length;
    return { kmTotal, hrsTotal, promAsignacion: promAsignacion.toFixed(1), promSinManejo: promSinManejo.toFixed(1) };
  }, [datosFiltrados]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 900 }}>Dashboard General LARMEX</h1>
        <div style={{ display: 'flex', gap: '16px', background: '#fff', padding: '20px', borderRadius: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
          <FilterSelect icon={MapPin} label="Unidad" value={filtroUN} onChange={setFiltroUN} options={catUnidades} />
          <FilterSelect icon={Users} label="Generación" value={filtroGeneracion} onChange={setFiltroGeneracion} options={generacionesUnicas} />
          <FilterSelect icon={Target} label="Líder" value={filtroLider} onChange={setFiltroLider} options={catLideres} />
          <FilterSelect icon={Target} label="Gerente" value={filtroGerente} onChange={setFiltroGerente} options={catGerentes} />
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPestañaActiva('general')} style={{ padding: '12px', background: pestañaActiva === 'general' ? '#0f172a' : '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Vista General</button>
        <button onClick={() => setPestañaActiva('metas')} style={{ padding: '12px', background: pestañaActiva === 'metas' ? '#0f172a' : '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Avances vs Metas</button>
      </div>

      {pestañaActiva === 'general' && (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <StatCard title="Kilómetros Totales" value={`${kpis.kmTotal.toLocaleString()} km`} icon={Truck} color="#3b82f6" />
                <StatCard title="Horas Totales" value={`${kpis.hrsTotal.toLocaleString()} hrs`} icon={Activity} color="#10b981" />
            </div>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px' }}>
                <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dataLideres}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="km" fill="#3b82f6" />
                    <Line dataKey="horas" stroke="#f59e0b" />
                </ComposedChart>
                </ResponsiveContainer>
            </div>
        </>
      )}

      {pestañaActiva === 'metas' && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th>Alumno</th><th>Progreso KM</th></tr></thead>
                <tbody>{datosFiltrados.map(a => <tr key={a.id}><td>{a.nombre_completo}</td><td><ProgressBar current={a.kmActual} target={a.kmMeta} /></td></tr>)}</tbody>
            </table>
        </div>
      )}
    </div>
  );
}