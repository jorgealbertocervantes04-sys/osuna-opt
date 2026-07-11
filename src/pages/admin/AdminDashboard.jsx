import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart 
} from 'recharts';
import { 
  Users, Calendar, Clock, MapPin, Target, 
  AlertTriangle, ChevronDown, Activity, Truck, Database, 
  ShieldAlert, UserPlus, BookOpen, Upload, BarChart3
} from 'lucide-react';
import { supabase } from "../../services/supabaseClient";

// ==========================================
// COMPONENTES DE INTERFAZ (Estadísticas y Filtros)
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
// VISTA PRINCIPAL: DASHBOARD DIRECTIVO COMPLETAMENTE INTEGRADO
// ==========================================
export default function DashboardGeneral() {
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState('Conectando a LARMEX...');
  const [dbColor, setDbColor] = useState('#f59e0b');
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  // Navegación
  const [pestañaActiva, setPestañaActiva] = useState('general');

  // Datos Core de Supabase
  const [usuarios, setUsuarios] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [encuestas360, setEncuestas360] = useState([]);
  const [registrosInduccion, setRegistrosInduccion] = useState([]);

  // Catálogos Dinámicos
  const [catUnidades, setCatUnidades] = useState([]);
  const [catLideres, setCatLideres] = useState([]);
  const [catGerentes, setCatGerentes] = useState([]);

  // Filtros Superiores
  const [filtroFecha, setFiltroFecha] = useState('Este Mes');
  const [filtroUN, setFiltroUN] = useState('ALL');
  const [filtroGeneracion, setFiltroGeneracion] = useState('ALL');
  const [filtroLider, setFiltroLider] = useState('ALL');
  const [filtroGerente, setFiltroGerente] = useState('ALL');

  // Formularios de Altas Corporativas
  const [tipoAlta, setTipoAlta] = useState('Alumno');
  const [formAlumno, setFormAlumno] = useState({ matricula: '', nombre_completo: '', celular: '', generacion: '', fecha_entrega_empresa: '' });
  const [formPersonal, setFormPersonal] = useState({ nombre_completo: '', rol: 'Lider', unidad_negocio: '' });
  const [formUN, setFormUN] = useState({ nombre_unidad: '' });

  // Formulario Biblioteca
  const [tituloMaterial, setTituloMaterial] = useState('');
  const [descMaterial, setDescMaterial] = useState('');
  const [urlMaterial, setUrlMaterial] = useState('');
  const [dirigidoA, setDirigidoA] = useState('Alumno');

  // CARGA DE DATOS BLINDADA (Sin dataService, puro Supabase directo)
  const extraerInformacionSupabase = async () => {
    setCargando(true);
    try {
      const [resU, resV, resC, resI, resUn, resLid, resGer] = await Promise.all([
        supabase.from('usuarios').select('id, rol, nombre_completo, numero_empleado, unidad_negocio, gerente, lider, tutor_opt, etapa_actual, estatus, generacion, created_at, fecha_entrega_operacion, fecha_inicio_opt'),
        supabase.from('viajes_diarios').select('id_alumno, km_recorridos, tiempo_total_minutos, hora_inicio'),
        supabase.from('encuestas').select('id_alumno, calificacion_general'),
        supabase.from('registros_induccion').select('*'),
        supabase.from('cat_unidades').select('nombre'),
        supabase.from('cat_lideres').select('nombre'),
        supabase.from('cat_gerentes').select('nombre')
      ]);

      setUsuarios(resU.data || []);
      setViajes(resV.data || []);
      setEncuestas360(resC.data || []);
      setRegistrosInduccion(resI.data || []);
      
      setCatUnidades(resUn.data ? resUn.data.map(i => i.nombre) : []);
      setCatLideres(resLid.data ? resLid.data.map(i => i.nombre) : []);
      setCatGerentes(resGer.data ? resGer.data.map(i => i.nombre) : []);

      setDbStatus('Online - Servidores Sincronizados');
      setDbColor('#10b981');
    } catch (err) {
      console.error(err);
      setDbStatus('Error en Infraestructura');
      setDbColor('#ef4444');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    extraerInformacionSupabase();
  }, []);

  const generacionesUnicas = useMemo(() => {
    return [...new Set(usuarios.map(u => u.generacion).filter(Boolean))].sort();
  }, [usuarios]);

  // MOTOR DINÁMICO DE FILTRADO Y CÁLCULOS
  const analiticaProcesada = useMemo(() => {
    let alertasIA = [];
    let comparativoUN = {};
    let comparativoGerentes = {};
    let comparativoLideres = {};

    const soloAlumnos = usuarios.filter(u => u.rol === 'Alumno' && u.estatus !== 'Baja');
    
    // Fechas para el filtro
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    const alumnosModificados = soloAlumnos.map(alumno => {
      // Filtro de Viajes por Fecha
      const misViajes = viajes.filter(v => {
        if (v.id_alumno !== alumno.id) return false;
        if (filtroFecha === 'Todo el Historial') return true;
        if (!v.hora_inicio) return false;
        const fechaViaje = new Date(v.hora_inicio);
        if (filtroFecha === 'Hoy') return fechaViaje.toDateString() === hoy.toDateString();
        if (filtroFecha === 'Esta Semana') return fechaViaje >= inicioSemana;
        if (filtroFecha === 'Este Mes') return fechaViaje >= inicioMes;
        return true;
      });

      const misQuejas = encuestas360.filter(q => q.id_alumno === alumno.id && q.calificacion_general <= 2);
      const kmTotales = misViajes.reduce((sum, v) => sum + (parseFloat(v.km_recorridos) || 0), 0);
      const minsTotales = misViajes.reduce((sum, v) => sum + (parseFloat(v.tiempo_total_minutos) || 0), 0);

      // Tiempos Muertos y Asignación
      let diasSinOPT = !alumno.tutor_opt ? 5 : 0;
      let diasSinManejar = 0;
      const todosSusViajes = viajes.filter(v => v.id_alumno === alumno.id); // Usamos todos para ver inactividad real
      if (todosSusViajes.length > 0) {
        const ultimoViaje = Math.max(...todosSusViajes.map(v => new Date(v.hora_inicio || Date.now()).getTime()));
        diasSinManejar = Math.max(0, Math.floor((hoy.getTime() - ultimoViaje) / (1000 * 60 * 60 * 24)));
      } else if (alumno.etapa_actual === 'OPT') {
        diasSinManejar = 10;
      }

      // Certificación y Alertas
      const fechaInicioReal = alumno.fecha_entrega_operacion || alumno.fecha_inicio_opt || alumno.created_at;
      const diasDesdeEntrega = fechaInicioReal ? Math.max(0, Math.floor((hoy.getTime() - new Date(fechaInicioReal).getTime()) / (1000 * 60 * 60 * 24))) : 0;
      let diasAtrasoCertificacion = 0;
      let alertaCritica = false;

      if (diasDesdeEntrega >= 56 && alumno.etapa_actual !== 'Certificado') {
        diasAtrasoCertificacion = diasDesdeEntrega - 56;
        alertaCritica = true;
      }

      let riesgoBaja = (diasSinManejar > 5 ? 40 : 0) + (diasSinOPT > 4 ? 30 : 0) + (misQuejas.length > 0 ? 30 : 0) + (alertaCritica ? 50 : 0);

      if (alertaCritica) {
        alertasIA.unshift({ tipo: 'cert', texto: `🚨 URGENTE: ${alumno.nombre_completo} excedió las 8 semanas. Atraso de ${diasAtrasoCertificacion} días.` });
      } else if (riesgoBaja >= 60) {
        alertasIA.push({ tipo: 'riesgo', texto: `⚠️ Riesgo (${riesgoBaja}%): ${alumno.nombre_completo} lleva ${diasSinManejar} días inactivo.` });
      }

      return {
        ...alumno,
        kmReal: kmTotales,
        hrsReal: parseFloat((minsTotales / 60).toFixed(1)),
        kmMeta: 4000,
        hrsMeta: 100,
        diasSinOPT,
        diasSinManejar,
        diasAtrasoCertificacion,
        riesgo: riesgoBaja
      };
    });

    // APLICAR FILTROS SUPERIORES
    const listaFiltrada = alumnosModificados.filter(a => {
      const unMatch = filtroUN === 'ALL' || a.unidad_negocio === filtroUN;
      const genMatch = filtroGeneracion === 'ALL' || a.generacion === filtroGeneracion;
      const gerMatch = filtroGerente === 'ALL' || a.gerente === filtroGerente;
      const lidMatch = filtroLider === 'ALL' || a.lider === filtroLider;
      return unMatch && genMatch && gerMatch && lidMatch;
    });

    // CONSTRUIR GRÁFICAS
    listaFiltrada.forEach(a => {
      const unName = a.unidad_negocio || "No Asignada";
      if (!comparativoUN[unName]) comparativoUN[unName] = { name: unName, kmReal: 0, metaKm: 0 };
      comparativoUN[unName].kmReal += a.kmReal; comparativoUN[unName].metaKm += 4000;

      const gerName = a.gerente || "Sin Gerente";
      if (!comparativoGerentes[gerName]) comparativoGerentes[gerName] = { name: gerName, kmReal: 0, metaKm: 0 };
      comparativoGerentes[gerName].kmReal += a.kmReal; comparativoGerentes[gerName].metaKm += 4000;

      const lidName = a.lider || "Sin Líder";
      if (!comparativoLideres[lidName]) comparativoLideres[lidName] = { name: lidName, km: 0, horas: 0 };
      comparativoLideres[lidName].km += a.kmReal; comparativoLideres[lidName].horas += a.hrsReal;
    });

    return { 
      listaFiltrada, alertasIA, 
      chartUN: Object.values(comparativoUN), 
      chartGerentes: Object.values(comparativoGerentes),
      chartLideres: Object.values(comparativoLideres)
    };
  }, [usuarios, viajes, encuestas360, filtroUN, filtroGeneracion, filtroGerente, filtroLider, filtroFecha]);

  const kpis = useMemo(() => {
    if (analiticaProcesada.listaFiltrada.length === 0) return { kmTotal: 0, hrsTotal: 0, promAsignacion: 0, promSinManejo: 0 };
    const kmTotal = analiticaProcesada.listaFiltrada.reduce((acc, a) => acc + a.kmReal, 0);
    const hrsTotal = analiticaProcesada.listaFiltrada.reduce((acc, a) => acc + a.hrsReal, 0);
    const promAsignacion = analiticaProcesada.listaFiltrada.reduce((acc, a) => acc + a.diasSinOPT, 0) / analiticaProcesada.listaFiltrada.length;
    const promSinManejo = analiticaProcesada.listaFiltrada.reduce((acc, a) => acc + a.diasSinManejar, 0) / analiticaProcesada.listaFiltrada.length;
    return { kmTotal, hrsTotal, promAsignacion: promAsignacion.toFixed(1), promSinManejo: promSinManejo.toFixed(1) };
  }, [analiticaProcesada.listaFiltrada]);

  // FUNCIONES DE ALTAS Y MATERIALES
  const ejecutarAltaCorporativa = async (e) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      let payload = {};
      if (tipoAlta === 'Alumno') {
        if (!formAlumno.matricula || !formAlumno.nombre_completo || !formAlumno.celular || !formAlumno.generacion || !formAlumno.fecha_entrega_empresa) {
          setSubiendo(false); return alert("⚠️ Todos los campos del alumno son obligatorios.");
        }
        payload = {
          numero_empleado: formAlumno.matricula, nombre_completo: formAlumno.nombre_completo, telefono: formAlumno.celular,
          generacion: formAlumno.generacion, fecha_entrega_operacion: new Date(formAlumno.fecha_entrega_empresa).toISOString(),
          rol: 'Alumno', etapa_actual: 'Prueba Intermedia', estatus: 'En proceso'
        };
        const { error } = await supabase.from('usuarios').insert([payload]);
        if (error) throw error;
      } else if (tipoAlta === 'UN') {
        if (!formUN.nombre_unidad) { setSubiendo(false); return alert("Ingresa el nombre."); }
        const { error } = await supabase.from('cat_unidades').insert([{ nombre: formUN.nombre_unidad }]);
        if (error) throw error;
      } else if (tipoAlta === 'Lider') {
        if (!formPersonal.nombre_completo) { setSubiendo(false); return alert("Ingresa el nombre."); }
        const { error } = await supabase.from('cat_lideres').insert([{ nombre: formPersonal.nombre_completo }]);
        if (error) throw error;
      } else if (tipoAlta === 'Gerente') {
        if (!formPersonal.nombre_completo) { setSubiendo(false); return alert("Ingresa el nombre."); }
        const { error } = await supabase.from('cat_gerentes').insert([{ nombre: formPersonal.nombre_completo }]);
        if (error) throw error;
      } else if (tipoAlta === 'Staff') {
        if (!formPersonal.nombre_completo) { setSubiendo(false); return alert("Ingresa el nombre."); }
        const { error } = await supabase.from('usuarios').insert([{ nombre_completo: formPersonal.nombre_completo, rol: 'Admin' }]);
        if (error) throw error;
      }

      alert(`✓ Alta de ${tipoAlta} registrada exitosamente.`);
      setFormAlumno({ matricula: '', nombre_completo: '', celular: '', generacion: '', fecha_entrega_empresa: '' });
      setFormPersonal({ nombre_completo: '', rol: 'Lider', unidad_negocio: '' });
      setFormUN({ nombre_unidad: '' });
      extraerInformacionSupabase(); 
    } catch (err) {
      alert("Error en el servidor: " + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const publicarMaterialEstudio = async (e) => {
    e.preventDefault();
    if (!tituloMaterial || !urlMaterial) return alert("Campos obligatorios vacíos.");
    const payload = { titulo: tituloMaterial, descripcion: descMaterial, url_documento_video: urlMaterial, dirigido_a: dirigidoA, semana_asignada: 1, created_at: new Date().toISOString() };
    const { error } = await supabase.from('material_estudio').insert([payload]);
    if (!error) { alert("✓ Material publicado exitosamente."); setTituloMaterial(''); setDescMaterial(''); setUrlMaterial(''); }
  };

  if (cargando) return <h2 style={{ color: '#0f172a', textAlign: 'center', marginTop: '100px' }}>Desplegando Torre de Control...</h2>;

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER Y FILTROS GLOBALES */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 900, letterSpacing: '-0.5px' }}>📈 LARMEX Control Tower</h1>
            <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '1rem' }}>Análisis dinámico de rendimiento, predicción de bajas y cumplimientos globales.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '8px 16px', borderRadius: '20px', border: `1px solid ${dbColor}50`, color: dbColor, fontWeight: 600, fontSize: '0.875rem' }}>
              <Database size={16} /> <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dbColor }} /> {dbStatus}
            </div>
            <button onClick={() => { localStorage.removeItem('udat_app_session'); navigate('/app'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
          <FilterSelect icon={Calendar} label="Rango de Fechas" value={filtroFecha} onChange={setFiltroFecha} options={['Hoy', 'Esta Semana', 'Este Mes', 'Todo el Historial']} />
          <FilterSelect icon={MapPin} label="Unidad de Negocio" value={filtroUN} onChange={setFiltroUN} options={catUnidades} />
          <FilterSelect icon={Users} label="Generación" value={filtroGeneracion} onChange={setFiltroGeneracion} options={generacionesUnicas} />
          <FilterSelect icon={Target} label="Líder Asignado" value={filtroLider} onChange={setFiltroLider} options={catLideres} />
          <FilterSelect icon={Target} label="Gerente" value={filtroGerente} onChange={setFiltroGerente} options={catGerentes} />
        </div>
      </header>

      {/* MENÚ DE PESTAÑAS (INTACTO) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button onClick={() => setPestañaActiva('general')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'general' ? '#0f172a' : '#fff', color: pestañaActiva === 'general' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><BarChart3 size={16} style={{marginRight: '5px', inlineSize: 'auto'}}/> Vista General Directiva</button>
        <button onClick={() => setPestañaActiva('metas')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'metas' ? '#0f172a' : '#fff', color: pestañaActiva === 'metas' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>🏆 Avances vs Metas</button>
        <button onClick={() => setPestañaActiva('altas')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'altas' ? '#0f172a' : '#fff', color: pestañaActiva === 'altas' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><UserPlus size={16} style={{marginRight: '5px', inlineSize: 'auto'}}/> Configuración e Ingresos</button>
        <button onClick={() => setPestañaActiva('induccion')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'induccion' ? '#0f172a' : '#fff', color: pestañaActiva === 'induccion' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><BookOpen size={16} style={{marginRight: '5px', inlineSize: 'auto'}}/> Auditoría Semana Inducción</button>
        <button onClick={() => setPestañaActiva('biblioteca')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'biblioteca' ? '#0f172a' : '#fff', color: pestañaActiva === 'biblioteca' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><Upload size={16} style={{marginRight: '5px', inlineSize: 'auto'}}/> Biblioteca PPT</button>
      </div>

      {/* CONTENIDO 1: VISTA GENERAL (GRÁFICAS Y ALERTAS) */}
      {pestañaActiva === 'general' && (
        <div>
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20}/> Termómetro de Riesgo e Inactividad</h3>
            {analiticaProcesada.alertasIA.length === 0 ? <p style={{color: '#10b981', margin: 0, fontWeight: 'bold'}}>✓ Flota sin riesgos inminentes detectados.</p> : analiticaProcesada.alertasIA.map((alerta, idx) => (
              <div key={idx} style={{ padding: '10px', background: '#fff', borderLeft: `4px solid ${alerta.tipo === 'cert' ? '#f87171' : '#ef4444'}`, borderRadius: '6px', marginBottom: '6px', fontSize: '13px', color: alerta.tipo === 'cert' ? '#fecaca' : '#991b1b', fontWeight: alerta.tipo === 'cert' ? 'bold' : 'normal' }}>{alerta.texto}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <StatCard title="Promedio Asignación OPT" value={`${kpis.promAsignacion} días`} subtitle="Desde inducción hasta tutor" icon={Clock} color="#8b5cf6" statusValue={kpis.promAsignacion} thresholds={{ warning: 3, critical: 6 }} inverseStatus={true} />
            <StatCard title="Tiempo Muerto Promedio" value={`${kpis.promSinManejo} días`} subtitle="Días perdidos sin manejar" icon={AlertTriangle} color="#ef4444" statusValue={kpis.promSinManejo} thresholds={{ warning: 5, critical: 10 }} inverseStatus={true} />
            <StatCard title="Kilómetros Recorridos" value={`${kpis.kmTotal.toLocaleString()} km`} subtitle={`Acumulado en el filtro actual`} icon={Truck} color="#3b82f6" />
            <StatCard title="Horas de Práctica" value={`${kpis.hrsTotal.toLocaleString()} hrs`} subtitle={`Acumulado en el filtro actual`} icon={Activity} color="#10b981" />
          </div>

          {/* GRÁFICA DE LÍDERES (Composed Chart) */}
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#0f172a', margin: '0 0 20px 0', fontWeight: 800 }}>Rendimiento Detallado por Líder</h2>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <ComposedChart data={analiticaProcesada.chartLideres} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {/* GRÁFICAS DE UNIDADES Y GERENTES (Bar Charts) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>🏢 Desempeño por Unidad de Negocio</h4>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer>
                  <BarChart data={analiticaProcesada.chartUN}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="kmReal" name="KM Reales" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="metaKm" name="Meta Exigida" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>👨‍💼 Cumplimiento por Gerente</h4>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer>
                  <BarChart data={analiticaProcesada.chartGerentes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="kmReal" name="KM Reales" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="metaKm" name="Meta Exigida" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: AVANCES VS METAS (TABLA DETALLADA) */}
      {pestañaActiva === 'metas' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>Avance de Metas por Alumno (Detalle)</h2>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Mostrando {analiticaProcesada.listaFiltrada.length} alumnos</span>
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
                {analiticaProcesada.listaFiltrada.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay datos para los filtros seleccionados</td></tr>
                ) : (
                  analiticaProcesada.listaFiltrada.map((a) => (
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
      )}

      {/* CONTENIDO 3: CONFIGURACIÓN E INGRESOS (FORMULARIOS) */}
      {pestañaActiva === 'altas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Estructura de Ingresos</h4>
            {['Alumno', 'Lider', 'Gerente', 'Staff', 'UN'].map(tipo => (
              <button key={tipo} onClick={() => setTipoAlta(tipo)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: tipoAlta === tipo ? '#0f172a' : '#fff', color: tipoAlta === tipo ? '#fff' : '#1e293b', fontWeight: 'bold', marginBottom: '8px', textAlign: 'left', cursor: 'pointer' }}>
                {tipo === 'Alumno' && '👨‍🎓 Ingresar Nuevo Alumno'}
                {tipo === 'Lider' && '💼 Registrar Líder Operativo'}
                {tipo === 'Gerente' && '👔 Registrar Gerente'}
                {tipo === 'Staff' && '🛠️ Registrar Staff Administrativo'}
                {tipo === 'UN' && '🏢 Crear Unidad de Negocio'}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3>Formulario de Alta Oficial: {tipoAlta.toUpperCase()}</h3>
            <form onSubmit={ejecutarAltaCorporativa} style={{ marginTop: '20px' }}>
              
              {tipoAlta === 'Alumno' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Matrícula Empleado:</label>
                      <input type="text" value={formAlumno.matricula} onChange={e => setFormAlumno({...formAlumno, matricula: e.target.value})} placeholder="Ej. LMX-9940" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Número de Celular:</label>
                      <input type="text" value={formAlumno.celular} onChange={e => setFormAlumno({...formAlumno, celular: e.target.value})} placeholder="Ej. 8110223344" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nombre Completo del Operador:</label>
                    <input type="text" value={formAlumno.nombre_completo} onChange={e => setFormAlumno({...formAlumno, nombre_completo: e.target.value})} placeholder="Nombre y Apellidos" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Generación Asignada:</label>
                      <input type="text" value={formAlumno.generacion} onChange={e => setFormAlumno({...formAlumno, generacion: e.target.value})} placeholder="Ej. Gen 24-B" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Fecha Entrega a Empresa:</label>
                      <input type="date" value={formAlumno.fecha_entrega_empresa} onChange={e => setFormAlumno({...formAlumno, fecha_entrega_empresa: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              )}

              {tipoAlta === 'UN' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nombre Comercial de la Unidad:</label>
                  <input type="text" value={formUN.nombre_unidad} onChange={e => setFormUN({nombre_unidad: e.target.value})} placeholder="Ej. Hub Nuevo Laredo" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px', boxSizing: 'border-box' }} />
                </div>
              )}

              {(tipoAlta === 'Lider' || tipoAlta === 'Gerente' || tipoAlta === 'Staff') && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nombre Completo:</label>
                    <input type="text" value={formPersonal.nombre_completo} onChange={e => setFormPersonal({...formPersonal, nombre_completo: e.target.value})} placeholder="Ej. Ing. Armando Casas" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={subiendo} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {subiendo ? 'Registrando en Base Central...' : 'Confirmar Registro Oficial'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONTENIDO 4: INDUCCIÓN */}
      {pestañaActiva === 'induccion' && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>Control y Registro de Capacitación Teórica (Semana 1)</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-5px', marginBottom: '20px' }}>Datos recabados directamente de las notificaciones diarias completadas por los alumnos.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr style={{ color: '#475569' }}>
                  <th style={{ padding: '12px' }}>ID Alumno</th>
                  <th style={{ padding: '12px' }}>Tema Recibido en Inducción</th>
                  <th style={{ padding: '12px' }}>Duración Asignada</th>
                  <th style={{ padding: '12px' }}>Fecha de Validación</th>
                </tr>
              </thead>
              <tbody>
                {registrosInduccion.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No hay registros de bitácoras teóricas de inducción completados.</td></tr>
                ) : registrosInduccion.map(reg => (
                  <tr key={reg.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{reg.id_alumno}</td>
                    <td style={{ padding: '12px' }}>{reg.tema_visto}</td>
                    <td style={{ padding: '12px', color: '#4f46e5', fontWeight: 'bold' }}>{reg.duracion_minutos} minutos</td>
                    <td style={{ padding: '12px' }}>{new Date(reg.fecha_registro).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO 5: BIBLIOTECA */}
      {pestañaActiva === 'biblioteca' && (
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{marginTop: 0}}>Cargar Presentaciones Corporativas (PPT / PDF)</h3>
          <form onSubmit={publicarMaterialEstudio} style={{ marginTop: '15px' }}>
            <input type="text" value={tituloMaterial} onChange={e => setTituloMaterial(e.target.value)} placeholder="Título del archivo o manual..." style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            <input type="text" value={descMaterial} onChange={e => setDescMaterial(e.target.value)} placeholder="Descripción breve..." style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            <input type="url" value={urlMaterial} onChange={e => setUrlMaterial(e.target.value)} placeholder="URL del archivo en Drive o OneDrive..." style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Destinatarios del Contenido:</label>
            <select value={dirigidoA} onChange={e => setDirigidoA(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="Alumno">Solo Alumnos (OPT)</option>
              <option value="Tutor">Solo Tutores Certificados</option>
              <option value="Ambos">Ambos Roles (Acceso General)</option>
            </select>

            <button type="submit" style={{ width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Publicar Material en la Biblioteca</button>
          </form>
        </div>
      )}
    </div>
  );
}