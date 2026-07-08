import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';
import { Database, Upload, ShieldAlert, Users, Truck, Activity, UserPlus, Clock, BookOpen, BarChart3, AlertCircle, MapPin, Target } from 'lucide-react';
import { supabase } from "../../services/supabaseClient";

export default function AdminDashboard() {
  const [dbStatus, setDbStatus] = useState('Conectando a Red LARMEX...');
  const [dbColor, setDbColor] = useState('#f59e0b');
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  // Pestaña Activa de la Torre de Control
  const [pestañaActiva, setPestañaActiva] = useState('general');

  // Estados de Datos de Supabase
  const [usuarios, setUsuarios] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [encuestas360, setEncuestas360] = useState([]);
  const [registrosInduccion, setRegistrosInduccion] = useState([]);

  // Filtros Globales
  const [filtroUN, setFiltroUN] = useState('ALL');
  const [filtroGeneracion, setFiltroGeneracion] = useState('ALL');
  const [filtroGerente, setFiltroGerente] = useState('ALL');

  // Formularios de Altas Corporativas
  const [tipoAlta, setTipoAlta] = useState('Alumno');
  const [formAlumno, setFormAlumno] = useState({ matricula: '', nombre_completo: '', celular: '', generacion: '', fecha_entrega_empresa: '' });
  const [formPersonal, setFormPersonal] = useState({ nombre_completo: '', rol: 'Lider', unidad_negocio: '' });
  const [formUN, setFormUN] = useState({ nombre_unidad: '' });

  // Formulario de Biblioteca
  const [tituloMaterial, setTituloMaterial] = useState('');
  const [descMaterial, setDescMaterial] = useState('');
  const [urlMaterial, setUrlMaterial] = useState('');
  const [dirigidoA, setDirigidoA] = useState('Alumno');

  // Carga de datos de infraestructura LARMEX (OPTIMIZADA ANTI-TIMEOUT)
  const extraerInformacionSupabase = async () => {
    setCargando(true);
    try {
      const [resU, resV, resC, resI] = await Promise.all([
        supabase.from('usuarios').select('id, rol, nombre_completo, numero_empleado, unidad_negocio, gerente, lider, tutor_opt, etapa_actual, estatus, generacion, created_at, fecha_entrega_operacion, fecha_inicio_opt'),
       supabase.from('viajes_diarios').select('id_alumno, km_recorridos, tiempo_total_minutos, hora_inicio'),
        supabase.from('encuestas').select('id_alumno, calificacion_general'),
        supabase.from('registros_induccion').select('*')
      ]);

      if (!resU.error) setUsuarios(resU.data || []);
      if (!resV.error) setViajes(resV.data || []);
      if (!resC.error) setEncuestas360(resC.data || []);
      if (!resI.error) setRegistrosInduccion(resI.data || []);

      setDbStatus('Online - Servidores Sincronizados');
      setDbColor('#10b981');
    } catch (err) {
      console.error(err);
      setDbStatus('Error en Infraestructura LARMEX');
      setDbColor('#ef4444');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    extraerInformacionSupabase();
  }, []);

  // ==========================================
  // MANEJADORES DE ALTAS
  // ==========================================
  const ejecutarAltaCorporativa = async (e) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      let payload = {};
      if (tipoAlta === 'Alumno') {
        if (!formAlumno.matricula || !formAlumno.nombre_completo || !formAlumno.celular || !formAlumno.generacion || !formAlumno.fecha_entrega_empresa) {
          setSubiendo(false);
          return alert("⚠️ Todos los campos del alumno (Matrícula, Celular, Nombre, Generación y Fecha de Entrega) son obligatorios.");
        }
        payload = {
          numero_empleado: formAlumno.matricula,
          nombre_completo: formAlumno.nombre_completo,
          telefono: formAlumno.celular,
          generacion: formAlumno.generacion,
          fecha_entrega_operacion: new Date(formAlumno.fecha_entrega_empresa).toISOString(),
          rol: 'Alumno',
          etapa_actual: 'Prueba Intermedia',
          estatus: 'En proceso'
        };
      } else if (tipoAlta === 'UN') {
        if (!formUN.nombre_unidad) { setSubiendo(false); return alert("Ingresa el nombre de la unidad."); }
        payload = { nombre: formUN.nombre_unidad, tipo: 'Unidad' };
      } else {
        if (!formPersonal.nombre_completo) { setSubiendo(false); return alert("Ingresa el nombre completo."); }
        payload = { nombre_completo: formPersonal.nombre_completo, rol: formPersonal.rol, unidad_negocio: formPersonal.unidad_negocio };
      }

      const tablaDestino = tipoAlta === 'UN' ? 'catalogos_unidades' : 'usuarios';
      const { error } = await supabase.from(tablaDestino).insert([payload]);

      if (!error) {
        alert(`✓ Alta de ${tipoAlta} registrada exitosamente en el sistema.`);
        setFormAlumno({ matricula: '', nombre_completo: '', celular: '', generacion: '', fecha_entrega_empresa: '' });
        setFormPersonal({ nombre_completo: '', rol: 'Lider', unidad_negocio: '' });
        setFormUN({ nombre_unidad: '' });
        extraerInformacionSupabase(); 
      } else {
        alert("Error en inserción: " + error.message);
      }
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

  // ==========================================
  // MOTOR DE CÁLCULO LOGÍSTICO Y TIEMPOS MUERTOS
  // ==========================================
  const analiticaProcesada = useMemo(() => {
    let kmGlobales = 0;
    let alertasIA = [];
    let comparativoUN = {};
    let comparativoGerentes = {};

    const alumnosModificados = usuarios.filter(u => u.rol === 'Alumno').map(alumno => {
      const misViajes = viajes.filter(v => v.id_alumno === alumno.id);
      const misQuejas = encuestas360.filter(q => q.id_alumno === alumno.id && q.calificacion_general <= 2);
      
      const kmTotales = misViajes.reduce((sum, v) => sum + (v.km_recorridos || 0), 0);
      const minsTotales = misViajes.reduce((sum, v) => sum + (v.tiempo_total_minutos || 0), 0);
      kmGlobales += kmTotales;

      let diasSinOPT = 0;
      if (!alumno.lider || !alumno.gerente || !alumno.tutor_opt) {
        const inicio = alumno.created_at ? new Date(alumno.created_at) : new Date();
        diasSinOPT = Math.max(0, Math.floor((new Date().getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));
      }

      let diasSinManejar = 0;
      if (misViajes.length > 0) {
        const fechas = misViajes.map(v => new Date(v.hora_inicio || v.fecha_hora || Date.now()).getTime());
        const ultimoViaje = Math.max(...fechas);
        diasSinManejar = Math.max(0, Math.floor((new Date().getTime() - ultimoViaje) / (1000 * 60 * 60 * 24)));
      } else if (alumno.etapa_actual === 'OPT') {
        const inicioOPT = alumno.fecha_inicio_opt ? new Date(alumno.fecha_inicio_opt) : new Date();
        diasSinManejar = Math.max(0, Math.floor((new Date().getTime() - inicioOPT.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // MOTOR DE CERTIFICACIÓN (8 SEMANAS / 56 DÍAS)
      const fechaInicioReal = alumno.fecha_entrega_operacion || alumno.fecha_inicio_opt || alumno.created_at;
      const diasDesdeEntrega = fechaInicioReal ? Math.max(0, Math.floor((new Date().getTime() - new Date(fechaInicioReal).getTime()) / (1000 * 60 * 60 * 24))) : 0;
      let diasAtrasoCertificacion = 0;
      let alertaCriticaCertificacion = false;

      if (diasDesdeEntrega >= 56 && alumno.etapa_actual !== 'Certificado' && alumno.estatus !== 'Baja') {
        diasAtrasoCertificacion = diasDesdeEntrega - 56;
        alertaCriticaCertificacion = true;
      }

      let riesgoBaja = 0;
      if (diasSinManejar > 5) riesgoBaja += 40;
      if (diasSinOPT > 4) riesgoBaja += 30;
      if (misQuejas.length > 0) riesgoBaja += 30;
      if (alertaCriticaCertificacion) riesgoBaja += 50;

      if (alertaCriticaCertificacion) {
        alertasIA.unshift({
          id: alumno.id,
          tipo: 'certificacion',
          texto: `🚨 URGENTE - CERTIFICACIÓN VENCIDA: ${alumno.nombre_completo} superó las 8 semanas. Tiene ${diasAtrasoCertificacion} días de atraso en su operación sin ser certificado.`
        });
      } else if (riesgoBaja >= 60) {
        alertasIA.push({
          id: alumno.id,
          tipo: 'riesgo',
          texto: `⚠️ Riesgo Crítico (${riesgoBaja}%): ${alumno.nombre_completo} acumula ${diasSinManejar} días sin registros y ${diasSinOPT} días sin OPT.`
        });
      }

      const unName = alumno.unidad_negocio || "No Asignada";
      if (!comparativoUN[unName]) comparativoUN[unName] = { name: unName, kmReal: 0, metaKm: 0 };
      comparativoUN[unName].kmReal += kmTotales;
      comparativoUN[unName].metaKm += 4000;

      const gerName = alumno.gerente || "Sin Gerente";
      if (!comparativoGerentes[gerName]) comparativoGerentes[gerName] = { name: gerName, kmReal: 0, metaKm: 0 };
      comparativoGerentes[gerName].kmReal += kmTotales;
      comparativoGerentes[gerName].metaKm += 4000;

      return {
        ...alumno,
        kmReal: kmTotales,
        hrsReal: (minsTotales / 60).toFixed(1),
        diasSinOPT,
        diasSinManejar,
        riesgo: riesgoBaja
      };
    });

    const listaFiltrada = alumnosModificados.filter(a => {
      const unMatch = filtroUN === 'ALL' || a.unidad_negocio === filtroUN;
      const genMatch = filtroGeneracion === 'ALL' || a.generacion === filtroGeneracion;
      const gerMatch = filtroGerente === 'ALL' || a.gerente === filtroGerente;
      return unMatch && genMatch && gerMatch;
    });

    return { 
      listaFiltrada, 
      kmGlobales, 
      alertasIA, 
      chartUN: Object.values(comparativoUN), 
      chartGerentes: Object.values(comparativoGerentes) 
    };
  }, [usuarios, viajes, encuestas360, filtroUN, filtroGeneracion, filtroGerente]);

  if (cargando) return <h2 style={{ color: '#0f172a', textAlign: 'center', marginTop: '100px' }}>Desplegando Torre de Control Corporativa...</h2>;

  return (
    <div style={{ padding: '25px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>📈 LARMEX Control Tower & Ecosistema OPT</h1>
          <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Auditoría completa de inducción teórica, alertas de inactividad por líder y altas del personal.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '10px', borderRadius: '8px', border: `1px solid ${dbColor}50` }}>
          <Database size={16} color={dbColor} />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: dbColor }}>{dbStatus}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => setPestañaActiva('general')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'general' ? '#0f172a' : '#fff', color: pestañaActiva === 'general' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><BarChart3 size={16} style={{marginRight: '5px', inlineSize: 'auto'}}/> Vista General Directiva</button>
        <button onClick={() => setPestañaActiva('metas')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'metas' ? '#0f172a' : '#fff', color: pestañaActiva === 'metas' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>🏆 Avances vs Metas</button>
        <button onClick={() => setPestañaActiva('altas')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'altas' ? '#0f172a' : '#fff', color: pestañaActiva === 'altas' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><UserPlus size={16}/> Configuración e Ingresos</button>
        <button onClick={() => setPestañaActiva('induccion')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'induccion' ? '#0f172a' : '#fff', color: pestañaActiva === 'induccion' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><BookOpen size={16}/> Auditoría Semana Inducción</button>
        <button onClick={() => setPestañaActiva('biblioteca')} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: pestañaActiva === 'biblioteca' ? '#0f172a' : '#fff', color: pestañaActiva === 'biblioteca' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><Upload size={16}/> Biblioteca PPT</button>
      </div>

      <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}><MapPin size={12}/> Unidad de Negocio:</label>
          <select value={filtroUN} onChange={e => setFiltroUN(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid #cbd5e1' }}>
            <option value="ALL">Todas las Unidades</option><option value="Monterrey">Monterrey</option><option value="Nuevo Laredo">Nuevo Laredo</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}><Users size={12}/> Generación:</label>
          <select value={filtroGeneracion} onChange={e => setFiltroGeneracion(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid #cbd5e1' }}>
            <option value="ALL">Todas</option><option value="Gen 24-A">Gen 24-A</option><option value="Gen 24-B">Gen 24-B</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}><Target size={12}/> Gerente de Zona:</label>
          <select value={filtroGerente} onChange={e => setFiltroGerente(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid #cbd5e1' }}>
            <option value="ALL">Todos los Gerentes</option><option value="Gerente Monterrey">Gerente Monterrey</option><option value="Gerente Laredo">Gerente Laredo</option>
          </select>
        </div>
      </div>

      {pestañaActiva === 'general' && (
        <div>
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e11d48', marginBottom: '15px' }}>
              <ShieldAlert size={20} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>🧠 Semáforo e Alertas de Baja por Inactividad Logística</h3>
            </div>
            {analiticaProcesada.alertasIA.length === 0 ? (
              <p style={{fontSize: '14px', color: '#15803d'}}>✓ Indicadores óptimos: No hay riesgos latentes detectados hoy.</p>
            ) : analiticaProcesada.alertasIA.map((al, i) => (
              <div key={i} style={{ 
                padding: '12px', 
                background: al.tipo === 'certificacion' ? '#7f1d1d' : '#fff', 
                borderLeft: `4px solid ${al.tipo === 'certificacion' ? '#f87171' : '#ef4444'}`, 
                borderRadius: '6px', 
                marginBottom: '8px', 
                fontSize: '13px', 
                color: al.tipo === 'certificacion' ? '#fecaca' : '#991b1b',
                fontWeight: al.tipo === 'certificacion' ? 'bold' : 'normal'
              }}>
                {al.texto}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>🏢 Desempeño Acumulado por Unidad de Negocio</h4>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer>
                  <BarChart data={analiticaProcesada.chartUN}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="kmReal" name="KM Reales" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="metaKm" name="Meta Exigida" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>👨‍💼 Liderazgo y Cumplimiento por Gerente de Operación</h4>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer>
                  <BarChart data={analiticaProcesada.chartGerentes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
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

      {pestañaActiva === 'metas' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>Estatus de las 8 Semanas de Operación en Flota</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                <tr>
                  <th style={{ padding: '12px' }}>Operador Alumno</th>
                  <th style={{ padding: '12px' }}>Unidad / Gerente</th>
                  <th style={{ padding: '12px' }}>Etapa Actual</th>
                  <th style={{ padding: '12px' }}>Progreso de Conducción</th>
                  <th style={{ padding: '12px' }}>⚠️ Días sin OPT (Tutor)</th>
                  <th style={{ padding: '12px' }}>⏳ Días sin Conducir</th>
                </tr>
              </thead>
              <tbody>
                {analiticaProcesada.listaFiltrada.map(alumno => (
                  <tr key={alumno.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{alumno.nombre_completo} <br/><span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>Matrícula: {alumno.numero_empleado}</span></td>
                    <td style={{ padding: '12px' }}>{alumno.unidad_negocio || "No Configurada"} <br/><span style={{ fontSize: '11px', color: '#64748b' }}>Gerente: {alumno.gerente || "N/A"}</span></td>
                    <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: alumno.etapa_actual === 'OPT' ? '#dcfce7' : '#fee2e2', color: alumno.etapa_actual === 'OPT' ? '#15803d' : '#ef4444' }}>{alumno.etapa_actual}</span></td>
                    <td style={{ padding: '12px' }}><strong>{alumno.kmReal} km</strong> / {alumno.hrsReal} hrs</td>
                    <td style={{ padding: '12px', color: alumno.diasSinOPT > 4 ? '#ef4444' : '#1e293b', fontWeight: alumno.diasSinOPT > 4 ? 'bold' : 'normal' }}>
                      {alumno.diasSinOPT > 0 ? `${alumno.diasSinOPT} días perdidos` : '✓ OPT Asignado'}
                    </td>
                    <td style={{ padding: '12px', color: alumno.diasSinManejar > 5 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {alumno.diasSinManejar} días inactivo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestañaActiva === 'altas' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
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
                  <input type="text" value={formUN.nombre_unidad} onChange={e => setFormUN({nombre_unidad: e.target.value})} placeholder="Ej. Hub Nuevo Laredo" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px' }} />
                </div>
              )}

              {(tipoAlta === 'Lider' || tipoAlta === 'Gerente' || tipoAlta === 'Staff') && (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nombre Completo:</label>
                    <input type="text" value={formPersonal.nombre_completo} onChange={e => setFormPersonal({...formPersonal, nombre_completo: e.target.value})} placeholder="Ej. Ing. Armando Casas" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Unidad de Negocio Adscrito:</label>
                    <input type="text" value={formPersonal.unidad_negocio} onChange={e => setFormPersonal({...formPersonal, unidad_negocio: e.target.value})} placeholder="Ej. Monterrey" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px' }} />
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
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No hay registros de bitácoras teóricas de inducción completados en esta semana.</td></tr>
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